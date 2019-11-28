package com.elvers.gereon.stgnewsapp1.fragments;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.elvers.gereon.stgnewsapp1.R;
import com.elvers.gereon.stgnewsapp1.utils.ArticleWebViewClient;

/**
 * Fragment that manages loading and displaying the requested article
 *
 * @author Gereon Elvers
 */
public class ArticleFragment extends Fragment {

    public View loadingIndicator;
    public WebView webView;
    private String articleURI;

    // Required empty public constructor
    public ArticleFragment() {
    }

    public static ArticleFragment newInstance(String articleURI) {
        Bundle bundle = new Bundle();
        bundle.putString("ARTICLE_URI", articleURI);
        ArticleFragment articleFragment = new ArticleFragment();
        articleFragment.setArguments(bundle);
        return articleFragment;
    }

    // Try to retrieve Article URI from Bundle
    private void readBundle(Bundle bundle) {
        if (bundle != null) {
            articleURI = bundle.getString("ARTICLE_URI");
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }


    /**
     * Since this is a fragment, construction is done onCreateView() since calls to the layout need to be made though "view.", which is only available here
     */
    @SuppressLint("SetJavaScriptEnabled")
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view = inflater.inflate(R.layout.fragment_article, container, false);
        readBundle(getArguments());
        webView = view.findViewById(R.id.article_content_wv);
        loadingIndicator = view.findViewById(R.id.article_loading_circle);
        // Add "inapp"-URL parameter to notify site that it is being requested from within the App
        articleURI += "?inapp";
        /*
         * JavaScript is necessary for some dynamic components that might be implemented in the future,
         * creates parity between the custom WebView and regular browser and, more importantly, makes sure the "?inapp"-parameter works as expected
         * But the most important reason to enable JavaScript is the hacky dark theme ^^
         */
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setAppCacheEnabled(false);

        webView.setWebViewClient(new ArticleWebViewClient(getActivity().getAssets()));
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

        return view;
    }

    @Override
    public void onResume() {
        super.onResume();
        // Actually start loading URL
        webView.loadUrl(articleURI);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        webView.clearCache(true);
    }

}
