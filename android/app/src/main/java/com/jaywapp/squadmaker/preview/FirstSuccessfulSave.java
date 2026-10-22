package com.jaywapp.squadmaker.preview;

/** Process-wide serialization of the installation's first successful explicit save. */
final class FirstSuccessfulSave {
    interface Store {
        boolean hasSaved();
        boolean commitSaved();
    }

    private final Store store;
    private boolean poisoned;

    FirstSuccessfulSave(Store store) { this.store = store; }

    synchronized boolean recordSuccess() {
        if (poisoned) return false;
        try {
            if (store.hasSaved()) return true;
            // A failed commit may still update SharedPreferences' in-memory value.
            // Do not trust that value again in this process.
            if (!store.commitSaved()) poisoned = true;
        } catch (RuntimeException error) {
            poisoned = true;
        }
        return false;
    }
}
