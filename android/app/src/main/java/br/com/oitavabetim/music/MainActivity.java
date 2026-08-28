package br.com.oitavabetim.music;

import android.os.Bundle;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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
}
