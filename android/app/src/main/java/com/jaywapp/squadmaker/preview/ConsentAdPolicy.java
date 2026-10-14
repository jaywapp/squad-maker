package com.jaywapp.squadmaker.preview;

/** Main-thread state; the UMP SDK alone supplies permission to request ads. */
final class ConsentAdPolicy {
    private boolean updateStarted;
    private boolean allowed;
    private boolean formShowing;
    private boolean requiredFormPending;
    private boolean foreground;
    private boolean destroyed;
    private long generation;

    boolean beginUpdate() {
        if (destroyed || updateStarted || !foreground) return false;
        updateStarted = true;
        return true;
    }

    boolean updatePermission(boolean canRequestAds) {
        boolean next = updateStarted && !destroyed && canRequestAds;
        if (next == allowed) return false;
        allowed = next;
        generation++;
        return true;
    }

    boolean beginForm(boolean adShowing) {
        if (destroyed || !foreground || formShowing || adShowing) return false;
        formShowing = true;
        generation++;
        return true;
    }

    void finishForm(boolean canRequestAds) {
        if (destroyed || !formShowing) return;
        formShowing = false;
        updatePermission(canRequestAds);
    }

    void queueRequiredForm() { if (!destroyed) requiredFormPending = true; }

    boolean beginPendingForm(boolean needsForm, boolean adShowing) {
        if (!requiredFormPending || destroyed || !foreground || formShowing || adShowing) return false;
        if (needsForm && !beginForm(false)) return false;
        requiredFormPending = false;
        return true;
    }

    boolean hasPendingForm() { return requiredFormPending; }

    boolean canRequestAds() { return updateStarted && allowed && !destroyed; }
    boolean canUseAds() { return canRequestAds() && foreground && !formShowing && !requiredFormPending; }
    boolean isFormShowing() { return formShowing; }
    long generation() { return generation; }
    boolean accepts(long token) { return !destroyed && token == generation && canRequestAds() && !formShowing; }
    void resume() { if (!destroyed) foreground = true; }
    void pause() { foreground = false; }
    void destroy() {
        destroyed = true;
        foreground = false;
        allowed = false;
        formShowing = false;
        requiredFormPending = false;
        generation++;
    }

    /** Shared across Activity recreation so MobileAds initializes once per process. */
    static final class InitializationGate {
        private boolean started;
        private boolean ready;

        boolean begin(boolean adsAllowed) {
            if (!adsAllowed || started || ready) return false;
            started = true;
            return true;
        }

        void complete() { started = false; ready = true; }
        void fail() { started = false; }
        boolean isReady() { return ready; }
        boolean isStarting() { return started; }
    }
}
