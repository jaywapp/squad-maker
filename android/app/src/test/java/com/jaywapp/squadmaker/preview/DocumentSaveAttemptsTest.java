package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.Test;

public class DocumentSaveAttemptsTest {
    @Test public void onlyTheOriginalPickerCallbackCanOwnAnAdOpportunity() {
        DocumentSaveAttempts attempts = new DocumentSaveAttempts();
        assertTrue(attempts.reserve("first"));
        assertEquals(DocumentSaveAttempts.Claim.OWNED, attempts.claim("first"));
        assertEquals(DocumentSaveAttempts.Claim.DUPLICATE, attempts.claim("first"));
        attempts.release("first");
        assertEquals(DocumentSaveAttempts.Claim.DUPLICATE, attempts.claim("first"));
    }

    @Test public void firstRestoredCallbackCanWriteButItsDuplicateCannot() {
        DocumentSaveAttempts recreated = new DocumentSaveAttempts();
        assertEquals(DocumentSaveAttempts.Claim.RESTORED, recreated.claim("restored"));
        assertFalse(recreated.reserve("new-save"));
        assertEquals(DocumentSaveAttempts.Claim.DUPLICATE, recreated.claim("restored"));
        recreated.release("restored");
        assertTrue(recreated.reserve("new-save"));
    }

    @Test public void releasingAnOlderWriteCannotReleaseANewerPicker() {
        DocumentSaveAttempts attempts = new DocumentSaveAttempts();
        assertTrue(attempts.reserve("new-save"));
        assertEquals(DocumentSaveAttempts.Claim.RESTORED, attempts.claim("older-restored"));
        attempts.release("older-restored");
        assertFalse(attempts.reserve("third"));
        attempts.release("new-save");
        assertTrue(attempts.reserve("third"));
    }

    @Test public void cancelledOrFailedPickerReleasesTheReservationForTheNextSave() {
        DocumentSaveAttempts attempts = new DocumentSaveAttempts();
        assertTrue(attempts.reserve("cancelled"));
        attempts.claim("cancelled");
        attempts.release("cancelled");
        assertTrue(attempts.reserve("failed"));
        attempts.release("failed");
        assertTrue(attempts.reserve("successful"));
    }

    @Test public void concurrentDuplicateCallbacksAreClaimedExactlyOnce() throws Exception {
        DocumentSaveAttempts attempts = new DocumentSaveAttempts();
        assertTrue(attempts.reserve("one"));
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(6);
        AtomicInteger owned = new AtomicInteger();
        AtomicInteger duplicate = new AtomicInteger();
        for (int index = 0; index < 6; index++) {
            new Thread(() -> {
                try {
                    if (!start.await(5, TimeUnit.SECONDS)) return;
                    DocumentSaveAttempts.Claim claim = attempts.claim("one");
                    if (claim == DocumentSaveAttempts.Claim.OWNED) owned.incrementAndGet();
                    if (claim == DocumentSaveAttempts.Claim.DUPLICATE) duplicate.incrementAndGet();
                } catch (InterruptedException error) { Thread.currentThread().interrupt(); }
                finally { done.countDown(); }
            }).start();
        }
        start.countDown();
        assertTrue(done.await(5, TimeUnit.SECONDS));
        assertEquals(1, owned.get());
        assertEquals(5, duplicate.get());
    }
}
