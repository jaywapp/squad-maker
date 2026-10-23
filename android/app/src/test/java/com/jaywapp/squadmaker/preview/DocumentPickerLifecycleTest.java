package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayDeque;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.Test;

/** Exercises the production save helpers together, with explicit main/worker ordering. */
public class DocumentPickerLifecycleTest {
    private static final String TOKEN = "owned-document";

    private static final class Flow {
        final ExportAdReceipts receipts = new ExportAdReceipts();
        final DocumentSaveAttempts attempts = new DocumentSaveAttempts();
        final ArrayDeque<Runnable> main = new ArrayDeque<>();
        final ArrayDeque<Runnable> worker = new ArrayDeque<>();
        final ByteArrayOutputStream file = new ByteArrayOutputStream();
        final FirstSuccessfulSave first;
        Object cachedAd = new Object();
        long elapsed = 1_000;
        long wall = 1_000_000;
        long lastShown;
        boolean foreground;
        boolean allowed = true;
        boolean marker;
        int commits;
        int writeAttempts;
        int successfulWrites;
        long preferenceDelay;
        String failure;
        String status;
        String receipt;
        Runnable beforeClose = () -> {};

        Flow(boolean previouslySaved) {
            marker = previouslySaved;
            first = new FirstSuccessfulSave(new FirstSuccessfulSave.Store() {
                @Override public boolean hasSaved() { elapsed += preferenceDelay; return marker; }
                @Override public boolean commitSaved() { commits++; marker = true; return true; }
            });
            resume();
        }

        void publish() { receipts.ready(foreground && allowed ? cachedAd : null, 1, lastShown); }
        void pause() { receipts.pause(); foreground = false; }
        void resume() { receipts.resume(); foreground = true; publish(); }

        void prepare(String token) {
            assertTrue(attempts.reserve(token));
            long preparation = receipts.prepareDocument();
            main.add(() -> receipts.armDocument(token, preparation));
        }

        void launch() { main.remove().run(); }

        void result(String token, String mime, boolean success) {
            DocumentSaveAttempts.Claim claim = attempts.claim(token);
            if (claim == DocumentSaveAttempts.Claim.DUPLICATE) return;
            if (!success) {
                receipts.discardDocument(token);
                attempts.release(token);
                status = "cancelled";
                return;
            }
            if (claim == DocumentSaveAttempts.Claim.OWNED) receipts.documentResult(token);
            worker.add(() -> {
                writeAttempts++;
                try {
                    InputStream input = new FilterInputStream(new ByteArrayInputStream(new byte[] { 1, 2, 3 })) {
                        @Override public int read(byte[] buffer, int offset, int length) throws IOException {
                            if ("read".equals(failure)) throw new IOException("Read failed");
                            return super.read(buffer, offset, length);
                        }
                    };
                    SavedDocumentWriter.write(input, () -> new OutputStream() {
                        @Override public void write(int value) throws IOException {
                            if ("write".equals(failure)) throw new IOException("Write failed");
                            file.write(value);
                        }
                        @Override public void flush() throws IOException {
                            if ("flush".equals(failure)) throw new IOException("Flush failed");
                        }
                        @Override public void close() throws IOException {
                            beforeClose.run();
                            if ("close".equals(failure)) throw new IOException("Close failed");
                        }
                    }, () -> {
                        ExportAdReceipts.Snapshot completed = receipts.completeDocument(token, elapsed, wall);
                        if (first.recordSuccess()) receipt = receipts.issue(mime, completed, elapsed);
                    });
                    successfulWrites++;
                    status = "success";
                } catch (IOException error) {
                    status = "failed";
                } finally {
                    receipts.discardDocument(token);
                    attempts.release(token);
                }
            });
        }

        void normalResult(String mime) {
            prepare(TOKEN);
            launch();
            pause();
            result(TOKEN, mime, true);
            resume();
        }

        void write() { worker.remove().run(); }

        void assertSaved() {
            assertEquals("success", status);
            assertEquals(1, successfulWrites);
            assertArrayEquals(new byte[] { 1, 2, 3 }, file.toByteArray());
        }
    }

