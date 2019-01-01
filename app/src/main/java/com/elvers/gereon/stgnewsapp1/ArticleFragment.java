package com.elvers.gereon.stgnewsapp1;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebView;


/**
 * Fragment that manages loading and displaying the requested article
 *
 * @author Gereon Elvers
 */
public class ArticleFragment extends Fragment {

    View loadingIndicator;
    WebView webView;
    private String articleURI;

    // Required empty public constructor
    public ArticleFragment() {}

    public static ArticleFragment newInstance(String articleURI) {
        Bundle bundle = new Bundle();
        bundle.putString("ARTICLE_URI", articleURI);
        ArticleFragment articleFragment = new ArticleFragment();
        articleFragment.setArguments(bundle);
        return articleFragment;
    }

    private void readBundle(Bundle bundle) {
        if (bundle != null) {
            articleURI = bundle.getString("ARTICLE_URI");
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view = inflater.inflate(R.layout.fragment_article, container, false);
        readBundle(getArguments());
        webView = view.findViewById(R.id.article_content_wv);
        loadingIndicator = view.findViewById(R.id.article_loading_circle);
        // Add inapp URL parameter to notify site that it is being requested from within the App
        articleURI += "?inapp";
        /* Javascript is necessary for some dynamic components that might be implemented in the future,
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
        // Start loading URL
        webView.loadUrl(articleURI);

        return view;
    }

}
