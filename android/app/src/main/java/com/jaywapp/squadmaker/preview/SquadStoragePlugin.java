package com.jaywapp.squadmaker.preview;

import android.util.AtomicFile;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileNotFoundException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

@CapacitorPlugin(name = "SquadStorage")
public class SquadStoragePlugin extends Plugin {
    private static final Object LOCK = new Object();
    private static final Set<String> KEYS = new HashSet<>(Arrays.asList("squad-maker-v1", "squad-maker-library-v1"));
    private static final int MAX_BYTES = 16 * 1024 * 1024;

    private AtomicFile store() {
        return new AtomicFile(new File(getContext().getFilesDir(), "squad-store-v1.json"));
    }

    private JSONObject readStore() throws Exception {
        AtomicFile file = store();
        File base = file.getBaseFile();
        File backup = new File(base.getPath() + ".bak");
        File pending = new File(base.getPath() + ".new");
        boolean residue = base.exists() || backup.exists() || pending.exists();
        byte[] bytes;
        try { bytes = file.readFully(); }
        catch (FileNotFoundException absent) {
            if (residue || base.exists() || backup.exists() || pending.exists() || !getContext().getFilesDir().canRead()) throw absent;
            return new JSONObject();
        }
        if (bytes.length > MAX_BYTES) throw new IllegalArgumentException("Store too large");
        return new JSONObject(new String(bytes, StandardCharsets.UTF_8));
    }

    private Object value(JSONObject object, String key) {
        return object.has(key) && !object.isNull(key) ? object.opt(key) : JSONObject.NULL;
    }

    @PluginMethod
    public void read(PluginCall call) {
        String key = call.getString("key");
        if (!KEYS.contains(key)) { call.reject("Unsupported storage key", "invalid-input"); return; }
        synchronized (LOCK) {
            try { call.resolve(new JSObject().put("value", value(readStore(), key))); }
            catch (Exception error) { call.reject("Stored data could not be read", "storage-unavailable"); }
        }
    }

    @PluginMethod
    public void commit(PluginCall call) {
        JSObject values = call.getObject("values", new JSObject());
        JSObject expected = call.getObject("expected", new JSObject());
        synchronized (LOCK) {
            FileOutputStream stream = null;
            AtomicFile file = store();
            try {
                JSONObject before = readStore();
                for (Iterator<String> keys = expected.keys(); keys.hasNext();) {
                    String key = keys.next();
                    if (!KEYS.contains(key)) { call.reject("Unsupported key", "invalid-input"); return; }
                    if (!value(before, key).equals(value(expected, key))) {
                        call.reject("Storage changed before commit", "storage-conflict"); return;
                    }
                }
                JSONObject next = new JSONObject(before.toString());
                for (Iterator<String> keys = values.keys(); keys.hasNext();) {
                    String key = keys.next();
                    if (!KEYS.contains(key)) { call.reject("Unsupported key", "invalid-input"); return; }
                    if (values.isNull(key)) next.remove(key);
                    else {
                        Object raw = values.get(key);
                        if (!(raw instanceof String)) { call.reject("Invalid value", "invalid-input"); return; }
                        JSONObject payload = new JSONObject((String) raw);
                        if ((key.equals("squad-maker-v1") && payload.optInt("v") != 1)
                                || (key.equals("squad-maker-library-v1") && payload.optInt("version") != 1)) {
                            call.reject("Unsupported data version", "invalid-input"); return;
                        }
                        next.put(key, raw);
                    }
                }
                byte[] bytes = next.toString().getBytes(StandardCharsets.UTF_8);
                if (bytes.length > MAX_BYTES) { call.reject("Storage capacity exceeded", "storage-quota"); return; }
                stream = file.startWrite();
                stream.write(bytes);
                file.finishWrite(stream);
                stream = null;
                if (!readStore().toString().equals(next.toString())) {
                    call.reject("Storage verification failed", "storage-verification"); return;
                }
                call.resolve(new JSObject().put("status", "success"));
            } catch (Exception error) {
                if (stream != null) file.failWrite(stream);
                call.reject("Data could not be committed", "storage-unavailable");
            }
        }
    }
}