    @Test public void preparedAdSurvivesResultThenResumeThenFileClose() throws Exception {
        Flow flow = new Flow(true);
        flow.prepare(TOKEN);
        flow.launch();
        flow.pause();
        flow.result(TOKEN, "image/png", true);
        CountDownLatch closing = new CountDownLatch(1);
        CountDownLatch finish = new CountDownLatch(1);
        flow.beforeClose = () -> {
            closing.countDown();
            try {
                if (!finish.await(5, TimeUnit.SECONDS)) throw new AssertionError("Close was not released");
            } catch (InterruptedException error) { throw new AssertionError(error); }
        };
        Thread writer = new Thread(flow.worker.remove());
        writer.start();
        try {
            assertTrue(closing.await(5, TimeUnit.SECONDS));
            flow.resume();
        } finally {
            finish.countDown();
            writer.join(5_000);
        }
        assertFalse(writer.isAlive());
        flow.assertSaved();
        assertNotNull(flow.receipt);
        assertTrue(flow.receipts.consume(flow.receipt, "save-png", flow.cachedAd, flow.elapsed));
        assertFalse(flow.receipts.consume(flow.receipt, "save-png", flow.cachedAd, flow.elapsed));
    }

    @Test public void resumeBeforeResultAndForegroundOnlyProvidersBothWork() {
        for (boolean pauses : new boolean[] { true, false }) {
            Flow flow = new Flow(true);
            flow.prepare(TOKEN);
            flow.launch();
            if (pauses) { flow.pause(); flow.resume(); }
            flow.result(TOKEN, "image/gif", true);
            flow.write();
            flow.assertSaved();
            assertNotNull(flow.receipt);
        }
    }

    @Test public void closeBeforeResumeSkipsPermanentlyWithoutWaitingForReadiness() {
        Flow flow = new Flow(true);
        flow.prepare(TOKEN);
        flow.launch();
        flow.pause();
        flow.result(TOKEN, "application/json", true);
        flow.write();
        flow.assertSaved();
        assertNull(flow.receipt);
        flow.resume();
        assertNull(flow.receipts.completeDocument(TOKEN, flow.elapsed, flow.wall));
        assertFalse(flow.receipts.consume("forged", "save-sq", flow.cachedAd, flow.elapsed));
    }

    @Test public void readinessChangesDuringStagingDoNotCancelAnOtherwiseOwnedLaunch() {
        Flow flow = new Flow(true);
        flow.prepare(TOKEN);
        flow.cachedAd = new Object();
        flow.publish();
        flow.launch();
        flow.pause();
        flow.result(TOKEN, "image/png", true);
        flow.resume();
        flow.write();
        assertNotNull(flow.receipt);
    }

    @Test public void backgroundOrSharingDuringStagingCannotArmAfterwards() {
        for (boolean background : new boolean[] { true, false }) {
            Flow flow = new Flow(true);
            flow.prepare(TOKEN);
            if (background) { flow.pause(); flow.resume(); }
            else flow.receipts.invalidate();
            flow.launch();
            flow.result(TOKEN, "image/png", true);
            flow.write();
            flow.assertSaved();
            assertNull(flow.receipt);
        }
    }

    @Test public void additionalBackgroundOrResumeCannotReuseTheExpectedPickerReturn() {
        for (boolean resultFirst : new boolean[] { true, false }) {
            for (boolean pauseAgain : new boolean[] { true, false }) {
                Flow flow = new Flow(true);
                flow.prepare(TOKEN);
                flow.launch();
                flow.pause();
                if (resultFirst) flow.result(TOKEN, "image/png", true);
                flow.resume();
                if (pauseAgain) flow.pause();
                flow.resume();
                if (!resultFirst) flow.result(TOKEN, "image/png", true);
                flow.write();
                flow.assertSaved();
                assertNull(flow.receipt);
            }
        }
    }

    @Test public void sharedCancelConsentResetAndDestroyKeepTheFileButDiscardItsAd() {
        for (int interruption = 0; interruption < 3; interruption++) {
            Flow flow = new Flow(true);
            flow.normalResult("application/json");
            if (interruption == 0) flow.receipts.invalidate();
            else if (interruption == 1) flow.receipts.suspend();
            else flow.receipts.discardDocument(TOKEN);
            flow.publish();
            flow.write();
            flow.assertSaved();
            assertNull(flow.receipt);
        }
    }

    @Test public void cancellationAndReadWriteFlushCloseFailuresNeverConsumeFirstSave() {
        Flow cancelled = new Flow(false);
        cancelled.prepare(TOKEN);
        cancelled.launch();
        cancelled.pause();
        cancelled.result(TOKEN, "image/png", false);
        cancelled.resume();
        assertEquals("cancelled", cancelled.status);
        assertFalse(cancelled.marker);
        assertNull(cancelled.receipts.completeDocument(TOKEN, cancelled.elapsed, cancelled.wall));
        for (String failure : new String[] { "read", "write", "flush", "close" }) {
            Flow flow = new Flow(false);
            flow.normalResult("image/png");
            flow.failure = failure;
            flow.write();
            assertEquals("failed", flow.status);
            assertEquals(0, flow.successfulWrites);
            assertFalse(flow.marker);
            assertEquals(0, flow.commits);
            assertNull(flow.receipt);
            assertNull(flow.receipts.completeDocument(TOKEN, flow.elapsed, flow.wall));
        }
    }

