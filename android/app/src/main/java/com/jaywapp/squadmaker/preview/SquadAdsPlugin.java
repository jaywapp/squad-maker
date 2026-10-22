package com.jaywapp.squadmaker.preview;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

@CapacitorPlugin(name = "SquadAds")
public class SquadAdsPlugin extends Plugin {
    private static final String AD_PREFERENCES = "squad-export-ads";
    private static final String LAST_SHOWN_AT = "last-shown-at";
    private static final long RETRY_DELAY_MS = 30_000L;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final ExportAdOpportunity exportOpportunity = new ExportAdOpportunity();
    private ExportAdReceipts exportReceipts;
    private Object interstitialIdentity;
    private static final ConsentAdPolicy.InitializationGate SDK = new ConsentAdPolicy.InitializationGate();
    private final ConsentAdPolicy consent = new ConsentAdPolicy(BuildConfig.ADS_TEST_ONLY);
    private ConsentInformation consentInformation;
    private PluginCall privacyCall;
    private FrameLayout bannerContainer;
    private AdView banner;
    private String status = "not-requested";
    private TextView label;
    private boolean bannerLoadRequested;
    private boolean destroyed;
    private boolean foreground;
    private boolean interstitialRequested;
    private boolean interstitialLoading;
    private InterstitialAd interstitial;
    private long loadedAtElapsed = -1;
    private long lastShownAt;
    private long nextLoadAtElapsed;
    private SharedPreferences adPreferences;
    private ShowAttempt activeShow;
    private final Runnable retryLoad = () -> prepareInterstitial();
    private final Runnable awaitSdk = () -> initializeSdk();

    private static final class ShowAttempt {
        final PluginCall call;
        final InterstitialAd ad;
        boolean shown;

        ShowAttempt(PluginCall call, InterstitialAd ad) {
            this.call = call;
            this.ad = ad;
        }
    }

    @Override
    public void load() {
        exportReceipts = ExportAdBridge.session(getActivity());
        adPreferences = getContext().getSharedPreferences(AD_PREFERENCES, Context.MODE_PRIVATE);
        lastShownAt = adPreferences.getLong(LAST_SHOWN_AT, 0);
        consentInformation = UserMessagingPlatform.getConsentInformation(getContext());
        mainHandler.post(() -> requestConsentUpdate());
    }

    private JSObject state() {
        return new JSObject().put("status", status).put("testOnly", BuildConfig.ADS_TEST_ONLY)
            .put("adsMode", BuildConfig.ADS_MODE).put("canRequestAds", consent.canRequestAds())
            .put("consentStatus", consentStatus())
            .put("privacyOptionsRequired", privacyOptionsRequired())
            .put("consentFormShowing", consent.isFormShowing());
    }

    private String consentStatus() {
        if (consentInformation == null) return "unknown";
        switch (consentInformation.getConsentStatus()) {
            case ConsentInformation.ConsentStatus.NOT_REQUIRED: return "not-required";
            case ConsentInformation.ConsentStatus.REQUIRED: return "required";
            case ConsentInformation.ConsentStatus.OBTAINED: return "obtained";
            default: return "unknown";
        }
    }

    private boolean privacyOptionsRequired() {
        return consentInformation != null && consentInformation.getPrivacyOptionsRequirementStatus()
            == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
    }

    private void publish(String next) {
        status = next;
        refreshReceiptReadiness();
        if (!destroyed) notifyListeners("state", state());
    }

    @PluginMethod
    public void getState(PluginCall call) {
        mainHandler.post(() -> call.resolve(state()));
    }

    @PluginMethod
    public void showTestBanner(PluginCall call) {
        showBanner(call);
    }

