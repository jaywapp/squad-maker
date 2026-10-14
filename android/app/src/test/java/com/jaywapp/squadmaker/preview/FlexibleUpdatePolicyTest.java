package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.*;
import org.junit.Test;

public class FlexibleUpdatePolicyTest {
    private FlexibleUpdatePolicy available(int dismissed, String installStatus) {
        FlexibleUpdatePolicy policy = new FlexibleUpdatePolicy(true, dismissed);
        policy.resume();
        long epoch = policy.beginCheck(false);
        policy.info(epoch, 2, true, true, installStatus, 50, 100);
        return policy;
    }

    @Test public void onlyProductionReleaseInstalledByPlayIsEligible() {
        assertTrue(FlexibleUpdatePolicy.eligible("com.jaywapp.iamheadcoach", false, "com.android.vending"));
        assertFalse(FlexibleUpdatePolicy.eligible("com.jaywapp.squadmaker.preview", false, "com.android.vending"));
        assertFalse(FlexibleUpdatePolicy.eligible("com.jaywapp.iamheadcoach", true, "com.android.vending"));
        assertFalse(FlexibleUpdatePolicy.eligible("com.jaywapp.iamheadcoach", false, null));
        assertFalse(FlexibleUpdatePolicy.eligible("com.jaywapp.iamheadcoach", false, "other-store"));
        FlexibleUpdatePolicy unsupported = new FlexibleUpdatePolicy(false, 0);
        unsupported.resume();
        assertEquals(-1, unsupported.beginCheck(true));
        assertFalse(unsupported.beginFlow());
        assertNull(unsupported.beginCompletion(1, true));
    }

    @Test public void immediateOnlyAvailabilityCannotStartFlexibleUpdate() {
        FlexibleUpdatePolicy policy = available(0, "unknown");
        long epoch = policy.beginCheck(true);
        policy.info(epoch, 2, true, false, "unknown", 0, 0);
        assertEquals("not-available", policy.status);
        assertEquals("flexible-unavailable", policy.reason);
        assertFalse(policy.shouldNotify());
    }

    @Test public void dismissSurvivesRecreationButManualCheckAndNewVersionCanNotify() {
        FlexibleUpdatePolicy policy = available(0, "unknown");
        assertTrue(policy.shouldNotify());
        assertEquals(2, policy.dismiss());
        assertFalse(policy.shouldNotify());
        FlexibleUpdatePolicy recreated = available(2, "unknown");
        assertFalse(recreated.shouldNotify());
        long epoch = recreated.beginCheck(true);
        recreated.info(epoch, 2, true, true, "unknown", 0, 0);
        assertTrue(recreated.shouldNotify());
        recreated.dismiss();
        epoch = recreated.beginCheck(false);
        recreated.info(epoch, 3, true, true, "unknown", 0, 0);
        assertTrue(recreated.shouldNotify());
    }

    @Test public void cancelledFlowDoesNotRepeatPromptAndAllowsExplicitRetry() {
        FlexibleUpdatePolicy policy = available(0, "unknown");
        assertTrue(policy.beginFlow());
        assertFalse(policy.beginFlow());
        policy.flowResult("cancelled", "user-cancelled");
        assertFalse(policy.shouldNotify());
        assertTrue(policy.beginFlow());
        policy.flowResult("failed", "update-failed");
        assertTrue(policy.beginFlow());
    }

    @Test public void resumeOnlyRestoresDownloadedStateWithoutCompletingOrStartingAFlow() {
        FlexibleUpdatePolicy policy = available(0, "downloading");
        assertFalse(policy.beginFlow());
        policy.pause();
        policy.resume();
        long epoch = policy.beginCheck(false);
        policy.info(epoch, 2, false, false, "downloaded", 100, 100);
        assertEquals("downloaded", policy.status);
        assertTrue(policy.shouldNotify());
        assertFalse(policy.beginFlow());
        assertEquals("completion-expired", policy.consumeCompletion("unissued", 0, true));
    }

    @Test public void offlineFailureKeepsDownloadedUpdateAndRejectsOldCheckCallbacks() {
        FlexibleUpdatePolicy policy = available(0, "downloaded");
        long epoch = policy.beginCheck(false);
        policy.checkFailed(epoch);
        assertEquals("downloaded", policy.status);
        assertEquals("check-failed", policy.reason);
        epoch = policy.beginCheck(false);
        policy.pause();
        policy.resume();
        policy.info(epoch, 99, true, true, "unknown", 0, 0);
        assertEquals(2, policy.availableVersionCode);
        assertEquals("downloaded", policy.status);
    }

