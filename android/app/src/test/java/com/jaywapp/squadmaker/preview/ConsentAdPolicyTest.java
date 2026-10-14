package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class ConsentAdPolicyTest {
    private ConsentAdPolicy launched(boolean permission) {
        ConsentAdPolicy policy = new ConsentAdPolicy(true);
        policy.resume();
        assertTrue(policy.beginUpdate());
        policy.updatePermission(permission);
        return policy;
    }

    @Test
    public void permissionCannotBypassLaunchUpdate() {
        ConsentAdPolicy policy = new ConsentAdPolicy(true);
        policy.resume();
        policy.updatePermission(true);
        assertFalse(policy.canRequestAds());
        assertFalse(policy.canUseAds());
    }

    @Test
    public void updateIsOncePerLaunchAndResumeDoesNotRepeatIt() {
        ConsentAdPolicy policy = launched(true);
        assertFalse(policy.beginUpdate());
        policy.pause();
        assertFalse(policy.canUseAds());
        policy.resume();
        assertTrue(policy.canUseAds());
        assertFalse(policy.beginUpdate());
    }

    @Test
    public void deniedOrFailedWithoutPreviousPermissionCannotRequestAds() {
        ConsentAdPolicy policy = launched(false);
        assertFalse(policy.canRequestAds());
        assertFalse(policy.canUseAds());
        assertTrue(policy.beginForm(false));
        policy.finishForm(false);
        assertFalse(policy.canUseAds());
    }

    @Test
    public void updateFailureUsesUmpsPreviousPermissionWithoutInventingConsent() {
        ConsentAdPolicy policy = launched(true);
        assertTrue(policy.canUseAds());
        // A failed update leaves UMP's previous-session canRequestAds value intact.
        assertFalse(policy.updatePermission(true));
        assertTrue(policy.canUseAds());
        assertTrue(policy.beginForm(false));
        policy.finishForm(true);
        assertTrue(policy.canUseAds());
    }

    @Test
    public void privacyFormBlocksRequestsAndInvalidatesOldCallbacksEvenIfPermissionUnchanged() {
        ConsentAdPolicy policy = launched(true);
        long previous = policy.generation();
        assertTrue(policy.beginForm(false));
        assertTrue(policy.canRequestAds());
        assertFalse(policy.canUseAds());
        assertFalse(policy.accepts(previous));
        assertFalse(policy.beginForm(false));
        policy.finishForm(true);
        assertTrue(policy.canUseAds());
        assertFalse(policy.accepts(previous));
        assertTrue(policy.accepts(policy.generation()));
    }

    @Test
    public void withdrawalPreventsShowingPreviouslyCachedAds() {
        ConsentAdPolicy policy = launched(true);
        long cached = policy.generation();
        policy.beginForm(false);
        policy.finishForm(false);
        assertFalse(policy.canUseAds());
        assertFalse(policy.accepts(cached));
    }

    @Test
    public void fullScreenAdAndBackgroundPreventConsentFormOverlap() {
        ConsentAdPolicy policy = launched(true);
        assertFalse(policy.beginForm(true));
        policy.pause();
        assertFalse(policy.beginForm(false));
        policy.resume();
        assertTrue(policy.beginForm(false));
    }

    @Test
    public void formDismissalInBackgroundWaitsForResumeBeforeLoading() {
        ConsentAdPolicy policy = launched(true);
        policy.beginForm(false);
        policy.pause();
        policy.finishForm(true);
        assertFalse(policy.canUseAds());
        policy.resume();
        assertTrue(policy.canUseAds());
    }

    @Test
    public void destroyedActivityCancelsFormAndCallbacksAndCannotResume() {
        ConsentAdPolicy policy = launched(true);
        long callback = policy.generation();
        policy.beginForm(false);
        policy.destroy();
        policy.finishForm(true);
        policy.resume();
        assertFalse(policy.isFormShowing());
        assertFalse(policy.canRequestAds());
        assertFalse(policy.accepts(callback));
        assertFalse(policy.beginUpdate());
        assertFalse(policy.beginForm(false));
        assertTrue(launched(true).canUseAds());
    }

    @Test
    public void processSdkGatePreventsDuplicateInitializationAcrossActivityRecreation() {
        ConsentAdPolicy.InitializationGate gate = new ConsentAdPolicy.InitializationGate();
        assertFalse(gate.begin(false));
        assertTrue(gate.begin(launched(true).canUseAds()));
        assertTrue(gate.isStarting());
        assertFalse(gate.begin(launched(true).canUseAds()));
        gate.complete();
        assertTrue(gate.isReady());
        assertFalse(gate.isStarting());
        assertFalse(gate.begin(true));
    }

    @Test
    public void sdkExceptionAllowsRetryOnlyWhenConsentPermitsIt() {
        ConsentAdPolicy.InitializationGate gate = new ConsentAdPolicy.InitializationGate();
        assertTrue(gate.begin(true));
        gate.fail();
        assertFalse(gate.isReady());
        assertFalse(gate.begin(false));
        assertTrue(gate.begin(true));
    }

    @Test
    public void privacyChoicesDoNotChangeExportPlacementOrCooldownPolicy() {
        long lastShownAt = 1_000_000L;
        ConsentAdPolicy policy = launched(true);
        policy.beginForm(false);
        policy.finishForm(false);
        for (String placement : new String[] { "gif", "sq", "share-text" }) {
            assertTrue(ExportAdPolicy.isSupportedPlacement(placement));
            assertEquals("cooldown", ExportAdPolicy.cooldownReason(lastShownAt + 1, lastShownAt));
        }
    }

    @Test
    public void updateCallbackDuringPrivacyFormDrainsAfterDismissalWithoutRequiringResume() {
        for (boolean permissionAfterPrivacy : new boolean[] { true, false }) {
            ConsentAdPolicy policy = launched(true);
            assertTrue(policy.beginForm(false));
            policy.queueRequiredForm();
            assertFalse(policy.beginPendingForm(true, false));
            policy.finishForm(permissionAfterPrivacy);
            assertTrue(policy.hasPendingForm());
            assertFalse(policy.canUseAds());
            assertTrue(policy.beginPendingForm(true, false));
            assertFalse(policy.hasPendingForm());
            policy.finishForm(true);
            assertTrue(policy.canUseAds());
            assertFalse(policy.beginPendingForm(true, false));
        }
    }

    @Test
    public void pendingNoOpFormDoesNotInvalidateValidAdsAndDestroyCancelsPendingWork() {
        ConsentAdPolicy policy = launched(true);
        long generation = policy.generation();
        policy.queueRequiredForm();
        assertFalse(policy.canUseAds());
        assertTrue(policy.beginPendingForm(false, false));
        assertEquals(generation, policy.generation());
        assertTrue(policy.canUseAds());
        policy.queueRequiredForm();
        policy.destroy();
        assertFalse(policy.hasPendingForm());
        assertFalse(policy.beginPendingForm(true, false));
    }

    @Test
    public void unresolvedLiveAudienceRejectsEvenPositiveUmpCallbacksAndResume() {
        ConsentAdPolicy policy = new ConsentAdPolicy(false);
        for (int resume = 0; resume < 2; resume++) {
            policy.resume();
            assertFalse(policy.beginUpdate());
            assertFalse(policy.updatePermission(true));
            assertFalse(policy.beginForm(false));
            policy.queueRequiredForm();
            assertFalse(policy.hasPendingForm());
            assertFalse(policy.beginPendingForm(false, false));
            assertFalse(policy.beginPendingForm(true, false));
            policy.finishForm(true);
            assertFalse(policy.isFormShowing());
            assertFalse(policy.canRequestAds());
            assertFalse(policy.canUseAds());
            assertFalse(policy.accepts(policy.generation()));
            policy.pause();
        }
        policy.destroy();
        policy.resume();
        assertFalse(policy.beginUpdate());
    }

    @Test
    public void unresolvedLiveAudienceCannotUseEvenAnAlreadyInitializedSdk() {
        ConsentAdPolicy policy = new ConsentAdPolicy(false);
        ConsentAdPolicy.InitializationGate gate = new ConsentAdPolicy.InitializationGate();
        policy.resume();
        policy.updatePermission(true);
        assertFalse(gate.begin(policy.canUseAds()));
        assertFalse(gate.isStarting());
        gate.complete(); // Even a process-wide SDK already initialized by another Activity cannot authorize a request.
        assertTrue(gate.isReady());
        assertFalse(policy.canUseAds());
    }
}