    @PluginMethod
    public void showBanner(PluginCall call) {
        mainHandler.post(() -> {
            if (!hasActivity()) { call.reject("App content unavailable", "ad-unavailable"); return; }
            if (bannerContainer != null) { call.resolve(state()); return; }
            FrameLayout content = getActivity().findViewById(android.R.id.content);
            View appContent = content.getChildAt(0);
            if (appContent == null) { call.reject("App content unavailable", "ad-unavailable"); return; }
            content.removeView(appContent);
            LinearLayout layout = new LinearLayout(getActivity());
            layout.setOrientation(LinearLayout.VERTICAL);
            layout.setBackgroundColor(Color.rgb(15, 28, 21));
            layout.addView(appContent, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
            label = new TextView(getActivity());
            label.setText(BuildConfig.ADS_TEST_ONLY ? "테스트 광고" : "광고");
            label.setTextSize(12);
            label.setGravity(Gravity.CENTER);
            label.setTextColor(Color.rgb(224, 239, 221));
            layout.addView(label, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(20)));
            bannerContainer = new FrameLayout(getActivity());
            layout.addView(bannerContainer, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(50)));
            content.addView(layout, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            bannerLoadRequested = true;
            requestConsentUpdate();
            syncConsentPermission();
            call.resolve(state());
        });
    }

    @PluginMethod
    public void prepareExportInterstitial(PluginCall call) {
        mainHandler.post(() -> {
            if (!hasActivity()) { resolveAd(call, "skipped", "activity-unavailable"); return; }
            interstitialRequested = true;
            requestConsentUpdate();
            initializeSdk();
            String preparation = interstitial != null ? "ready" : "preparing";
            if (!adsAllowed()) { resolveAd(call, "skipped", consent.isFormShowing() ? "consent-form-showing" : "consent-unavailable"); return; }
            call.resolve(state().put("status", preparation));
        });
    }

    @PluginMethod
    public void cancelExportInterstitial(PluginCall call) {
        synchronized (exportReceipts) {
            exportOpportunity.invalidate();
            exportReceipts.invalidate();
        }
        mainHandler.post(() -> resolveAd(call, "skipped", "opportunity-cancelled"));
    }

    @PluginMethod
    public void showExportInterstitial(PluginCall call) {
        long opportunity = exportOpportunity.capture();
        mainHandler.post(() -> {
            ExportAdReceipts.Snapshot proof = exportReceipts.consumeProof(call.getString("receipt"),
                call.getString("placement"), interstitialIdentity, SystemClock.elapsedRealtime());
            if (!ExportAdPolicy.isSupportedPlacement(call.getString("placement"))) {
                resolveAd(call, "skipped", "invalid-placement");
                return;
            }
            if (!exportOpportunity.isCurrent(opportunity)) {
                resolveAd(call, "skipped", "opportunity-cancelled");
                return;
            }
            if (proof == null) {
                resolveAd(call, "skipped", "invalid-save-receipt");
                return;
            }
            if (activeShow != null) { resolveAd(call, "skipped", "already-showing"); return; }
            if (!hasActivity()) { resolveAd(call, "skipped", "activity-unavailable"); return; }
            if (!foreground) { resolveAd(call, "skipped", "background"); return; }
            syncConsentPermission();
            if (!adsAllowed()) { resolveAd(call, "skipped", consent.isFormShowing() ? "consent-form-showing" : "consent-unavailable"); return; }
            String cooldown = ExportAdPolicy.cooldownReason(System.currentTimeMillis(), lastShownAt);
            if (cooldown != null) { resolveAd(call, "skipped", cooldown); return; }
            if (interstitial == null) { resolveAd(call, "skipped", "not-ready"); return; }
            if (!ExportAdPolicy.isFresh(SystemClock.elapsedRealtime(), loadedAtElapsed)) {
                interstitial = null;
                interstitialIdentity = null;
                loadedAtElapsed = -1;
                refreshReceiptReadiness();
                resolveAd(call, "skipped", "expired");
                return;
            }

            // Serialize the final SDK handoff with bridge-thread cancel/share/new-save invalidation.
            synchronized (exportReceipts) {
                if (!exportReceipts.isCurrent(proof, SystemClock.elapsedRealtime())
                    || !exportOpportunity.isCurrent(opportunity)) {
                    resolveAd(call, "skipped", "opportunity-cancelled");
                    return;
                }
                showPreparedInterstitial(call);
            }
        });
    }

