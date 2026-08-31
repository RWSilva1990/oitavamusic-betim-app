package br.com.oitavabetim.music;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PitchHandoff")
public class PitchHandoffPlugin extends Plugin {
    private static final String TRANSPOSE_PACKAGE = "com.hybridmediastudio";

    @PluginMethod
    public void openInTranspose(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("URL_REQUIRED");
            return;
        }

        // First attempt: send the YouTube/web URL as shared text directly to Transpose.
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_TEXT, url);
        shareIntent.setPackage(TRANSPOSE_PACKAGE);

        try {
            getActivity().startActivity(shareIntent);
            resolveOpened(call, "share");
            return;
        } catch (ActivityNotFoundException | SecurityException ignored) {
            // Some apps do not expose ACTION_SEND but may expose ACTION_VIEW for web links.
        }

        Intent viewIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        viewIntent.setPackage(TRANSPOSE_PACKAGE);
        try {
            getActivity().startActivity(viewIntent);
            resolveOpened(call, "view");
        } catch (ActivityNotFoundException | SecurityException error) {
            call.reject("TRANSPOSE_UNAVAILABLE", "Não foi possível entregar o link diretamente ao Transpose.", error);
        }
    }

    @PluginMethod
    public void shareLink(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("URL_REQUIRED");
            return;
        }

        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_TEXT, url);
        Intent chooser = Intent.createChooser(shareIntent, "Testar tom em outro aplicativo");

        try {
            getActivity().startActivity(chooser);
            resolveOpened(call, "chooser");
        } catch (ActivityNotFoundException error) {
            call.reject("NO_SHARE_TARGET", "Nenhum aplicativo compatível foi encontrado.", error);
        }
    }

    @PluginMethod
    public void openTransposeStore(PluginCall call) {
        Intent marketIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + TRANSPOSE_PACKAGE));
        try {
            getActivity().startActivity(marketIntent);
            resolveOpened(call, "store");
            return;
        } catch (ActivityNotFoundException ignored) {
            // Fall back to the browser if Google Play is unavailable.
        }

        Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + TRANSPOSE_PACKAGE));
        try {
            getActivity().startActivity(webIntent);
            resolveOpened(call, "store-web");
        } catch (ActivityNotFoundException error) {
            call.reject("STORE_UNAVAILABLE", "Não foi possível abrir a página do Transpose.", error);
        }
    }

    private void resolveOpened(PluginCall call, String method) {
        JSObject result = new JSObject();
        result.put("opened", true);
        result.put("method", method);
        call.resolve(result);
    }
}
