package br.com.oitavabetim.music;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    private static final String CSV_BRIDGE_NAME = "OitavaCsvBridge";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(TransposeLauncherPlugin.class);
        super.onCreate(savedInstanceState);

        WebView webView = bridge != null ? bridge.getWebView() : null;
        if (webView != null) {
            webView.addJavascriptInterface(new CsvDownloadBridge(), CSV_BRIDGE_NAME);
            installCsvDownloadInterceptor(webView, 700);
            installCsvDownloadInterceptor(webView, 1800);
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView currentWebView = bridge != null ? bridge.getWebView() : null;
                if (currentWebView == null) {
                    exitThroughSystemBack();
                    return;
                }

                currentWebView.evaluateJavascript(
                    "(function(){" +
                        "var path=window.location.pathname||'/';" +
                        "if(path==='/'||path==='/entrar'){return false;}" +
                        "if(window.history.length>1){" +
                            "window.history.back();" +
                            "return true;" +
                        "}" +
                        "return false;" +
                    "})()",
                    result -> {
                        if (!"true".equals(result)) {
                            exitThroughSystemBack();
                        }
                    }
                );
            }

            private void exitThroughSystemBack() {
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });
    }

    private void installCsvDownloadInterceptor(WebView webView, long delayMs) {
        webView.postDelayed(() -> webView.evaluateJavascript(
            "(function(){" +
                "if(window.__oitavaCsvDownloadInterceptorInstalled)return;" +
                "window.__oitavaCsvDownloadInterceptorInstalled=true;" +
                "window.__oitavaCsvBlobMap=new Map();" +
                "var originalCreateObjectURL=URL.createObjectURL.bind(URL);" +
                "var originalRevokeObjectURL=URL.revokeObjectURL.bind(URL);" +
                "URL.createObjectURL=function(blob){" +
                    "var url=originalCreateObjectURL(blob);" +
                    "try{" +
                        "if(blob&&typeof Blob!=='undefined'&&blob instanceof Blob){window.__oitavaCsvBlobMap.set(url,blob);}" +
                    "}catch(error){}" +
                    "return url;" +
                "};" +
                "URL.revokeObjectURL=function(url){" +
                    "originalRevokeObjectURL(url);" +
                    "setTimeout(function(){window.__oitavaCsvBlobMap.delete(url);},3000);" +
                "};" +
                "document.addEventListener('click',function(event){" +
                    "var target=event.target;" +
                    "var anchor=target&&target.closest?target.closest('a[download]'):null;" +
                    "if(!anchor||!anchor.href||anchor.href.indexOf('blob:')!==0)return;" +
                    "var filename=anchor.getAttribute('download')||'oitava-export.csv';" +
                    "if(!/\\.csv$/i.test(filename))return;" +
                    "event.preventDefault();" +
                    "event.stopPropagation();" +
                    "var blob=window.__oitavaCsvBlobMap.get(anchor.href);" +
                    "var sendBlob=function(csvBlob){" +
                        "var reader=new FileReader();" +
                        "reader.onloadend=function(){" +
                            "if(window.OitavaCsvBridge&&reader.result){window.OitavaCsvBridge.saveDataUrl(String(reader.result),filename);}" +
                        "};" +
                        "reader.readAsDataURL(csvBlob);" +
                    "};" +
                    "if(blob){sendBlob(blob);return;}" +
                    "fetch(anchor.href).then(function(response){return response.blob();}).then(sendBlob).catch(function(error){console.error('Falha ao exportar CSV no Android',error);});" +
                "},true);" +
            "})()",
            null
        ), delayMs);
    }

    private class CsvDownloadBridge {
        @JavascriptInterface
        public void saveDataUrl(String dataUrl, String requestedFilename) {
            try {
                String filename = sanitizeFilename(requestedFilename);
                int commaIndex = dataUrl.indexOf(',');
                if (commaIndex < 0) throw new IllegalArgumentException("Data URL inválida");

                String base64Payload = dataUrl.substring(commaIndex + 1);
                byte[] bytes = Base64.decode(base64Payload, Base64.DEFAULT);
                saveCsvBytes(bytes, filename);

                runOnUiThread(() -> Toast.makeText(
                    MainActivity.this,
                    "CSV salvo em Downloads: " + filename,
                    Toast.LENGTH_LONG
                ).show());
            } catch (Exception error) {
                runOnUiThread(() -> Toast.makeText(
                    MainActivity.this,
                    "Não foi possível salvar o CSV.",
                    Toast.LENGTH_LONG
                ).show());
            }
        }
    }

    private void saveCsvBytes(byte[] bytes, String filename) throws Exception {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
            values.put(MediaStore.Downloads.MIME_TYPE, "text/csv");
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            values.put(MediaStore.Downloads.IS_PENDING, 1);

            Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) throw new IllegalStateException("Não foi possível criar o arquivo");

            try (OutputStream output = getContentResolver().openOutputStream(uri)) {
                if (output == null) throw new IllegalStateException("Não foi possível abrir o arquivo");
                output.write(bytes);
                output.flush();
            }

            ContentValues completed = new ContentValues();
            completed.put(MediaStore.Downloads.IS_PENDING, 0);
            getContentResolver().update(uri, completed, null, null);
            return;
        }

        File downloadsDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (downloadsDir == null) throw new IllegalStateException("Pasta de downloads indisponível");
        if (!downloadsDir.exists() && !downloadsDir.mkdirs()) {
            throw new IllegalStateException("Não foi possível criar a pasta de downloads");
        }

        File target = new File(downloadsDir, filename);
        try (FileOutputStream output = new FileOutputStream(target)) {
            output.write(bytes);
            output.flush();
        }
    }

    private String sanitizeFilename(String requestedFilename) {
        String filename = requestedFilename == null ? "oitava-export.csv" : requestedFilename.trim();
        if (filename.isEmpty()) filename = "oitava-export.csv";
        filename = filename.replaceAll("[\\\\/:*?\"<>|]", "-");
        if (!filename.toLowerCase().endsWith(".csv")) filename += ".csv";
        return filename;
    }
}
