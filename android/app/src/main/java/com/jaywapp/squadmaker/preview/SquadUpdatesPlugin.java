package com.jaywapp.squadmaker.preview;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;
import java.lang.ref.WeakReference;
import org.json.JSONObject;

@CapacitorPlugin(name = "SquadUpdates")
public class SquadUpdatesPlugin extends Plugin {
    private static final String PREFERENCES = "squad-play-updates";
    private static final String DISMISSED_VERSION = "dismissed-version";
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private FlexibleUpdatePolicy policy = new FlexibleUpdatePolicy(false, 0);
    private SharedPreferences preferences;
    private AppUpdateManager manager;
    private InstallStateUpdatedListener installListener;
    private PluginCall activeStart;
    private PluginCall activeComplete;

    @Override public void load() {
        preferences = getContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
        boolean eligible = FlexibleUpdatePolicy.eligible(getContext().getPackageName(), BuildConfig.DEBUG, installer());
        policy = new FlexibleUpdatePolicy(eligible, preferences.getInt(DISMISSED_VERSION, 0));
        if (!eligible) return;
        try {
            manager = AppUpdateManagerFactory.create(getContext().getApplicationContext());
            WeakReference<SquadUpdatesPlugin> reference = new WeakReference<>(this);
            installListener = installState -> {
                SquadUpdatesPlugin plugin = reference.get();
                if (plugin == null) return;
                plugin.mainHandler.post(() -> {
                    if (!plugin.policy.alive()) return;
                    String status = installStatus(installState.installStatus());
                    plugin.policy.installState(status,
                        installState.bytesDownloaded(), installState.totalBytesToDownload());
                    if ("cancelled".equals(status)) plugin.persistDismissal();
                    plugin.publish();
                });
            };
            manager.registerListener(installListener);
        } catch (RuntimeException error) {
            manager = null;
            policy.reason = "update-unavailable";
            policy.status = "failed";
        }
    }

