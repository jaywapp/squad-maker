package com.jaywapp.squadmaker.preview;

import java.util.UUID;

/** UI-independent flexible update state and one-shot completion authorization. */
final class FlexibleUpdatePolicy {
    final boolean supported;
    String status;
    String reason;
    int availableVersionCode;
    long bytesDownloaded;
    long totalBytes;
    private int dismissedVersion;
    private boolean manual;
    private boolean foreground;
    private boolean destroyed;
    private boolean checking;
    private boolean flowStarting;
    private boolean completing;
    private long epoch;
    private long metadataToken = -1;
    private boolean metadataRetryUsed;
    private String challenge;
    private long receiptGeneration;
    private int challengeVersion;

    FlexibleUpdatePolicy(boolean supported, int dismissedVersion) {
        this.supported = supported;
        this.dismissedVersion = dismissedVersion;
        status = supported ? "idle" : "unsupported";
        reason = supported ? null : "install-source-unsupported";
    }

    static boolean eligible(String packageName, boolean debug, String installer) {
        return "com.jaywapp.iamheadcoach".equals(packageName) && !debug && "com.android.vending".equals(installer);
    }

    static boolean activeInstall(String status) {
        return "pending".equals(status) || "downloading".equals(status)
            || "downloaded".equals(status) || "installing".equals(status);
    }

    void resume() {
        if (!destroyed) {
            if (!foreground) metadataRetryUsed = false;
            foreground = true;
        }
    }
    void pause() { foreground = false; invalidate(); }
    void destroy() { destroyed = true; foreground = false; invalidate(); }
    private void invalidate() { epoch++; metadataToken = -1; checking = false; challenge = null; }
    boolean foreground() { return foreground && !destroyed; }
    boolean alive() { return !destroyed; }

    long beginCheck(boolean manuallyRequested) {
        if (!supported || !foreground() || checking || completing) return -1;
        checking = true;
        manual = manuallyRequested;
        reason = null;
        if (!activeInstall(status)) status = "checking";
        metadataToken = ++epoch;
        return epoch;
    }

    boolean accepts(long token) { return alive() && token == epoch; }
    long epoch() { return epoch; }

    void installState(String next, long downloaded, long total) {
        if (!alive()) return;
        epoch++;
        checking = false;
        if (!next.equals(status)) challenge = null;
        applyInfo(availableVersionCode, false, false, next, downloaded, total);
    }
    void info(long token, int version, boolean available, boolean flexible, String installStatus,
            long downloaded, long total) {
        // Install events supersede query state, but the latest query may still identify
        // the active update after recreation. Never infer a version from availability alone.
        boolean metadataCurrent = alive() && foreground() && token == metadataToken;
        if (metadataCurrent && availableVersionCode == 0 && activeInstall(status)) {
            checking = false;
            metadataToken = -1;
            if (version > 0 && activeInstall(installStatus)) availableVersionCode = version;
            return;
        }
        if (!accepts(token)) return;
        checking = false;
        metadataToken = -1;
        applyInfo(version, available, flexible, installStatus, downloaded, total);
    }

    boolean claimMetadataRefresh() {
        if (!supported || !foreground() || checking || metadataRetryUsed
                || availableVersionCode != 0 || !activeInstall(status)) return false;
        metadataRetryUsed = true;
        return true;
    }

    void applyInfo(int version, boolean available, boolean flexible, String installStatus, long downloaded, long total) {
        if (!alive()) return;
        if (completing) {
            if ("failed".equals(installStatus)) completionFailed();
            else if ("installed".equals(installStatus)) { completing = false; status = "installed"; reason = null; }
            return;
        }
        if (availableVersionCode != version) challenge = null;
        availableVersionCode = Math.max(0, version);
        bytesDownloaded = Math.max(0, downloaded);
        totalBytes = Math.max(0, total);
        reason = null;
        if ("downloaded".equals(installStatus) || "downloading".equals(installStatus)
                || "pending".equals(installStatus) || "installing".equals(installStatus)) {
            status = installStatus;
        } else if ("cancelled".equals(installStatus) || "failed".equals(installStatus)) {
            if (manual && available && flexible && version > 0) {
                status = "available";
            } else {
                status = installStatus;
                reason = "cancelled".equals(status) ? "user-cancelled" : "update-failed";
            }
        } else {
            status = available && flexible && version > 0 ? "available" : "not-available";
            if (available && !flexible) reason = "flexible-unavailable";
        }
    }

    void checkFailed(long token) {
        if (!accepts(token)) return;
        checking = false;
        if (!activeInstall(status)) status = "failed";
        reason = "check-failed";
    }

    boolean beginFlow() {
        if (!supported || !foreground() || flowStarting || completing || activeInstall(status)) return false;
        flowStarting = true;
        invalidate();
        return true;
    }

    void flowResult(String next, String failure) {
        flowStarting = false;
        if (!alive()) return;
        if (!"pending".equals(next) || (!"downloaded".equals(status) && !"downloading".equals(status))) status = next;
        reason = failure;
        if ("cancelled".equals(next)) dismiss();
    }

    void freshQueryFailed(long token) {
        if (!alive()) return;
        if (accepts(token)) flowResult("failed", "check-failed");
        else flowStarting = false;
    }

    int dismiss() { dismissedVersion = availableVersionCode; manual = false; return dismissedVersion; }
    boolean shouldNotify() {
        return supported && ("available".equals(status) || "downloaded".equals(status))
            && availableVersionCode > 0 && (manual || availableVersionCode != dismissedVersion);
    }

    String beginCompletion(long generation, boolean verified) {
        if (!supported || !foreground() || completing || !"downloaded".equals(status)
                || availableVersionCode <= 0 || !verified) return null;
        challenge = UUID.randomUUID().toString();
        receiptGeneration = generation;
        challengeVersion = availableVersionCode;
        return challenge;
    }

    String consumeCompletion(String candidate, long generation, boolean verified) {
        String issued = challenge;
        challenge = null;
        if (!supported || !foreground() || completing || !"downloaded".equals(status)) return "update-not-ready";
        if (issued == null || !issued.equals(candidate) || challengeVersion != availableVersionCode) return "completion-expired";
        if (!verified || receiptGeneration != generation) return "storage-unverified";
        completing = true;
        status = "installing";
        reason = null;
        return null;
    }

    void completionFailed() {
        completing = false;
        if (alive()) { status = "downloaded"; reason = "complete-failed"; }
    }
}