    @Test public void firstSuccessIsExemptEvenWhenThePickerRoundTripAndAdAreReady() {
        Flow flow = new Flow(false);
        flow.normalResult("image/png");
        flow.write();
        flow.assertSaved();
        assertTrue(flow.marker);
        assertEquals(1, flow.commits);
        assertNull(flow.receipt);
    }

    @Test public void restoredCallbackCanSaveAndRecordTheFirstSuccessButCannotAcquireAnAd() {
        Flow recreated = new Flow(false);
        recreated.result(TOKEN, "application/json", true);
        recreated.write();
        recreated.assertSaved();
        assertTrue(recreated.marker);
        assertNull(recreated.receipt);
        assertNull(recreated.receipts.completeDocument(TOKEN, recreated.elapsed, recreated.wall));
    }

    @Test public void duplicateResultDoesNotWriteTwiceOrReleaseTheOwnedBusyReservation() {
        Flow flow = new Flow(true);
        flow.normalResult("image/gif");
        flow.result(TOKEN, "image/gif", true);
        assertEquals(1, flow.worker.size());
        assertFalse(flow.attempts.reserve("next"));
        flow.write();
        flow.assertSaved();
        assertEquals(1, flow.writeAttempts);
        assertTrue(flow.attempts.reserve("next"));
    }

    @Test public void noFillAtCloseCannotBeReplayedByALaterLoad() {
        Flow flow = new Flow(true);
        flow.normalResult("image/png");
        flow.cachedAd = null;
        flow.publish();
        flow.write();
        flow.assertSaved();
        assertNull(flow.receipt);
        flow.cachedAd = new Object();
        flow.publish();
        assertNull(flow.receipts.completeDocument(TOKEN, flow.elapsed, flow.wall));
    }

    @Test public void closeBetweenResumeAndReadinessPublishDoesNotWaitOrReplay() {
        Flow flow = new Flow(true);
        flow.prepare(TOKEN);
        flow.launch();
        flow.pause();
        flow.result(TOKEN, "image/png", true);
        flow.receipts.resume();
        flow.foreground = true;
        flow.write();
        flow.assertSaved();
        assertNull(flow.receipt);
        flow.publish();
        assertNull(flow.receipts.completeDocument(TOKEN, flow.elapsed, flow.wall));
    }

    @Test public void adThatIsReadyBeforeCloseCanBeEvaluatedButNeverWaitedForAfterClose() {
        Flow flow = new Flow(true);
        flow.cachedAd = null;
        flow.publish();
        flow.normalResult("image/png");
        flow.cachedAd = new Object();
        flow.publish();
        flow.write();
        assertNotNull(flow.receipt);
    }

    @Test public void preferenceReadDelayStillExpiresTheProofFromTheActualFileClose() {
        Flow flow = new Flow(true);
        flow.normalResult("image/png");
        flow.preferenceDelay = ExportAdReceipts.MAX_RECEIPT_AGE_MS;
        flow.write();
        flow.assertSaved();
        assertNull(flow.receipt);
    }

    @Test public void newSaveOrActivityChangeOrAdReplacementInvalidatesCompletedProofs() {
        for (int transition = 0; transition < 3; transition++) {
            Flow flow = new Flow(true);
            flow.normalResult("image/png");
            flow.write();
            assertNotNull(flow.receipt);
            if (transition == 0) flow.prepare("next");
            else if (transition == 1) { flow.pause(); flow.resume(); }
            else { flow.cachedAd = new Object(); flow.publish(); }
            assertFalse(flow.receipts.consume(flow.receipt, "save-png", flow.cachedAd, flow.elapsed));
        }
    }

    @Test public void completedDocumentsKeepOneCooldownAcrossEveryFormat() {
        for (String mime : new String[] { "image/png", "image/gif", "application/json" }) {
            Flow flow = new Flow(true);
            flow.lastShown = flow.wall - ExportAdPolicy.COOLDOWN_MS + 1;
            flow.publish();
            flow.normalResult(mime);
            flow.write();
            flow.assertSaved();
            assertNull(flow.receipt);
        }
    }
}
