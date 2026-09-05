package br.com.oitavabetim.music;

import android.content.ActivityNotFoundException;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TransposeLauncher")
public class TransposeLauncherPlugin extends Plugin {
    private static final String TRANSPOSE_PACKAGE = "com.example.transpose";

    @PluginMethod
    public void open(PluginCall call) {
        String url = call.getString("url");
        JSObject result = new JSObject();

        if (url == null || url.trim().isEmpty()) {
            result.put("opened", false);
            result.put("reason", "invalid-url");
            call.resolve(result);
            return;
        }

        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_TEXT, url.trim());
        intent.setPackage(TRANSPOSE_PACKAGE);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        try {
            getActivity().startActivity(intent);
            result.put("opened", true);
            call.resolve(result);
        } catch (ActivityNotFoundException error) {
            result.put("opened", false);
            result.put("reason", "not-installed");
            call.resolve(result);
        } catch (Exception error) {
            result.put("opened", false);
            result.put("reason", "launch-failed");
            call.resolve(result);
        }
    }
}
