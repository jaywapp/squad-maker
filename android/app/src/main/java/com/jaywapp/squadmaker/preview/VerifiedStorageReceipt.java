package com.jaywapp.squadmaker.preview;

import java.util.UUID;

/** Ephemeral proof of a completed native write and readback; never contains user data. */
final class VerifiedStorageReceipt {
    private long generation;
    private boolean writing;
    private String receipt;

    long beginWrite() {
        generation++;
        writing = true;
        receipt = null;
        return generation;
    }

    void finishWrite(long serial, boolean verified) {
        if (serial != generation || !writing) return;
        writing = false;
        receipt = verified ? UUID.randomUUID().toString() : null;
    }

    long generation() { return generation; }
    String receipt() { return receipt; }
    boolean verified() { return !writing && receipt != null; }
    boolean matches(String candidate) { return verified() && receipt.equals(candidate); }
    void consume() { receipt = null; }
}
