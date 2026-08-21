package br.com.oitavabetim.music;

import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private static final String PREVIEW_HOST = "oitavamusic-betim-bla32c66w-raphaelsilva.vercel.app";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().setWebViewClient(new BridgeWebViewClient(bridge) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    String host = request.getUrl().getHost();
                    if (PREVIEW_HOST.equalsIgnoreCase(host)) {
                        return false;
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }
            });
        }
    }
}
