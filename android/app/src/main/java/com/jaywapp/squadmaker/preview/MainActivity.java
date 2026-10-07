package com.jaywapp.squadmaker.preview;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SquadStoragePlugin.class);
        registerPlugin(SquadDocumentsPlugin.class);
        registerPlugin(SquadAdsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
