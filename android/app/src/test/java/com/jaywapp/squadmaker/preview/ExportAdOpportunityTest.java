package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.ArrayDeque;
import java.util.Queue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.Test;

public class ExportAdOpportunityTest {
    @Test
    public void sharingInvalidatesEveryPreviouslyQueuedOpportunity() {
        ExportAdOpportunity opportunity = new ExportAdOpportunity();
        Queue<Runnable> queued = new ArrayDeque<>();
        AtomicBoolean shown = new AtomicBoolean();
        for (int index = 0; index < 2; index++) {
            long captured = opportunity.capture();
            queued.add(() -> {
                if (opportunity.isCurrent(captured)) shown.set(true);
            });
        }
        opportunity.invalidate();
        queued.forEach(Runnable::run);
        assertFalse(shown.get());
        assertTrue(opportunity.isCurrent(opportunity.capture()));
    }

    @Test
    public void resumeCannotReviveRequestsFromBeforeOrDuringPause() {
        ExportAdOpportunity opportunity = new ExportAdOpportunity();
        long beforePause = opportunity.capture();
        opportunity.invalidate();
        long duringPause = opportunity.capture();
        opportunity.invalidate();
        assertFalse(opportunity.isCurrent(beforePause));
        assertFalse(opportunity.isCurrent(duringPause));
        assertTrue(opportunity.isCurrent(opportunity.capture()));
    }

    @Test
    public void destroyInvalidatesTheLastForegroundRequest() {
        ExportAdOpportunity opportunity = new ExportAdOpportunity();
        long captured = opportunity.capture();
        opportunity.invalidate();
        assertFalse(opportunity.isCurrent(captured));
    }

    @Test
    public void bridgeThreadInvalidationIsVisibleToQueuedMainThreadWork() throws Exception {
        ExportAdOpportunity opportunity = new ExportAdOpportunity();
        long captured = opportunity.capture();
        CountDownLatch invalidated = new CountDownLatch(1);
        Thread bridge = new Thread(() -> {
            opportunity.invalidate();
            invalidated.countDown();
        });
        bridge.start();
        assertTrue(invalidated.await(5, TimeUnit.SECONDS));
        bridge.join();
        assertFalse(opportunity.isCurrent(captured));
    }
}
