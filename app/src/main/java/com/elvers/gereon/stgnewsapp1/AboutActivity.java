package com.elvers.gereon.stgnewsapp1;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebView;


/**
 * Activity that shows "About" information like sources and feedback links
 *
 * Points a WebView to a static WordPress-Post that contains this info.
 * This makes edit easier in the future, because it increases parity between website and App (no need to maintain content twice)
 *
 * @author Gereon Elvers
 */
public class AboutActivity extends AppCompatActivity {

    static final String ABOUT_URL = "https://stg-sz.net/ueber-uns/?inapp";
    WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Utils.updateNightMode(this);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_about);

        // Set up ActionBar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        ActionBar actionbar = getSupportActionBar();
        if (actionbar != null) {
            actionbar.setDisplayHomeAsUpEnabled(true);
            actionbar.setTitle(R.string.about_string);
        }

        webView = findViewById(R.id.about_content_wv);
        final View loadingIndicator = findViewById(R.id.about_loading_circle);

        /*
         * Javascript is necessary for some dynamic components that might be implemented in the future,
         * creates parity between the custom WebView and regular browser and, more importantly, makes sure the "?inapp"-parameter works as expected
         */
        webView.getSettings().setJavaScriptEnabled(true);
        webView.setWebViewClient(new ArticleWebViewClient());
        webView.setVisibility(View.INVISIBLE);
        // Setting up loading indicator (spinning circle)
        webView.setWebChromeClient(new WebChromeClient() {
            public void onProgressChanged(WebView webView, int progress) {
                if (progress == 100) {
                    // Hide loading indicator and show WebView once loading is finished
                    loadingIndicator.setVisibility(View.INVISIBLE);
                    webView.setVisibility(View.VISIBLE);
                }
            }
        });
    }

    @Override
    public void onResume(){
        super.onResume();
        // Start loading URL
        webView.loadUrl(ABOUT_URL);
    }


}
