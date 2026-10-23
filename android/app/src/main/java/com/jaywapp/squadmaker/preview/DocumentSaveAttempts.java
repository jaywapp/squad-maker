package com.jaywapp.squadmaker.preview;

import java.util.HashSet;
import java.util.Set;

/** Separates restored callbacks from duplicate callbacks and owns the busy reservation. */
final class DocumentSaveAttempts {
    enum Claim { OWNED, RESTORED, DUPLICATE }

    private String active;
    private final Set<String> prepared = new HashSet<>();
    private final Set<String> claimed = new HashSet<>();

    synchronized boolean reserve(String token) {
        if (active != null) return false;
        active = token;
        prepared.add(token);
        return true;
    }

    synchronized Claim claim(String token) {
        if (!claimed.add(token)) return Claim.DUPLICATE;
        if (active == null) active = token;
        return prepared.remove(token) ? Claim.OWNED : Claim.RESTORED;
    }

    synchronized void release(String token) {
        prepared.remove(token);
        if (token.equals(active)) active = null;
    }

    synchronized void abandon() {
        prepared.clear();
        active = null;
    }
}
