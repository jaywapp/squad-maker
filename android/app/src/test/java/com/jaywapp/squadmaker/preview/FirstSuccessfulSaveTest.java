package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.Test;

public class FirstSuccessfulSaveTest {
    private static final class MemoryStore implements FirstSuccessfulSave.Store {
        boolean saved;
        boolean commitsSucceed = true;
        int commits;

        @Override public boolean hasSaved() { return saved; }
        @Override public boolean commitSaved() {
            commits++;
            saved = true;
            return commitsSucceed;
        }
    }

    @Test public void firstSuccessIsExemptEvenWithoutAnyReadyAd() {
        MemoryStore store = new MemoryStore();
        FirstSuccessfulSave policy = new FirstSuccessfulSave(store);
        assertFalse(policy.recordSuccess());
        assertTrue(store.saved);
        assertEquals(1, store.commits);
        assertTrue(policy.recordSuccess());
        assertEquals(1, store.commits);
    }

    @Test public void persistedSuccessSurvivesRestartAndIsSharedAcrossFormats() {
        MemoryStore store = new MemoryStore();
        assertFalse(new FirstSuccessfulSave(store).recordSuccess());
        FirstSuccessfulSave restarted = new FirstSuccessfulSave(store);
        for (String mime : new String[] { "image/png", "image/gif", "application/json" }) {
            assertTrue(ExportAdPolicy.placementForMime(mime) != null);
            assertTrue(restarted.recordSuccess());
        }
        assertEquals(1, store.commits);
    }

    @Test public void upgradeWithoutMarkerAndNewInstallBothReceiveFirstExemption() {
        for (int installation = 0; installation < 2; installation++) {
            MemoryStore store = new MemoryStore();
            assertFalse(new FirstSuccessfulSave(store).recordSuccess());
            assertTrue(store.saved);
        }
    }

    @Test public void simultaneousSuccessesCommitExactlyOneExemption() throws Exception {
        MemoryStore store = new MemoryStore();
        FirstSuccessfulSave policy = new FirstSuccessfulSave(store);
        CountDownLatch ready = new CountDownLatch(8);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(8);
        AtomicInteger eligible = new AtomicInteger();
        for (int index = 0; index < 8; index++) {
            new Thread(() -> {
                ready.countDown();
                try {
                    if (start.await(5, TimeUnit.SECONDS) && policy.recordSuccess()) eligible.incrementAndGet();
                } catch (InterruptedException error) { Thread.currentThread().interrupt(); }
                finally { done.countDown(); }
            }).start();
        }
        assertTrue(ready.await(5, TimeUnit.SECONDS));
        start.countDown();
        assertTrue(done.await(5, TimeUnit.SECONDS));
        assertEquals(1, store.commits);
        assertEquals(7, eligible.get());
    }

    @Test public void failedCommitPoisonsTheProcessEvenWhenMemoryClaimsItSucceeded() {
        MemoryStore store = new MemoryStore();
        store.commitsSucceed = false;
        FirstSuccessfulSave policy = new FirstSuccessfulSave(store);
        assertFalse(policy.recordSuccess());
        assertTrue(store.saved);
        store.commitsSucceed = true;
        assertFalse(policy.recordSuccess());
        assertFalse(policy.recordSuccess());
        assertEquals(1, store.commits);
    }

    @Test public void uncertainPreferenceReadsCannotGrantEligibility() {
        AtomicInteger reads = new AtomicInteger();
        FirstSuccessfulSave policy = new FirstSuccessfulSave(new FirstSuccessfulSave.Store() {
            @Override public boolean hasSaved() {
                reads.incrementAndGet();
                throw new IllegalStateException("Unreadable preferences");
            }
            @Override public boolean commitSaved() { throw new AssertionError("Unexpected commit"); }
        });
        assertFalse(policy.recordSuccess());
        assertFalse(policy.recordSuccess());
        assertEquals(1, reads.get());
    }

    @Test public void commitExceptionRemainsFailClosed() {
        FirstSuccessfulSave policy = new FirstSuccessfulSave(new FirstSuccessfulSave.Store() {
            @Override public boolean hasSaved() { return false; }
            @Override public boolean commitSaved() { throw new IllegalStateException("Disk unavailable"); }
        });
        assertFalse(policy.recordSuccess());
        assertFalse(policy.recordSuccess());
    }
}
