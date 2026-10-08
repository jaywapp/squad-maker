package com.jaywapp.squadmaker.preview;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(SquadStoragePlugin.class);
        registerPlugin(SquadDocumentsPlugin.class);
        registerPlugin(SquadAdsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
