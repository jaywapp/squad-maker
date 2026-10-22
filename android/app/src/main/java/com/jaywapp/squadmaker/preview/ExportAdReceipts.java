package com.jaywapp.squadmaker.preview;

import java.util.UUID;

/** Activity-scoped, single-use proof of a just-completed native document write. */
final class ExportAdReceipts {
    static final long MAX_RECEIPT_AGE_MS = 1_000L;
    private enum DocumentState { ARMED, PAUSED, RESULT_BEFORE_RESUME, RESUMED_BEFORE_RESULT, WRITING }

    static final class Snapshot {
        final long epoch;
        final Object ad;
        final long completedAt;
        final long loadedAt;

        Snapshot(long epoch, Object ad, long completedAt, long loadedAt) {
            this.epoch = epoch;
            this.ad = ad;
            this.completedAt = completedAt;
            this.loadedAt = loadedAt;
        }
    }

    private long epoch;
    private Object readyAd;
    private long loadedAt = -1;
    private long lastShownAt;
    private String pending;
    private String pendingPlacement;
    private Snapshot completion;
    private long documentGeneration;
    private String documentToken;
    private DocumentState documentState;
    private boolean foreground;

    synchronized long captureEpoch() { return epoch; }

    synchronized boolean isCurrent(long capturedEpoch) { return capturedEpoch == epoch; }

    synchronized void invalidate() {
        documentGeneration++;
        clearDocument();
        invalidateReceipt();
    }

    private void invalidateReceipt() {
        epoch++;
        pending = null;
        pendingPlacement = null;
        completion = null;
    }

    synchronized void suspend() {
        invalidate();
        readyAd = null;
        loadedAt = -1;
    }

    synchronized long prepareDocument() {
        invalidate();
        return documentGeneration;
    }

    synchronized boolean armDocument(String token, long preparation) {
        if (token == null || !foreground || preparation != documentGeneration) return false;
        invalidateReceipt();
        documentGeneration++;
        documentToken = token;
        documentState = DocumentState.ARMED;
        return true;
    }

    synchronized void pause() {
        boolean pickerDeparture = foreground && documentState == DocumentState.ARMED;
        documentGeneration++;
        invalidateReceipt();
        readyAd = null;
        loadedAt = -1;
        foreground = false;
        if (pickerDeparture) documentState = DocumentState.PAUSED;
        else clearDocument();
    }

    synchronized void resume() {
        documentGeneration++;
        invalidateReceipt();
        readyAd = null;
        loadedAt = -1;
        foreground = true;
        if (documentState == DocumentState.PAUSED) documentState = DocumentState.RESUMED_BEFORE_RESULT;
        else if (documentState == DocumentState.RESULT_BEFORE_RESUME) documentState = DocumentState.WRITING;
        else clearDocument();
    }

    synchronized void documentResult(String token) {
        if (token == null || !token.equals(documentToken)) return;
        if (documentState == DocumentState.PAUSED) documentState = DocumentState.RESULT_BEFORE_RESUME;
        else if (foreground && (documentState == DocumentState.ARMED
            || documentState == DocumentState.RESUMED_BEFORE_RESULT)) documentState = DocumentState.WRITING;
        else clearDocument();
    }

    synchronized Snapshot completeDocument(String token, long nowElapsed, long nowWall) {
        if (token == null || !token.equals(documentToken)) return null;
        boolean eligible = foreground && documentState == DocumentState.WRITING;
        // Completion is final even when resume, consent or a prepared ad is still unavailable.
        clearDocument();
        return eligible ? snapshot(epoch, nowElapsed, nowWall) : null;
    }

    synchronized void discardDocument(String token) {
        if (token != null && token.equals(documentToken)) invalidate();
    }

    private void clearDocument() {
        documentToken = null;
        documentState = null;
    }

    synchronized void ready(Object ad, long loadedAtElapsed, long shownAt) {
        if (readyAd != ad || loadedAt != loadedAtElapsed) invalidateReceipt();
        readyAd = ad;
        loadedAt = ad == null ? -1 : loadedAtElapsed;
        lastShownAt = shownAt;
    }

    synchronized Snapshot snapshot(long expectedEpoch, long nowElapsed, long nowWall) {
        if (expectedEpoch != epoch || readyAd == null || !ExportAdPolicy.isFresh(nowElapsed, loadedAt)
            || ExportAdPolicy.cooldownReason(nowWall, lastShownAt) != null) return null;
        return new Snapshot(epoch, readyAd, nowElapsed, loadedAt);
    }

    synchronized String issue(String mime, Snapshot saved, long nowElapsed) {
        String placement = ExportAdPolicy.placementForMime(mime);
        if (placement == null || !isCurrent(saved, nowElapsed)) return null;
        pending = UUID.randomUUID().toString();
        pendingPlacement = placement;
        completion = saved;
        return pending;
    }

    synchronized boolean consume(String receipt, String placement, Object ad, long nowElapsed) {
        return consumeProof(receipt, placement, ad, nowElapsed) != null;
    }

    synchronized Snapshot consumeProof(String receipt, String placement, Object ad, long nowElapsed) {
        boolean valid = receipt != null && receipt.equals(pending) && placement != null
            && placement.equals(pendingPlacement) && ad != null && completion != null
            && completion.ad == ad && isCurrent(completion, nowElapsed);
        Snapshot proof = valid ? completion : null;
        // Even a wrong placement or an unready attempt cannot be retried later.
        pending = null;
        pendingPlacement = null;
        completion = null;
        return proof;
    }

    synchronized boolean isCurrent(Snapshot saved, long nowElapsed) {
        return saved != null && saved.epoch == epoch && saved.ad == readyAd
            && nowElapsed >= saved.completedAt && nowElapsed - saved.completedAt < MAX_RECEIPT_AGE_MS
            && ExportAdPolicy.isFresh(nowElapsed, saved.loadedAt);
    }
}