    @Test public void completionRequiresCurrentVerifiedReceiptAndConsumesChallengeOnce() {
        FlexibleUpdatePolicy policy = available(0, "downloaded");
        assertNull(policy.beginCompletion(3, false));
        String challenge = policy.beginCompletion(3, true);
        assertNotNull(challenge);
        assertEquals("storage-unverified", policy.consumeCompletion(challenge, 4, true));
        assertEquals("completion-expired", policy.consumeCompletion(challenge, 3, true));
        challenge = policy.beginCompletion(4, true);
        assertNull(policy.consumeCompletion(challenge, 4, true));
        assertEquals("installing", policy.status);
        assertEquals("update-not-ready", policy.consumeCompletion(challenge, 4, true));
    }

    @Test public void pauseDestroyAndVersionChangeInvalidateCompletionAuthorization() {
        FlexibleUpdatePolicy policy = available(0, "downloaded");
        String challenge = policy.beginCompletion(1, true);
        policy.pause();
        assertEquals("update-not-ready", policy.consumeCompletion(challenge, 1, true));
        policy.resume();
        assertEquals("completion-expired", policy.consumeCompletion(challenge, 1, true));
        challenge = policy.beginCompletion(1, true);
        policy.applyInfo(3, true, true, "downloaded", 0, 0);
        assertEquals("completion-expired", policy.consumeCompletion(challenge, 1, true));
        challenge = policy.beginCompletion(1, true);
        policy.destroy();
        policy.resume();
        assertEquals("update-not-ready", policy.consumeCompletion(challenge, 1, true));
        assertFalse(policy.beginFlow());
    }

    @Test public void completionFailureRequiresNewChallengeAndFreshStorageVerification() {
        FlexibleUpdatePolicy policy = available(0, "downloaded");
        String challenge = policy.beginCompletion(1, true);
        assertNull(policy.consumeCompletion(challenge, 1, true));
        policy.completionFailed();
        assertEquals("downloaded", policy.status);
        assertEquals("complete-failed", policy.reason);
        assertNull(policy.beginCompletion(1, false));
        assertNotNull(policy.beginCompletion(2, true));
    }

    @Test public void lateFlowAcceptanceCannotDowngradeDownloadCompletion() {
        FlexibleUpdatePolicy policy = available(0, "unknown");
        policy.beginFlow();
        policy.applyInfo(2, true, true, "downloaded", 100, 100);
        policy.flowResult("pending", null);
        assertEquals("downloaded", policy.status);
        assertTrue(policy.shouldNotify());
    }

    @Test public void explicitFlowInvalidatesOlderAvailabilityQuery() {
        FlexibleUpdatePolicy policy = available(0, "unknown");
        long oldCheck = policy.beginCheck(true);
        assertTrue(policy.beginFlow());
        policy.flowResult("pending", null);
        policy.checkFailed(oldCheck);
        assertEquals("pending", policy.status);
    }

    @Test public void restoringAnyActiveInstallStatePreventsStartingAnotherFlow() {
        for (String status : new String[] { "pending", "downloading", "downloaded", "installing" }) {
            FlexibleUpdatePolicy policy = available(0, status);
            assertTrue(FlexibleUpdatePolicy.activeInstall(status));
            assertFalse(policy.beginFlow());
        }
        assertFalse(FlexibleUpdatePolicy.activeInstall("available"));
    }

    @Test public void manualFreshCheckCanRecoverCancelledOrFailedDownloadForExplicitRetry() {
        for (String terminal : new String[] { "cancelled", "failed" }) {
            FlexibleUpdatePolicy policy = available(2, terminal);
            assertEquals(terminal, policy.status);
            assertFalse(policy.shouldNotify());
            long epoch = policy.beginCheck(true);
            policy.info(epoch, 2, true, true, terminal, 0, 100);
            assertEquals("available", policy.status);
            assertTrue(policy.shouldNotify());
            assertTrue(policy.beginFlow());
        }
        FlexibleUpdatePolicy disallowed = available(2, "cancelled");
        long epoch = disallowed.beginCheck(true);
        disallowed.info(epoch, 2, true, false, "cancelled", 0, 100);
        assertEquals("cancelled", disallowed.status);
        assertFalse(disallowed.shouldNotify());
    }

    @Test public void installListenerSupersedesOlderQueryAndPreventsProgressRegression() {
        FlexibleUpdatePolicy policy = available(0, "downloading");
        long old = policy.beginCheck(false);
        policy.installState("downloaded", 100, 100);
        policy.info(old, 2, true, true, "downloading", 50, 100);
        assertEquals("downloaded", policy.status);
        assertEquals(100, policy.bytesDownloaded);
        assertTrue(policy.shouldNotify());
        assertNotNull(policy.beginCompletion(1, true));
        for (String state : new String[] { "pending", "installing" }) {
            policy = available(0, state);
            old = policy.beginCheck(false);
            assertEquals(state, policy.status);
            policy.checkFailed(old);
            assertEquals(state, policy.status);
        }
    }

