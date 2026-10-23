package com.jaywapp.squadmaker.preview;

final class ExportAdPolicy {
    static final long COOLDOWN_MS = 10 * 60 * 1000L;
    static final long MAX_AD_AGE_MS = 60 * 60 * 1000L;

    private ExportAdPolicy() {}

    static boolean isSupportedPlacement(String placement) {
        return "gif".equals(placement) || "sq".equals(placement);
    }

    static String cooldownReason(long now, long lastShownAt) {
        if (now <= 0) return "clock-unavailable";
        if (lastShownAt <= 0) return null;
        if (now < lastShownAt) return "clock-back";
        return now - lastShownAt < COOLDOWN_MS ? "cooldown" : null;
    }

    static boolean isFresh(long nowElapsed, long loadedAtElapsed) {
        return loadedAtElapsed >= 0 && nowElapsed >= loadedAtElapsed
            && nowElapsed - loadedAtElapsed < MAX_AD_AGE_MS;
    }
}
