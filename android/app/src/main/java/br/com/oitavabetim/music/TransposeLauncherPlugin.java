package br.com.oitavabetim.music;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TransposeLauncher")
public class TransposeLauncherPlugin extends Plugin {
    private static final String TRANSPOSE_PACKAGE = "com.example.transpose";
    private static final String TRANSPOSE_RELEASES_URL = "https://github.com/joh9911/Transpose_Compose/releases/latest";

    @PluginMethod
    public void isInstalled(PluginCall call) {
        JSObject result = new JSObject();
        result.put("installed", isTransposeInstalled());
        call.resolve(result);
    }

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

        if (!isTransposeInstalled()) {
            result.put("opened", false);
            result.put("reason", "not-installed");
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

    @PluginMethod
    public void openInstallPage(PluginCall call) {
        JSObject result = new JSObject();
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(TRANSPOSE_RELEASES_URL));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        try {
            getActivity().startActivity(intent);
            result.put("opened", true);
            call.resolve(result);
        } catch (Exception error) {
            result.put("opened", false);
            result.put("reason", "launch-failed");
            call.resolve(result);
        }
    }

    private boolean isTransposeInstalled() {
        try {
            PackageManager packageManager = getContext().getPackageManager();
            packageManager.getPackageInfo(TRANSPOSE_PACKAGE, 0);
            return true;
        } catch (PackageManager.NameNotFoundException error) {
            return false;
        }
    }
}
