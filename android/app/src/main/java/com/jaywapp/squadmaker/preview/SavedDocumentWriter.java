package com.jaywapp.squadmaker.preview;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

final class SavedDocumentWriter {
    interface Destination { OutputStream open() throws IOException; }

    private SavedDocumentWriter() {}

    static void write(InputStream source, Destination destination, Runnable completed) throws IOException {
        try (InputStream input = source; OutputStream output = destination.open()) {
            if (output == null) throw new IOException("No document output");
            byte[] buffer = new byte[65536];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            output.flush();
        }
        completed.run();
    }
}