    private void showPreparedInterstitial(PluginCall call) {
        ShowAttempt attempt = new ShowAttempt(call, interstitial);
        activeShow = attempt;
        interstitial = null;
        interstitialIdentity = null;
        loadedAtElapsed = -1;
        refreshReceiptReadiness();
        mainHandler.removeCallbacks(retryLoad);
        try {
            attempt.ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override public void onAdShowedFullScreenContent() {
                    if (destroyed || activeShow != attempt || attempt.shown) return;
                    attempt.shown = true;
                    lastShownAt = System.currentTimeMillis();
                    adPreferences.edit().putLong(LAST_SHOWN_AT, lastShownAt).apply();
                    refreshReceiptReadiness();
                }

                @Override public void onAdDismissedFullScreenContent() {
                    finishShow(attempt, attempt.shown ? "shown" : "failed",
                        attempt.shown ? null : "not-shown");
                }

                @Override public void onAdFailedToShowFullScreenContent(AdError error) {
                    finishShow(attempt, "failed", "show-failed");
                }
            });
            attempt.ad.show(getActivity());
        } catch (RuntimeException error) {
            finishShow(attempt, "failed", "show-failed");
        }
    }

    private void resolveAd(PluginCall call, String result, String reason) {
        JSObject response = state().put("status", result);
        if (reason != null) response.put("reason", reason);
        call.resolve(response);
    }

    private void requestConsentUpdate() {
        if (consentInformation == null || !hasActivity() || !consent.beginUpdate()) return;
        Activity activity = getActivity();
        ConsentRequestParameters parameters = new ConsentRequestParameters.Builder()
            .setTagForUnderAgeOfConsent(BuildConfig.UMP_UNDER_AGE_OF_CONSENT).build();
        try {
            consentInformation.requestConsentInfoUpdate(activity, parameters,
                () -> mainHandler.post(() -> {
                    if (destroyed) return;
                    consent.queueRequiredForm();
                    syncConsentPermission();
                    showRequiredConsentForm();
                }),
                error -> mainHandler.post(() -> {
                    if (destroyed) return;
                    syncConsentPermission();
                }));
            // UMP exposes the previous session's permission after the request starts.
            syncConsentPermission();
        } catch (RuntimeException error) {
            syncConsentPermission();
        }
    }

    private void showRequiredConsentForm() {
        if (!hasActivity()) return;
        boolean required = consentInformation.getConsentStatus() == ConsentInformation.ConsentStatus.REQUIRED;
        if (!consent.beginPendingForm(required, activeShow != null)) return;
        if (required) {
            clearAds();
            publish("consent-pending");
        }
        Activity activity = getActivity();
        try {
            UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity, error -> mainHandler.post(() -> {
                if (destroyed) return;
                if (required) consent.finishForm(consentInformation.canRequestAds());
                syncConsentPermission();
            }));
        } catch (RuntimeException error) {
            if (required) consent.finishForm(consentInformation.canRequestAds());
            syncConsentPermission();
        }
    }

    @PluginMethod
    public void showPrivacyOptions(PluginCall call) {
        mainHandler.post(() -> {
            if (!hasActivity()) { resolveAd(call, "skipped", "activity-unavailable"); return; }
            if (!foreground) { resolveAd(call, "skipped", "background"); return; }
            if (activeShow != null) { resolveAd(call, "skipped", "ad-showing"); return; }
            if (consent.hasPendingForm() || consent.isFormShowing() || privacyCall != null) {
                resolveAd(call, "skipped", "consent-busy"); return;
            }
            if (!privacyOptionsRequired()) { resolveAd(call, "skipped", "not-required"); return; }
            if (!consent.beginForm(false)) { resolveAd(call, "skipped", "consent-busy"); return; }
            privacyCall = call;
            clearAds();
            publish("consent-pending");
            try {
                UserMessagingPlatform.showPrivacyOptionsForm(getActivity(), error -> mainHandler.post(() -> {
                    if (destroyed || privacyCall != call) return;
                    consent.finishForm(consentInformation.canRequestAds());
                    privacyCall = null;
                    showRequiredConsentForm();
                    syncConsentPermission();
                    resolveAd(call, error == null ? "shown" : "failed", error == null ? null : "consent-form-failed");
                }));
            } catch (RuntimeException error) {
                consent.finishForm(consentInformation.canRequestAds());
                privacyCall = null;
                showRequiredConsentForm();
                syncConsentPermission();
                resolveAd(call, "failed", "consent-form-failed");
            }
        });
    }

    private boolean adsAllowed() {
        return hasActivity() && consent.canUseAds() && !consent.hasPendingForm()
            && consentInformation != null && consentInformation.canRequestAds();
    }

    private void refreshReceiptReadiness() {
        if (exportReceipts == null) return;
        Object ready = foreground && hasActivity() && adsAllowed() && activeShow == null
            && interstitial != null ? interstitialIdentity : null;
        exportReceipts.ready(ready, loadedAtElapsed, lastShownAt);
    }

    private void syncConsentPermission() {
        if (destroyed || consentInformation == null) return;
        boolean changed = consent.updatePermission(consentInformation.canRequestAds());
        if (changed || !consent.canRequestAds()) clearAds();
        if (!consent.canRequestAds()) {
            if (label != null) label.setText("광고 없이 편집할 수 있습니다.");
            publish(consent.isFormShowing() ? "consent-pending" : "consent-unavailable");
        } else {
            publish(consent.isFormShowing() ? "consent-pending"
                : status.equals("consent-pending") || status.equals("consent-unavailable") ? "not-requested" : status);
            initializeSdk();
        }
    }

    private void clearAds() {
        if (exportReceipts != null) exportReceipts.suspend();
        mainHandler.removeCallbacks(retryLoad);
        mainHandler.removeCallbacks(awaitSdk);
        interstitial = null;
        interstitialIdentity = null;
        loadedAtElapsed = -1;
        interstitialLoading = false;
        nextLoadAtElapsed = 0;
        if (banner != null) {
            banner.setAdListener(null);
            if (bannerContainer != null) bannerContainer.removeView(banner);
            banner.destroy();
            banner = null;
        }
        bannerLoadRequested = bannerContainer != null;
    }

    private boolean hasActivity() {
        Activity activity = getActivity();
        return !destroyed && activity != null && !activity.isFinishing() && !activity.isDestroyed();
    }

    private void initializeSdk() {
        if (!adsAllowed() || (!bannerLoadRequested && !interstitialRequested)) return;
        if (SDK.isReady()) { loadRequestedAds(); return; }
        if (SDK.isStarting()) {
            mainHandler.removeCallbacks(awaitSdk);
            mainHandler.postDelayed(awaitSdk, 250);
            return;
        }
        if (!SDK.begin(adsAllowed())) return;
        try {
            applyRequestPrivacy();
            MobileAds.initialize(getContext().getApplicationContext(), initialization -> mainHandler.post(() -> {
                SDK.complete();
                if (destroyed) return;
                loadRequestedAds();
            }));
        } catch (RuntimeException error) {
            SDK.fail();
            if (bannerLoadRequested) publish("load-failed");
            scheduleRetry();
        }
    }

    private void applyRequestPrivacy() {
        MobileAds.setRequestConfiguration(ConsentRequestConfiguration.apply(
            MobileAds.getRequestConfiguration(), BuildConfig.UMP_UNDER_AGE_OF_CONSENT));
    }

    private void loadRequestedAds() {
        if (!adsAllowed()) return;
        if (bannerLoadRequested && bannerContainer != null) {
            bannerLoadRequested = false;
            long generation = consent.generation();
            try {
                banner = new AdView(getActivity());
                AdView requestedBanner = banner;
                banner.setAdSize(AdSize.BANNER);
                banner.setAdUnitId(BuildConfig.BANNER_AD_UNIT_ID);
                bannerContainer.addView(banner, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER));
                banner.setAdListener(new AdListener() {
                    @Override public void onAdLoaded() {
                        if (banner != requestedBanner || !consent.accepts(generation)) return;
                        if (!consentInformation.canRequestAds()) { syncConsentPermission(); return; }
                        label.setText(BuildConfig.ADS_TEST_ONLY ? "테스트 광고" : "광고");
                        publish("loaded");
                    }
                    @Override public void onAdFailedToLoad(LoadAdError error) {
                        if (banner != requestedBanner || !consent.accepts(generation)) return;
                        label.setText(BuildConfig.ADS_TEST_ONLY
                            ? "테스트 광고를 불러오지 못했습니다. 편집은 계속할 수 있습니다."
                            : "광고를 불러오지 못했습니다. 편집은 계속할 수 있습니다.");
                        publish("load-failed");
                    }
                });
                label.setText(BuildConfig.ADS_TEST_ONLY ? "테스트 광고" : "광고");
                publish("loading");
                applyRequestPrivacy();
                banner.loadAd(new AdRequest.Builder().build());
            } catch (RuntimeException error) {
                publish("load-failed");
            }
        }
        prepareInterstitial();
    }

    private void prepareInterstitial() {
        if (!interstitialRequested || !adsAllowed() || activeShow != null || interstitialLoading) return;
        if (interstitial != null && ExportAdPolicy.isFresh(SystemClock.elapsedRealtime(), loadedAtElapsed)) {
            scheduleCacheRefresh();
            return;
        }
        interstitial = null;
        interstitialIdentity = null;
        loadedAtElapsed = -1;
        refreshReceiptReadiness();
        long retryAfter = nextLoadAtElapsed - SystemClock.elapsedRealtime();
        if (retryAfter > 0) { scheduleRetry(); return; }
        if (!SDK.isReady()) { initializeSdk(); return; }
        interstitialLoading = true;
        long generation = consent.generation();
        try {
            applyRequestPrivacy();
            InterstitialAd.load(getContext().getApplicationContext(), BuildConfig.INTERSTITIAL_AD_UNIT_ID,
                new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
                    @Override public void onAdLoaded(InterstitialAd ad) {
                        if (!consent.accepts(generation)) return;
                        if (!consentInformation.canRequestAds()) { syncConsentPermission(); return; }
                        interstitialLoading = false;
                        interstitial = ad;
                        interstitialIdentity = new Object();
                        loadedAtElapsed = SystemClock.elapsedRealtime();
                        refreshReceiptReadiness();
                        nextLoadAtElapsed = 0;
                        scheduleCacheRefresh();
                    }

                    @Override public void onAdFailedToLoad(LoadAdError error) {
                        if (!consent.accepts(generation)) return;
                        interstitialLoading = false;
                        nextLoadAtElapsed = SystemClock.elapsedRealtime() + RETRY_DELAY_MS;
                        scheduleRetry();
                    }
                });
        } catch (RuntimeException error) {
            interstitialLoading = false;
            nextLoadAtElapsed = SystemClock.elapsedRealtime() + RETRY_DELAY_MS;
            scheduleRetry();
        }
    }

    private void scheduleCacheRefresh() {
        mainHandler.removeCallbacks(retryLoad);
        if (adsAllowed() && interstitial != null) {
            long age = SystemClock.elapsedRealtime() - loadedAtElapsed;
            mainHandler.postDelayed(retryLoad, Math.max(1, ExportAdPolicy.MAX_AD_AGE_MS - age));
        }
    }

    private void scheduleRetry() {
        mainHandler.removeCallbacks(retryLoad);
        if (adsAllowed() && interstitialRequested && activeShow == null) {
            long delay = Math.max(RETRY_DELAY_MS, nextLoadAtElapsed - SystemClock.elapsedRealtime());
            mainHandler.postDelayed(retryLoad, delay);
        }
    }

    private void finishShow(ShowAttempt attempt, String result, String reason) {
        if (activeShow != attempt) return;
        activeShow = null;
        resolveAd(attempt.call, result, reason);
        if (!destroyed) {
            showRequiredConsentForm();
            mainHandler.post(retryLoad);
        }
    }

    private int dp(int value) { return Math.round(value * getContext().getResources().getDisplayMetrics().density); }
    @Override protected void handleOnPause() {
        exportOpportunity.invalidate();
        exportReceipts.pause();
        foreground = false;
        consent.pause();
        mainHandler.removeCallbacks(retryLoad);
        mainHandler.removeCallbacks(awaitSdk);
        if (banner != null) banner.pause();
    }

    @Override protected void handleOnResume() {
        if (destroyed) return;
        exportOpportunity.invalidate();
        exportReceipts.resume();
        foreground = true;
        consent.resume();
        requestConsentUpdate();
        showRequiredConsentForm();
        syncConsentPermission();
        if (banner != null) banner.resume();
        if (interstitialRequested) prepareInterstitial();
    }

    @Override protected void handleOnDestroy() {
        exportOpportunity.invalidate();
        exportReceipts.suspend();
        destroyed = true;
        foreground = false;
        consent.destroy();
        clearAds();
        if (privacyCall != null) {
            PluginCall call = privacyCall;
            privacyCall = null;
            resolveAd(call, "failed", "plugin-destroyed");
        }
        if (activeShow != null) finishShow(activeShow, "failed", "plugin-destroyed");
    }
}
