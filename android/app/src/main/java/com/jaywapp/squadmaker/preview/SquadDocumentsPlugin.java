package com.jaywapp.squadmaker.preview;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(name = "SquadDocuments")
public class SquadDocumentsPlugin extends Plugin {
    private static final Set<String> MIME_TYPES = new HashSet<>(Arrays.asList("image/png", "image/gif", "application/json"));
    private static final int MAX_BYTES = 64 * 1024 * 1024;
    private volatile boolean choosingDocument = false;

    private byte[] data(PluginCall call) {
        String encoded = call.getString("data", "");
        if (encoded.length() > (MAX_BYTES / 3 + 1) * 4) throw new IllegalArgumentException("Invalid export size");
        byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
        if (bytes.length == 0 || bytes.length > MAX_BYTES) throw new IllegalArgumentException("Invalid export size");
        return bytes;
    }

    private String filename(PluginCall call) {
        String name = call.getString("filename", "squad-export").replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_");
        return name.length() > 160 ? name.substring(0, 160) : name;
    }

    private File stagedDocument(PluginCall call) {
        String token = call.getString("stagedToken", "");
        if (!token.matches("[0-9a-f-]{36}\\.bin")) throw new IllegalArgumentException("Invalid document token");
        return new File(new File(getContext().getCacheDir(), "squad-documents"), token);
    }

    @PluginMethod
    public void save(PluginCall call) {
        String mime = call.getString("mimeType");
        if (!MIME_TYPES.contains(mime)) { call.reject("Unsupported export format", "invalid-input"); return; }
        synchronized (this) {
            if (choosingDocument) { call.reject("Another document picker is open", "busy"); return; }
            choosingDocument = true;
        }
        execute(() -> {
            File staged = null;
            try {
                File directory = new File(getContext().getCacheDir(), "squad-documents");
                if (!directory.exists() && !directory.mkdirs()) throw new IllegalStateException("Cache unavailable");
                String token = UUID.randomUUID().toString() + ".bin";
                staged = new File(directory, token);
                try (FileOutputStream output = new FileOutputStream(staged)) { output.write(data(call)); }
                // Capacitor persists this call in Activity saved state. Keep the large bytes out of its Bundle.
                call.getData().remove("data");
                call.getData().put("filename", filename(call));
                call.getData().put("stagedToken", token);
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                // Keep the custom backup extension when the document provider chooses a filename.
                String pickerMime = "application/json".equals(mime)
                    && filename(call).toLowerCase(java.util.Locale.ROOT).endsWith(".sq")
                    ? "application/octet-stream" : mime;
                intent.setType(pickerMime);
                intent.putExtra(Intent.EXTRA_TITLE, filename(call));
                startActivityForResult(call, intent, "documentCreated");
            } catch (Exception error) {
                if (staged != null) staged.delete();
                choosingDocument = false;
                call.reject("Export could not be prepared", "file-write-failed");
            }
        });
    }

    @ActivityCallback
    private void documentCreated(PluginCall call, ActivityResult result) {
        if (call == null) { choosingDocument = false; return; }
        final File staged;
        try { staged = stagedDocument(call); }
        catch (Exception error) { choosingDocument = false; call.reject("Export interrupted", "file-write-failed"); return; }
        Uri uri = result.getData() == null ? null : result.getData().getData();
        if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
            staged.delete();
            choosingDocument = false;
            call.resolve(new JSObject().put("status", "cancelled"));
            return;
        }
        // Documents providers may block on network I/O; stream off the Activity result thread.
        execute(() -> {
            try {
                try (FileInputStream input = new FileInputStream(staged);
                     OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                    if (output == null) throw new IllegalStateException("No document output");
                    byte[] buffer = new byte[65536];
                    int count;
                    while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
                    output.flush();
                }
                call.resolve(new JSObject().put("status", "success"));
            } catch (Exception error) { call.reject("The document could not be saved", "file-write-failed"); }
            finally { staged.delete(); choosingDocument = false; }
        });
    }

    @PluginMethod
    public void stage(PluginCall call) {
        String mime = call.getString("mimeType");
        if (!MIME_TYPES.contains(mime)) { call.reject("Unsupported format", "invalid-input"); return; }
        execute(() -> {
            try {
                File directory = new File(getContext().getCacheDir(), "squad-exports");
                if (!directory.exists() && !directory.mkdirs()) throw new IllegalStateException("Cache unavailable");
                File file = new File(directory, UUID.randomUUID() + "-" + filename(call));
                try (FileOutputStream output = new FileOutputStream(file)) { output.write(data(call)); }
                call.getData().remove("data");
                call.resolve(new JSObject().put("uri", Uri.fromFile(file).toString()));
            } catch (Exception error) { call.reject("The sharing file could not be prepared", "file-write-failed"); }
        });
    }
}
