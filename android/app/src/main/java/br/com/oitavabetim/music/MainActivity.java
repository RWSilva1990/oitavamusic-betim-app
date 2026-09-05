package br.com.oitavabetim.music;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TRANSPOSE_PACKAGE = "com.example.transpose";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = bridge != null ? bridge.getWebView() : null;
        if (webView != null) {
            webView.addJavascriptInterface(new NativeToolsBridge(), "OitavaNativeTools");
        }

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = bridge != null ? bridge.getWebView() : null;
                if (webView == null) {
                    exitThroughSystemBack();
                    return;
                }

                webView.evaluateJavascript(
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

    private boolean isYoutubeUrl(String rawUrl) {
        try {
            Uri uri = Uri.parse(rawUrl);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (scheme == null || host == null) return false;
            if (!"https".equalsIgnoreCase(scheme) && !"http".equalsIgnoreCase(scheme)) return false;

            String normalizedHost = host.toLowerCase();
            return "youtu.be".equals(normalizedHost)
                || "youtube.com".equals(normalizedHost)
                || "www.youtube.com".equals(normalizedHost)
                || "m.youtube.com".equals(normalizedHost);
        } catch (Exception ignored) {
            return false;
        }
    }

    private class NativeToolsBridge {
        @JavascriptInterface
        public String openTranspose(String rawUrl) {
            String url = rawUrl == null ? "" : rawUrl.trim();
            if (!isYoutubeUrl(url)) return "invalid-url";

            Intent intent = new Intent(Intent.ACTION_SEND);
            intent.setType("text/plain");
            intent.putExtra(Intent.EXTRA_TEXT, url);
            intent.setPackage(TRANSPOSE_PACKAGE);

            try {
                startActivity(intent);
                return "ok";
            } catch (ActivityNotFoundException error) {
                return "not-installed";
            } catch (Exception error) {
                return "error";
            }
        }
    }
}
