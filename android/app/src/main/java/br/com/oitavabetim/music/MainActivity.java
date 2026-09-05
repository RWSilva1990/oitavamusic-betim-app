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
            webView.addJavascriptInterface(new OitavaNativeBridge(), "OitavaNative");
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

    private boolean isAllowedYouTubeUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.trim().isEmpty()) return false;
        Uri uri = Uri.parse(rawUrl.trim());
        String scheme = uri.getScheme();
        String host = uri.getHost();
        if (scheme == null || host == null || !(scheme.equals("https") || scheme.equals("http"))) return false;

        String normalizedHost = host.toLowerCase();
        return normalizedHost.equals("youtu.be")
            || normalizedHost.equals("youtube.com")
            || normalizedHost.equals("www.youtube.com")
            || normalizedHost.equals("m.youtube.com");
    }

    private void dispatchTransposeResult(boolean ok, String reason) {
        WebView webView = bridge != null ? bridge.getWebView() : null;
        if (webView == null) return;
        String script = "window.dispatchEvent(new CustomEvent('oitava:transpose-open-result',{detail:{ok:"
            + (ok ? "true" : "false") + ",reason:'" + reason + "'}}));";
        runOnUiThread(() -> webView.evaluateJavascript(script, null));
    }

    public class OitavaNativeBridge {
        @JavascriptInterface
        public void openInTranspose(String youtubeUrl) {
            if (!isAllowedYouTubeUrl(youtubeUrl)) {
                dispatchTransposeResult(false, "invalid-url");
                return;
            }

            runOnUiThread(() -> {
                try {
                    Intent sendIntent = new Intent(Intent.ACTION_SEND);
                    sendIntent.setType("text/plain");
                    sendIntent.putExtra(Intent.EXTRA_TEXT, youtubeUrl.trim());
                    sendIntent.setPackage(TRANSPOSE_PACKAGE);
                    startActivity(sendIntent);
                    dispatchTransposeResult(true, "opened");
                } catch (ActivityNotFoundException sendError) {
                    try {
                        Intent viewIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(youtubeUrl.trim()));
                        viewIntent.setPackage(TRANSPOSE_PACKAGE);
                        startActivity(viewIntent);
                        dispatchTransposeResult(true, "opened");
                    } catch (ActivityNotFoundException viewError) {
                        dispatchTransposeResult(false, "not-installed");
                    }
                }
            });
        }
    }
}
