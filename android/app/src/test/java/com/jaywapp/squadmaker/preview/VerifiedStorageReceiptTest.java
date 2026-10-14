package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.*;
import org.junit.Test;

public class VerifiedStorageReceiptTest {
    @Test public void onlyCompletedVerifiedWriteIssuesReceipt() {
        VerifiedStorageReceipt receipts = new VerifiedStorageReceipt();
        assertFalse(receipts.verified());
        long serial = receipts.beginWrite();
        assertFalse(receipts.verified());
        receipts.finishWrite(serial, false);
        assertNull(receipts.receipt());
        serial = receipts.beginWrite();
        receipts.finishWrite(serial, true);
        assertTrue(receipts.matches(receipts.receipt()));
        assertFalse(receipts.matches(null));
        assertFalse(receipts.matches("unissued"));
    }

    @Test public void newWriteInvalidatesOldReceiptEvenIfWriteFails() {
        VerifiedStorageReceipt receipts = new VerifiedStorageReceipt();
        long first = receipts.beginWrite();
        receipts.finishWrite(first, true);
        String old = receipts.receipt();
        long second = receipts.beginWrite();
        assertTrue(second > first);
        assertFalse(receipts.matches(old));
        receipts.finishWrite(second, false);
        assertFalse(receipts.matches(old));
        assertFalse(receipts.verified());
    }

    @Test public void staleWriteCompletionAndReplayCannotRestoreProof() {
        VerifiedStorageReceipt receipts = new VerifiedStorageReceipt();
        long first = receipts.beginWrite();
        long second = receipts.beginWrite();
        receipts.finishWrite(first, true);
        assertFalse(receipts.verified());
        receipts.finishWrite(second, true);
        String issued = receipts.receipt();
        receipts.consume();
        assertFalse(receipts.matches(issued));
        receipts.finishWrite(second, true);
        assertFalse(receipts.verified());
    }

    @Test public void completionGateRejectsReceiptFromBeforeLatestWrite() {
        VerifiedStorageReceipt receipts = new VerifiedStorageReceipt();
        long serial = receipts.beginWrite();
        receipts.finishWrite(serial, true);
        FlexibleUpdatePolicy policy = new FlexibleUpdatePolicy(true, 0);
        policy.resume();
        policy.applyInfo(2, true, true, "downloaded", 100, 100);
        String old = receipts.receipt();
        String challenge = policy.beginCompletion(receipts.generation(), receipts.verified());
        serial = receipts.beginWrite();
        receipts.finishWrite(serial, true);
        assertEquals("storage-unverified", policy.consumeCompletion(challenge, receipts.generation(), receipts.matches(old)));
        challenge = policy.beginCompletion(receipts.generation(), receipts.verified());
        assertNull(policy.consumeCompletion(challenge, receipts.generation(), receipts.matches(receipts.receipt())));
        receipts.consume();
        assertFalse(receipts.verified());
    }
}