    @Test public void installListenerSupersedesFreshStartQueryAndDuplicateDownloadedKeepsChallenge() {
        FlexibleUpdatePolicy policy = available(0, "unknown");
        policy.beginFlow();
        long oldStart = policy.epoch();
        policy.installState("downloaded", 100, 100);
        assertFalse(policy.accepts(oldStart));
        policy.flowResult("downloaded", null);
        String challenge = policy.beginCompletion(1, true);
        policy.installState("downloaded", 100, 100);
        assertNull(policy.consumeCompletion(challenge, 1, true));
    }

    @Test public void lateFreshQueryFailureCannotOverwriteDownloadedListenerState() {
        FlexibleUpdatePolicy policy = available(0, "unknown");
        policy.beginFlow();
        long old = policy.epoch();
        policy.installState("downloaded", 100, 100);
        policy.freshQueryFailed(old);
        assertEquals("downloaded", policy.status);
        assertTrue(policy.shouldNotify());
        assertNotNull(policy.beginCompletion(1, true));
        FlexibleUpdatePolicy current = available(0, "unknown");
        current.beginFlow();
        current.freshQueryFailed(current.epoch());
        assertEquals("failed", current.status);
        assertEquals("check-failed", current.reason);
        assertTrue(current.beginFlow());
    }

    @Test public void coldInstallEventBootstrapsVersionWithoutRegressingProgress() {
        for (String event : new String[] { "pending", "downloading", "downloaded" }) {
            FlexibleUpdatePolicy policy = new FlexibleUpdatePolicy(true, 0);
            policy.resume();
            long query = policy.beginCheck(false);
            policy.installState(event, 100, 100);
            assertFalse(policy.accepts(query));
            policy.info(query, 2, true, true, "downloading", 25, 100);
            assertEquals(2, policy.availableVersionCode);
            assertEquals(event, policy.status);
            assertEquals(100, policy.bytesDownloaded);
            if (!"downloaded".equals(event)) policy.installState("downloaded", 100, 100);
            assertTrue(policy.shouldNotify());
            assertNotNull(policy.beginCompletion(1, true));
        }
    }

    @Test public void coldMetadataCannotCrossPauseDestroyOrAReplacementQuery() {
        for (boolean destroy : new boolean[] { false, true }) {
            FlexibleUpdatePolicy policy = new FlexibleUpdatePolicy(true, 0);
            policy.resume();
            long old = policy.beginCheck(false);
            policy.installState("downloaded", 100, 100);
            if (destroy) policy.destroy(); else policy.pause();
            policy.resume();
            policy.info(old, 99, true, true, "downloaded", 100, 100);
            assertEquals(0, policy.availableVersionCode);
        }
        FlexibleUpdatePolicy policy = new FlexibleUpdatePolicy(true, 0);
        policy.resume();
        long old = policy.beginCheck(false);
        policy.installState("downloaded", 100, 100);
        long current = policy.beginCheck(true);
        policy.info(old, 99, true, true, "downloaded", 100, 100);
        assertEquals(0, policy.availableVersionCode);
        policy.info(current, 2, true, true, "downloading", 25, 100);
        assertEquals(2, policy.availableVersionCode);
        assertEquals("downloaded", policy.status);
        policy.info(old, 99, true, true, "downloaded", 100, 100);
        assertEquals(2, policy.availableVersionCode);
    }

    @Test public void unknownAvailabilityCannotBootstrapAndMetadataRefreshIsBounded() {
        FlexibleUpdatePolicy policy = new FlexibleUpdatePolicy(true, 0);
        policy.resume();
        long old = policy.beginCheck(false);
        policy.installState("downloaded", 100, 100);
        policy.info(old, 99, true, true, "unknown", 0, 100);
        assertEquals(0, policy.availableVersionCode);
        assertEquals("downloaded", policy.status);
        assertTrue(policy.claimMetadataRefresh());
        assertFalse(policy.claimMetadataRefresh());
        long current = policy.beginCheck(false);
        policy.info(current, 2, false, false, "downloaded", 100, 100);
        assertEquals(2, policy.availableVersionCode);
        assertTrue(policy.shouldNotify());
        assertFalse(policy.claimMetadataRefresh());
    }

    @Test public void freshFlowAndKnownVersionCannotReuseOlderMetadata() {
        FlexibleUpdatePolicy policy = new FlexibleUpdatePolicy(true, 0);
        policy.resume();
        long old = policy.beginCheck(false);
        policy.beginFlow();
        policy.installState("downloaded", 100, 100);
        policy.info(old, 99, true, true, "downloaded", 100, 100);
        assertEquals(0, policy.availableVersionCode);
        long current = policy.beginCheck(false);
        policy.info(current, 2, true, true, "downloaded", 100, 100);
        policy.installState("downloaded", 100, 100);
        policy.info(current, 99, true, true, "downloaded", 100, 100);
        assertEquals(2, policy.availableVersionCode);
    }
}
