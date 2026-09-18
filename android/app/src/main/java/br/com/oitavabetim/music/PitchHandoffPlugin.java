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
    private static final String TRANSPOSE_PACKAGE = "com.example.transpose";
    private static final String TRANSPOSE_RELEASES_URL = "https://github.com/joh9911/Transpose/releases/latest";

    @PluginMethod
    public void openInTranspose(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) { call.reject("URL_REQUIRED"); return; }
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_TEXT, url.trim());
        shareIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        shareIntent.setPackage(TRANSPOSE_PACKAGE);
        try { getActivity().startActivity(shareIntent); resolveOpened(call, "share"); return; }
        catch (ActivityNotFoundException | SecurityException ignored) {}
        Intent viewIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        viewIntent.setPackage(TRANSPOSE_PACKAGE);
        try { getActivity().startActivity(viewIntent); resolveOpened(call, "view"); }
        catch (ActivityNotFoundException | SecurityException error) { call.reject("TRANSPOSE_UNAVAILABLE", "Não foi possível entregar o link diretamente ao Transpose.", error); }
    }

    @PluginMethod
    public void shareLink(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) { call.reject("URL_REQUIRED"); return; }
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("text/plain");
        shareIntent.putExtra(Intent.EXTRA_TEXT, url.trim());
        Intent chooser = Intent.createChooser(shareIntent, "Testar tom em outro aplicativo");
        try { getActivity().startActivity(chooser); resolveOpened(call, "chooser"); }
        catch (ActivityNotFoundException error) { call.reject("NO_SHARE_TARGET", "Nenhum aplicativo compatível foi encontrado.", error); }
    }

    @PluginMethod
    public void openTransposeStore(PluginCall call) {
        Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(TRANSPOSE_RELEASES_URL));
        try { getActivity().startActivity(webIntent); resolveOpened(call, "releases"); }
        catch (ActivityNotFoundException error) { call.reject("STORE_UNAVAILABLE", "Não foi possível abrir a página de download do Transpose.", error); }
    }

    private void resolveOpened(PluginCall call, String method) {
        JSObject result = new JSObject(); result.put("opened", true); result.put("method", method); call.resolve(result);
    }
}
