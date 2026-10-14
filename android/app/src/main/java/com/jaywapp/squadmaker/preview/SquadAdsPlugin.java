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

@CapacitorPlugin(name = "SquadAds")
public class SquadAdsPlugin extends Plugin {
    private static final String TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712";
    private static final String AD_PREFERENCES = "squad-export-ads";
    private static final String LAST_SHOWN_AT = "last-shown-at";
    private static final long RETRY_DELAY_MS = 30_000L;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private AdView banner;
    private String status = "not-requested";
    private TextView label;
    private boolean bannerLoadRequested;
    private boolean sdkInitialized;
    private boolean sdkInitializing;
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
        adPreferences = getContext().getSharedPreferences(AD_PREFERENCES, Context.MODE_PRIVATE);
        lastShownAt = adPreferences.getLong(LAST_SHOWN_AT, 0);
    }

    private void publish(String next) {
        status = next;
        notifyListeners("state", new JSObject().put("status", status).put("testOnly", true));
    }

    @PluginMethod
    public void getState(PluginCall call) {
        call.resolve(new JSObject().put("status", status).put("testOnly", true));
    }

    @PluginMethod
    public void showTestBanner(PluginCall call) {
        mainHandler.post(() -> {
            if (!hasActivity()) { call.reject("App content unavailable", "ad-unavailable"); return; }
            if (banner != null) { call.resolve(new JSObject().put("status", status).put("testOnly", true)); return; }
            FrameLayout content = getActivity().findViewById(android.R.id.content);
            View appContent = content.getChildAt(0);
            if (appContent == null) { call.reject("App content unavailable", "ad-unavailable"); return; }
            content.removeView(appContent);
            LinearLayout layout = new LinearLayout(getActivity());
            layout.setOrientation(LinearLayout.VERTICAL);
            layout.setBackgroundColor(Color.rgb(15, 28, 21));
            layout.addView(appContent, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
            label = new TextView(getActivity());
            label.setText("테스트 광고");
            label.setTextSize(12);
            label.setGravity(Gravity.CENTER);
            label.setTextColor(Color.rgb(224, 239, 221));
            layout.addView(label, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(20)));
            FrameLayout reserved = new FrameLayout(getActivity());
            layout.addView(reserved, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(50)));
            banner = new AdView(getActivity());
            banner.setAdSize(AdSize.BANNER);
            banner.setAdUnitId("ca-app-pub-3940256099942544/6300978111");
            FrameLayout.LayoutParams placement = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
            reserved.addView(banner, placement);
            content.addView(layout, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            banner.setAdListener(new AdListener() {
                @Override public void onAdLoaded() {
                    if (destroyed) return;
                    label.setText("테스트 광고");
                    publish("loaded");
                }
                @Override public void onAdFailedToLoad(LoadAdError error) {
                    if (destroyed) return;
                    label.setText("테스트 광고를 불러오지 못했습니다. 편집은 계속할 수 있습니다.");
                    publish("load-failed");
                }
            });
            publish("loading");
            bannerLoadRequested = true;
            initializeSdk();
            call.resolve(new JSObject().put("status", status).put("testOnly", true));
        });
    }

    @PluginMethod
    public void prepareExportInterstitial(PluginCall call) {
        mainHandler.post(() -> {
            if (!hasActivity()) { resolveAd(call, "skipped", "activity-unavailable"); return; }
            interstitialRequested = true;
            initializeSdk();
            String preparation = interstitial != null ? "ready" : "preparing";
            call.resolve(new JSObject().put("status", preparation).put("testOnly", true));
        });
    }

    @PluginMethod
    public void showExportInterstitial(PluginCall call) {
        mainHandler.post(() -> {
            if (!ExportAdPolicy.isSupportedPlacement(call.getString("placement"))) {
                resolveAd(call, "skipped", "invalid-placement");
                return;
            }
            if (activeShow != null) { resolveAd(call, "skipped", "already-showing"); return; }
            if (!hasActivity()) { resolveAd(call, "skipped", "activity-unavailable"); return; }
            if (!foreground) { resolveAd(call, "skipped", "background"); return; }
            String cooldown = ExportAdPolicy.cooldownReason(System.currentTimeMillis(), lastShownAt);
            if (cooldown != null) { resolveAd(call, "skipped", cooldown); return; }
            if (interstitial == null) { resolveAd(call, "skipped", "not-ready"); return; }
            if (!ExportAdPolicy.isFresh(SystemClock.elapsedRealtime(), loadedAtElapsed)) {
                interstitial = null;
                loadedAtElapsed = -1;
                resolveAd(call, "skipped", "expired");
                return;
            }

            ShowAttempt attempt = new ShowAttempt(call, interstitial);
            activeShow = attempt;
            interstitial = null;
            loadedAtElapsed = -1;
            mainHandler.removeCallbacks(retryLoad);
            try {
                attempt.ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                    @Override public void onAdShowedFullScreenContent() {
                        if (destroyed || activeShow != attempt || attempt.shown) return;
                        attempt.shown = true;
                        lastShownAt = System.currentTimeMillis();
                        adPreferences.edit().putLong(LAST_SHOWN_AT, lastShownAt).apply();
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
        });
    }

    private void resolveAd(PluginCall call, String result, String reason) {
        JSObject response = new JSObject().put("status", result).put("testOnly", true);
        if (reason != null) response.put("reason", reason);
        call.resolve(response);
    }

    private boolean hasActivity() {
        Activity activity = getActivity();
        return !destroyed && activity != null && !activity.isFinishing() && !activity.isDestroyed();
    }

    private void initializeSdk() {
        if (destroyed) return;
        if (sdkInitialized) { loadRequestedAds(); return; }
        if (sdkInitializing) return;
        sdkInitializing = true;
        try {
            MobileAds.initialize(getContext().getApplicationContext(), initialization -> mainHandler.post(() -> {
                if (destroyed) return;
                sdkInitializing = false;
                sdkInitialized = true;
                loadRequestedAds();
            }));
        } catch (RuntimeException error) {
            sdkInitializing = false;
            if (bannerLoadRequested) publish("load-failed");
            scheduleRetry();
        }
    }

    private void loadRequestedAds() {
        if (!hasActivity()) return;
        if (bannerLoadRequested && banner != null) {
            bannerLoadRequested = false;
            try {
                banner.loadAd(new AdRequest.Builder().build());
            } catch (RuntimeException error) {
                publish("load-failed");
            }
        }
        prepareInterstitial();
    }

    private void prepareInterstitial() {
        if (!interstitialRequested || !hasActivity() || !foreground || activeShow != null || interstitialLoading) return;
        if (interstitial != null && ExportAdPolicy.isFresh(SystemClock.elapsedRealtime(), loadedAtElapsed)) {
            scheduleCacheRefresh();
            return;
        }
        interstitial = null;
        loadedAtElapsed = -1;
        long retryAfter = nextLoadAtElapsed - SystemClock.elapsedRealtime();
        if (retryAfter > 0) { scheduleRetry(); return; }
        if (!sdkInitialized) { initializeSdk(); return; }
        interstitialLoading = true;
        try {
            InterstitialAd.load(getContext().getApplicationContext(), TEST_INTERSTITIAL_ID,
                new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
                    @Override public void onAdLoaded(InterstitialAd ad) {
                        if (destroyed) return;
                        interstitialLoading = false;
                        interstitial = ad;
                        loadedAtElapsed = SystemClock.elapsedRealtime();
                        nextLoadAtElapsed = 0;
                        scheduleCacheRefresh();
                    }

                    @Override public void onAdFailedToLoad(LoadAdError error) {
                        if (destroyed) return;
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
        if (!destroyed && foreground && interstitial != null) {
            long age = SystemClock.elapsedRealtime() - loadedAtElapsed;
            mainHandler.postDelayed(retryLoad, Math.max(1, ExportAdPolicy.MAX_AD_AGE_MS - age));
        }
    }

    private void scheduleRetry() {
        mainHandler.removeCallbacks(retryLoad);
        if (!destroyed && foreground && interstitialRequested && activeShow == null) {
            long delay = Math.max(RETRY_DELAY_MS, nextLoadAtElapsed - SystemClock.elapsedRealtime());
            mainHandler.postDelayed(retryLoad, delay);
        }
    }

    private void finishShow(ShowAttempt attempt, String result, String reason) {
        if (activeShow != attempt) return;
        activeShow = null;
        resolveAd(attempt.call, result, reason);
        if (!destroyed) mainHandler.post(retryLoad);
    }

    private int dp(int value) { return Math.round(value * getContext().getResources().getDisplayMetrics().density); }
    @Override protected void handleOnPause() {
        foreground = false;
        mainHandler.removeCallbacks(retryLoad);
        if (banner != null) banner.pause();
    }

    @Override protected void handleOnResume() {
        if (destroyed) return;
        foreground = true;
        if (banner != null) banner.resume();
        if (interstitialRequested) prepareInterstitial();
    }

    @Override protected void handleOnDestroy() {
        destroyed = true;
        foreground = false;
        mainHandler.removeCallbacks(retryLoad);
        interstitial = null;
        interstitialLoading = false;
        if (activeShow != null) finishShow(activeShow, "failed", "plugin-destroyed");
        if (banner != null) {
            banner.setAdListener(null);
            banner.destroy();
            banner = null;
        }
    }
}
