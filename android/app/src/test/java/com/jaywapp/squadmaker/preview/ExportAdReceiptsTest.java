package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class ExportAdReceiptsTest {
    private static final long NOW = 1_000L;
    private static final long WALL = 1_000_000L;
    private final Object ad = new Object();

    private ExportAdReceipts ready() {
        ExportAdReceipts receipts = new ExportAdReceipts();
        receipts.ready(ad, NOW - 1, 0);
        return receipts;
    }

    private String issue(ExportAdReceipts receipts, String mime) {
        ExportAdReceipts.Snapshot snapshot = receipts.snapshot(receipts.captureEpoch(), NOW, WALL);
        assertNotNull(snapshot);
        return receipts.issue(mime, snapshot, NOW);
    }

    @Test public void everySaveFormatHasASingleUseMimeBoundReceipt() {
        for (String mime : new String[] { "image/png", "image/gif", "application/json" }) {
            ExportAdReceipts receipts = ready();
            String receipt = issue(receipts, mime);
            assertNotNull(receipt);
            assertTrue(receipts.consume(receipt, ExportAdPolicy.placementForMime(mime), ad, NOW));
            assertFalse(receipts.consume(receipt, ExportAdPolicy.placementForMime(mime), ad, NOW));
        }
    }

    @Test public void wrongPlacementBurnsTheReceiptInsteadOfAllowingARetry() {
        ExportAdReceipts receipts = ready();
        String receipt = issue(receipts, "image/png");
        assertFalse(receipts.consume(receipt, "save-gif", ad, NOW));
        assertFalse(receipts.consume(receipt, "save-png", ad, NOW));
    }

    @Test public void missingForgedOrUnsupportedProofsNeverShow() {
        for (String proof : new String[] { null, "", "forged" }) {
            ExportAdReceipts receipts = ready();
            issue(receipts, "application/json");
            assertFalse(receipts.consume(proof, "save-sq", ad, NOW));
        }
        ExportAdReceipts receipts = ready();
        String receipt = issue(receipts, "image/gif");
        assertFalse(receipts.consume(receipt, "gif", ad, NOW));
        assertNull(receipts.issue("text/plain", receipts.snapshot(receipts.captureEpoch(), NOW, WALL), NOW));
    }

    @Test public void laterLoadsCannotReviveANotReadyCompletion() {
        ExportAdReceipts receipts = new ExportAdReceipts();
        ExportAdReceipts.Snapshot notReady = receipts.snapshot(receipts.captureEpoch(), NOW, WALL);
        assertNull(notReady);
        receipts.ready(ad, NOW, 0);
        assertNull(receipts.issue("image/png", notReady, NOW));
        assertFalse(receipts.consume("forged", "save-png", ad, NOW));
    }

    @Test public void sharedCancelNewSaveAndLifecycleEpochsInvalidateIssuedReceipts() {
        for (int transition = 0; transition < 4; transition++) {
            ExportAdReceipts receipts = ready();
            String receipt = issue(receipts, "application/json");
            if (transition < 2) receipts.invalidate();
            else receipts.suspend();
            receipts.ready(ad, NOW - 1, 0);
            assertFalse(receipts.consume(receipt, "save-sq", ad, NOW));
        }
    }

    @Test public void backgroundOrNewSaveDuringTheWriteCannotAcquireAFreshOpportunity() {
        ExportAdReceipts receipts = ready();
        long writingEpoch = receipts.captureEpoch();
        receipts.suspend();
        receipts.ready(ad, NOW - 1, 0);
        assertNull(receipts.snapshot(writingEpoch, NOW, WALL));
    }

    @Test public void cancellationAfterProofConsumptionStillBlocksTheFinalSdkHandoff() {
        ExportAdReceipts receipts = ready();
        String receipt = issue(receipts, "image/png");
        long evaluatedEpoch = receipts.captureEpoch();
        assertTrue(receipts.consume(receipt, "save-png", ad, NOW));
        receipts.invalidate();
        assertFalse(receipts.isCurrent(evaluatedEpoch));
    }

    @Test public void consentEvaluationDelayCannotShowAfterTheConsumedProofExpires() {
        ExportAdReceipts receipts = ready();
        String receipt = issue(receipts, "image/png");
        ExportAdReceipts.Snapshot proof = receipts.consumeProof(receipt, "save-png", ad, NOW);
        assertNotNull(proof);
        assertTrue(receipts.isCurrent(proof, NOW + ExportAdReceipts.MAX_RECEIPT_AGE_MS - 1));
        assertFalse(receipts.isCurrent(proof, NOW + ExportAdReceipts.MAX_RECEIPT_AGE_MS));
        assertNull(receipts.consumeProof(receipt, "save-png", ad, NOW));
    }

    @Test public void consumedProofStillRequiresTheSameEpochAndPreparedAd() {
        ExportAdReceipts receipts = ready();
        ExportAdReceipts.Snapshot proof = receipts.consumeProof(issue(receipts, "image/gif"),
            "save-gif", ad, NOW);
        assertNotNull(proof);
        receipts.invalidate();
        assertFalse(receipts.isCurrent(proof, NOW));
        receipts.ready(new Object(), NOW - 1, 0);
        assertFalse(receipts.isCurrent(proof, NOW));
    }

    @Test public void consumedProofRejectsCacheExpiryAndClockBackAtSdkHandoff() {
        ExportAdReceipts receipts = new ExportAdReceipts();
        receipts.ready(ad, 1, 0);
        long savedAt = ExportAdPolicy.MAX_AD_AGE_MS;
        ExportAdReceipts.Snapshot completion = receipts.snapshot(receipts.captureEpoch(), savedAt, WALL);
        String receipt = receipts.issue("image/png", completion, savedAt);
        ExportAdReceipts.Snapshot proof = receipts.consumeProof(receipt, "save-png", ad, savedAt);
        assertNotNull(proof);
        assertTrue(receipts.isCurrent(proof, savedAt));
        assertFalse(receipts.isCurrent(proof, savedAt + 1));
        assertFalse(receipts.isCurrent(proof, savedAt - 1));
    }

    @Test public void activityRecreationCannotTransferProofsOrRestoredPickerOwnership() {
        ExportAdReceipts previous = ready();
        String receipt = issue(previous, "image/png");
        previous.suspend();
        ExportAdReceipts recreated = ready();
        assertFalse(recreated.consume(receipt, "save-png", ad, NOW));
        assertNull(recreated.snapshot(-1, NOW, WALL));
    }

    @Test public void cachedAdReplacementCannotReuseAPreviousCompletion() {
        ExportAdReceipts receipts = ready();
        String receipt = issue(receipts, "image/gif");
        Object laterAd = new Object();
        receipts.ready(laterAd, NOW, 0);
        assertFalse(receipts.consume(receipt, "save-gif", laterAd, NOW));
    }

    @Test public void completionExpiresAtOneSecondAndRejectsClockBack() {
        ExportAdReceipts receipts = ready();
        assertTrue(receipts.consume(issue(receipts, "image/png"), "save-png", ad,
            NOW + ExportAdReceipts.MAX_RECEIPT_AGE_MS - 1));
        assertFalse(receipts.consume(issue(receipts, "image/png"), "save-png", ad,
            NOW + ExportAdReceipts.MAX_RECEIPT_AGE_MS));
        assertFalse(receipts.consume(issue(receipts, "image/png"), "save-png", ad, NOW - 1));
    }

    @Test public void diskCommitDelayCannotIssueAReceiptAfterTheWindow() {
        ExportAdReceipts receipts = ready();
        ExportAdReceipts.Snapshot completion = receipts.snapshot(receipts.captureEpoch(), NOW, WALL);
        assertNull(receipts.issue("image/png", completion, NOW + ExportAdReceipts.MAX_RECEIPT_AGE_MS));
    }

    @Test public void oneCooldownAppliesToAllMimeSnapshotsAndEndsAtTenMinutes() {
        ExportAdReceipts receipts = ready();
        receipts.ready(ad, NOW - 1, WALL);
        long epoch = receipts.captureEpoch();
        assertNull(receipts.snapshot(epoch, NOW, WALL + ExportAdPolicy.COOLDOWN_MS - 1));
        assertNotNull(receipts.snapshot(epoch, NOW, WALL + ExportAdPolicy.COOLDOWN_MS));
        assertNull(receipts.snapshot(epoch, NOW, WALL - 1));
    }

    @Test public void cacheExpirationDuringTheReceiptWindowStillSkips() {
        ExportAdReceipts receipts = new ExportAdReceipts();
        receipts.ready(ad, 1, 0);
        long savedAt = ExportAdPolicy.MAX_AD_AGE_MS;
        ExportAdReceipts.Snapshot saved = receipts.snapshot(receipts.captureEpoch(), savedAt, WALL);
        assertNotNull(saved);
        String receipt = receipts.issue("image/png", saved, savedAt);
        assertFalse(receipts.consume(receipt, "save-png", ad, savedAt + 1));
    }
}
