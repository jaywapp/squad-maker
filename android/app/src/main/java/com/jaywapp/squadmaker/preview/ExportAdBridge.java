package com.jaywapp.squadmaker.preview;

import android.app.Activity;
import android.content.Context;
import java.util.WeakHashMap;

/** Native-only shared ownership; receipt sessions never survive Activity recreation. */
final class ExportAdBridge {
    private static final WeakHashMap<Activity, ExportAdReceipts> SESSIONS = new WeakHashMap<>();
    private static FirstSuccessfulSave firstSave;

    private ExportAdBridge() {}

    static synchronized ExportAdReceipts session(Activity activity) {
        if (activity == null) return new ExportAdReceipts();
        ExportAdReceipts session = SESSIONS.get(activity);
        if (session == null) {
            session = new ExportAdReceipts();
            SESSIONS.put(activity, session);
        }
        return session;
    }

    static synchronized FirstSuccessfulSave firstSave(Context context) {
        if (firstSave == null) {
            Context application = context.getApplicationContext();
            firstSave = new FirstSuccessfulSave(new FirstSuccessfulSave.Store() {
                @Override public boolean hasSaved() {
                    return application.getSharedPreferences("squad-export-ads", Context.MODE_PRIVATE)
                        .getBoolean("first-successful-save", false);
                }
                @Override public boolean commitSaved() {
                    return application.getSharedPreferences("squad-export-ads", Context.MODE_PRIVATE)
                        .edit().putBoolean("first-successful-save", true).commit();
                }
            });
        }
        return firstSave;
    }
}