    private String installer() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                return getContext().getPackageManager().getInstallSourceInfo(getContext().getPackageName()).getInstallingPackageName();
            }
            return getContext().getPackageManager().getInstallerPackageName(getContext().getPackageName());
        } catch (Exception error) { return null; }
    }

    private static String installStatus(int value) {
        switch (value) {
            case InstallStatus.PENDING: return "pending";
            case InstallStatus.DOWNLOADING: return "downloading";
            case InstallStatus.DOWNLOADED: return "downloaded";
            case InstallStatus.INSTALLING: return "installing";
            case InstallStatus.INSTALLED: return "installed";
            case InstallStatus.CANCELED: return "cancelled";
            case InstallStatus.FAILED: return "failed";
            default: return "unknown";
        }
    }

    private JSObject state() {
        return new JSObject().put("supported", policy.supported).put("status", policy.status)
            .put("availableVersionCode", policy.availableVersionCode).put("bytesDownloaded", policy.bytesDownloaded)
            .put("totalBytes", policy.totalBytes).put("reason", policy.reason == null ? JSONObject.NULL : policy.reason)
            .put("shouldNotify", policy.shouldNotify());
    }

    private void publish() { if (policy.alive()) notifyListeners("state", state()); }
    private void resolve(PluginCall call, String status, String reason) {
        call.resolve(state().put("status", status).put("reason", reason == null ? JSONObject.NULL : reason));
    }
    private boolean hasActivity() {
        Activity activity = getActivity();
        return policy.alive() && activity != null && !activity.isFinishing() && !activity.isDestroyed();
    }

    @PluginMethod public void getState(PluginCall call) { mainHandler.post(() -> call.resolve(state())); }
    @PluginMethod public void check(PluginCall call) {
        mainHandler.post(() -> checkUpdate(call.getBoolean("manual", false), call));
    }

    private void checkUpdate(boolean manual, PluginCall call) {
        if (!policy.supported || manager == null || !hasActivity()) {
            if (call != null) call.resolve(state());
            return;
        }
        long epoch = policy.beginCheck(manual);
        if (epoch < 0) { if (call != null) call.resolve(state()); return; }
        publish();
        WeakReference<SquadUpdatesPlugin> reference = new WeakReference<>(this);
        try {
            manager.getAppUpdateInfo().addOnSuccessListener(info -> {
                SquadUpdatesPlugin plugin = reference.get();
                if (plugin == null) return;
                plugin.mainHandler.post(() -> {
                    if (plugin.policy.alive()) {
                        plugin.applyInfo(info, epoch);
                        plugin.publish();
                    }
                    if (call != null) call.resolve(plugin.state());
                    if (plugin.policy.claimMetadataRefresh()) plugin.checkUpdate(false, null);
                });
            }).addOnFailureListener(error -> {
                SquadUpdatesPlugin plugin = reference.get();
                if (plugin == null) return;
                plugin.mainHandler.post(() -> {
                    plugin.policy.checkFailed(epoch);
                    plugin.publish();
                    if (call != null) call.resolve(plugin.state());
                });
            });
        } catch (RuntimeException error) {
            policy.checkFailed(epoch);
            publish();
            if (call != null) call.resolve(state());
        }
    }

    private void applyInfo(AppUpdateInfo info, long epoch) {
        policy.info(epoch, info.availableVersionCode(), info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE,
            info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE), installStatus(info.installStatus()),
            info.bytesDownloaded(), info.totalBytesToDownload());
    }

    @PluginMethod public void startFlexible(PluginCall call) {
        mainHandler.post(() -> {
            if (!policy.supported || manager == null) { call.resolve(state()); return; }
            if (!hasActivity() || !policy.beginFlow()) { resolve(call, "skipped", "update-busy"); return; }
            activeStart = call;
            long epoch = policy.epoch();
            WeakReference<SquadUpdatesPlugin> reference = new WeakReference<>(this);
            try {
                // Every user attempt obtains a fresh AppUpdateInfo; each instance is used once.
                manager.getAppUpdateInfo().addOnSuccessListener(info -> {
                    SquadUpdatesPlugin plugin = reference.get();
                    if (plugin != null) plugin.mainHandler.post(() -> plugin.startFreshFlow(call, info, epoch));
                }).addOnFailureListener(error -> {
                    SquadUpdatesPlugin plugin = reference.get();
                    if (plugin != null) plugin.mainHandler.post(() -> plugin.finishFreshFailure(call, epoch));
                });
            } catch (RuntimeException error) { finishFreshFailure(call, epoch); }
        });
    }

    private void startFreshFlow(PluginCall call, AppUpdateInfo info, long epoch) {
        if (activeStart != call || !policy.alive()) return;
        if (!hasActivity() || !policy.foreground()) { finishStart(call, "failed", "background"); return; }
        if (!policy.accepts(epoch)) { finishStart(call, policy.status, policy.reason); return; }
        String installing = installStatus(info.installStatus());
        if (FlexibleUpdatePolicy.activeInstall(installing)) {
            policy.applyInfo(info.availableVersionCode(), false, false, installing, info.bytesDownloaded(), info.totalBytesToDownload());
            finishStart(call, installing, null);
            return;
        }
        if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE || !info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
            finishStart(call, "not-available", "flexible-unavailable"); return;
        }
        policy.availableVersionCode = info.availableVersionCode();
        WeakReference<SquadUpdatesPlugin> reference = new WeakReference<>(this);
        try {
            manager.startUpdateFlow(info, getActivity(), AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build())
                .addOnSuccessListener(result -> {
                    SquadUpdatesPlugin plugin = reference.get();
                    if (plugin == null) return;
                    plugin.mainHandler.post(() -> {
                        if (Integer.valueOf(Activity.RESULT_OK).equals(result)) plugin.finishStart(call, "pending", null);
                        else if (Integer.valueOf(Activity.RESULT_CANCELED).equals(result)) plugin.finishStart(call, "cancelled", "user-cancelled");
                        else plugin.finishStart(call, "failed", "update-failed");
                    });
                }).addOnFailureListener(error -> {
                    SquadUpdatesPlugin plugin = reference.get();
                    if (plugin != null) plugin.mainHandler.post(() -> plugin.finishStart(call, "failed", "update-failed"));
                });
        } catch (RuntimeException error) { finishStart(call, "failed", "update-failed"); }
    }

    private void finishStart(PluginCall call, String status, String reason) {
        if (activeStart != call) return;
        activeStart = null;
        policy.flowResult(status, reason);
        if ("cancelled".equals(status)) persistDismissal();
        publish();
        resolve(call, policy.alive() ? policy.status : status, policy.alive() ? policy.reason : reason);
    }

    private void finishFreshFailure(PluginCall call, long epoch) {
        if (activeStart != call) return;
        activeStart = null;
        policy.freshQueryFailed(epoch);
        publish();
        call.resolve(state());
    }

    private void persistDismissal() {
        int version = policy.dismiss();
        if (version > 0) preferences.edit().putInt(DISMISSED_VERSION, version).apply();
    }
    @PluginMethod public void dismiss(PluginCall call) {
        mainHandler.post(() -> { persistDismissal(); publish(); call.resolve(state()); });
    }

    @PluginMethod public void beginCompletion(PluginCall call) {
        mainHandler.post(() -> {
            if (!hasActivity()) { resolve(call, "skipped", "activity-unavailable"); return; }
            synchronized (SquadStoragePlugin.LOCK) {
                VerifiedStorageReceipt receipts = SquadStoragePlugin.RECEIPTS;
                String challenge = policy.beginCompletion(receipts.generation(), receipts.verified());
                if (challenge == null) { resolve(call, "skipped", "completion-unavailable"); return; }
                call.resolve(state().put("challenge", challenge));
            }
        });
    }

    @PluginMethod public void complete(PluginCall call) {
        mainHandler.post(() -> {
            if (manager == null || !hasActivity()) { resolve(call, "skipped", "update-unavailable"); return; }
            synchronized (SquadStoragePlugin.LOCK) {
                VerifiedStorageReceipt receipts = SquadStoragePlugin.RECEIPTS;
                String reason = policy.consumeCompletion(call.getString("challenge"), receipts.generation(),
                    receipts.matches(call.getString("receipt")));
                if (reason != null) { resolve(call, "skipped", reason); return; }
                receipts.consume();
                activeComplete = call;
                publish();
                WeakReference<SquadUpdatesPlugin> reference = new WeakReference<>(this);
                try {
                    manager.completeUpdate().addOnSuccessListener(result -> {
                        SquadUpdatesPlugin plugin = reference.get();
                        if (plugin != null) plugin.mainHandler.post(() -> plugin.finishComplete(call, true));
                    }).addOnFailureListener(error -> {
                        SquadUpdatesPlugin plugin = reference.get();
                        if (plugin != null) plugin.mainHandler.post(() -> plugin.finishComplete(call, false));
                    });
                } catch (RuntimeException error) { finishComplete(call, false); }
            }
        });
    }

    private void finishComplete(PluginCall call, boolean success) {
        if (activeComplete != call) return;
        activeComplete = null;
        if (!success) policy.completionFailed();
        publish();
        resolve(call, success ? "installing" : "failed", success ? null : "complete-failed");
    }

    @Override protected void handleOnResume() {
        policy.resume();
        checkUpdate(false, null);
    }
    @Override protected void handleOnPause() { policy.pause(); }
    @Override protected void handleOnDestroy() {
        policy.destroy();
        if (manager != null && installListener != null) {
            try { manager.unregisterListener(installListener); } catch (RuntimeException error) { }
        }
        if (activeStart != null) finishStart(activeStart, "failed", "plugin-destroyed");
        if (activeComplete != null) finishComplete(activeComplete, false);
    }
}
