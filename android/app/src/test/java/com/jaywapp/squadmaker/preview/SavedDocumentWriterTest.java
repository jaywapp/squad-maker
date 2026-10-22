package com.jaywapp.squadmaker.preview;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.Test;

public class SavedDocumentWriterTest {
    @Test public void successRunsOnlyAfterExactBytesFlushAndBothCloses() throws Exception {
        byte[] bytes = new byte[140003];
        for (int index = 0; index < bytes.length; index++) bytes[index] = (byte) index;
        AtomicBoolean inputClosed = new AtomicBoolean();
        AtomicBoolean outputClosed = new AtomicBoolean();
        AtomicBoolean flushed = new AtomicBoolean();
        AtomicInteger completed = new AtomicInteger();
        ByteArrayInputStream input = new ByteArrayInputStream(bytes) {
            @Override public void close() { inputClosed.set(true); }
        };
        ByteArrayOutputStream output = new ByteArrayOutputStream() {
            @Override public void flush() { flushed.set(true); }
            @Override public void close() { outputClosed.set(true); }
        };
        SavedDocumentWriter.write(input, () -> output, () -> {
            assertTrue(inputClosed.get());
            assertTrue(outputClosed.get());
            assertTrue(flushed.get());
            completed.incrementAndGet();
        });
        assertEquals(1, completed.get());
        assertArrayEquals(bytes, output.toByteArray());
    }

    @Test public void openReadWriteFlushOrCloseFailuresNeverConsumeFirstSave() throws Exception {
        for (String failure : new String[] { "open", "null", "read", "write", "flush", "close", "input-close" }) {
            AtomicInteger markers = new AtomicInteger();
            FirstSuccessfulSave first = new FirstSuccessfulSave(new FirstSuccessfulSave.Store() {
                @Override public boolean hasSaved() { return markers.get() != 0; }
                @Override public boolean commitSaved() { markers.incrementAndGet(); return true; }
            });
            ByteArrayInputStream input = new ByteArrayInputStream(new byte[] { 0, 127, -128, -1 }) {
                @Override public synchronized int read(byte[] bytes, int offset, int length) {
                    if ("read".equals(failure)) throw new IllegalStateException("Read failed");
                    return super.read(bytes, offset, length);
                }
                @Override public void close() throws IOException {
                    if ("input-close".equals(failure)) throw new IOException("Input close failed");
                }
            };
            OutputStream output = new OutputStream() {
                @Override public void write(int value) throws IOException {
                    if ("write".equals(failure)) throw new IOException("Write failed");
                }
                @Override public void flush() throws IOException {
                    if ("flush".equals(failure)) throw new IOException("Flush failed");
                }
                @Override public void close() throws IOException {
                    if ("close".equals(failure)) throw new IOException("Close failed");
                }
            };
            try {
                SavedDocumentWriter.write(input, () -> {
                    if ("open".equals(failure)) throw new IOException("Open failed");
                    return "null".equals(failure) ? null : output;
                }, first::recordSuccess);
                fail("Expected " + failure + " failure");
            } catch (IOException | IllegalStateException expected) {
                assertEquals(failure, 0, markers.get());
                // A subsequent real success still gets the exemption.
                assertFalse(first.recordSuccess());
                assertEquals(1, markers.get());
            }
        }
    }

    @Test public void destinationOpenFailureStillClosesInput() throws Exception {
        AtomicBoolean closed = new AtomicBoolean();
        ByteArrayInputStream input = new ByteArrayInputStream(new byte[] { 1 }) {
            @Override public void close() { closed.set(true); }
        };
        try {
            SavedDocumentWriter.write(input, () -> { throw new IOException("Provider unavailable"); },
                () -> fail("Unexpected completion"));
            fail("Expected open failure");
        } catch (IOException expected) { assertTrue(closed.get()); }
    }
}
