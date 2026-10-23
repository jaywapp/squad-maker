package com.jaywapp.squadmaker.preview;

final class ExportAdOpportunity {
    private long epoch;

    synchronized long capture() {
        return epoch;
    }

    synchronized void invalidate() {
        epoch++;
    }

    synchronized boolean isCurrent(long capturedEpoch) {
        return epoch == capturedEpoch;
    }
}
