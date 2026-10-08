package com.jaywapp.squadmaker.preview;

import android.graphics.Color;
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
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;

@CapacitorPlugin(name = "SquadAds")
public class SquadAdsPlugin extends Plugin {
    private AdView banner;
    private String status = "not-requested";
    private TextView label;

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
        getActivity().runOnUiThread(() -> {
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
                @Override public void onAdLoaded() { label.setText("테스트 광고"); publish("loaded"); }
                @Override public void onAdFailedToLoad(LoadAdError error) {
                    label.setText("테스트 광고를 불러오지 못했습니다. 편집은 계속할 수 있습니다.");
                    publish("load-failed");
                }
            });
            publish("loading");
            MobileAds.initialize(getContext(), initialization -> getActivity().runOnUiThread(() -> {
                if (banner != null) banner.loadAd(new AdRequest.Builder().build());
            }));
            call.resolve(new JSObject().put("status", status).put("testOnly", true));
        });
    }

    private int dp(int value) { return Math.round(value * getContext().getResources().getDisplayMetrics().density); }
    @Override protected void handleOnPause() { if (banner != null) banner.pause(); }
    @Override protected void handleOnResume() { if (banner != null) banner.resume(); }
    @Override protected void handleOnDestroy() { if (banner != null) banner.destroy(); }
}
