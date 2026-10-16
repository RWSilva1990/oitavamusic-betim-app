package br.com.oitavabetim.music;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String RUNTIME_PREFS = "oitava_runtime";
    private static final String WEB_BUNDLE_VERSION_KEY = "web_bundle_version";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(PitchHandoffPlugin.class);
        super.onCreate(savedInstanceState);

        refreshPackagedWebBundleOnUpgrade();

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

    private void refreshPackagedWebBundleOnUpgrade() {
        WebView webView = bridge != null ? bridge.getWebView() : null;
        if (webView == null) return;

        SharedPreferences prefs = getSharedPreferences(RUNTIME_PREFS, MODE_PRIVATE);
        int currentVersionCode = BuildConfig.VERSION_CODE;
        int loadedVersionCode = prefs.getInt(WEB_BUNDLE_VERSION_KEY, -1);

        if (loadedVersionCode == currentVersionCode) return;

        webView.post(() -> {
            // Capacitor serves packaged assets through the local WebView. Android may keep
            // the previous HTTP cache across APK updates, so force the first load of each
            // version to use the web bundle shipped inside that APK.
            webView.clearCache(true);
            webView.getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
            webView.reload();

            webView.postDelayed(
                () -> webView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT),
                2500
            );

            prefs.edit().putInt(WEB_BUNDLE_VERSION_KEY, currentVersionCode).apply();
        });
    }
}
