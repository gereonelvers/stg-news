package com.elvers.gereon.stgnewsapp1.utils;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.appcompat.app.AppCompatDelegate;
import android.util.Log;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import com.elvers.gereon.stgnewsapp1.R;
import com.elvers.gereon.stgnewsapp1.activities.SearchActivity;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;

/**
 * Custom WebViewClient for loading article from URL
 *
 * @author Gereon Elvers
 */
public class ArticleWebViewClient extends WebViewClient {

    private static final String LOG_TAG = ArticleWebViewClient.class.getSimpleName();

    // Dark theme should be loaded once, so loading the activity is faster
    private static String darkThemeJs = "";
    private Activity ownerActivity;

    public ArticleWebViewClient(Activity ownerActivity) {
        this.ownerActivity = ownerActivity;

        if (darkThemeJs.isEmpty()) {
            try {
                Log.i(LOG_TAG, "Loading dark theme JavaScript file. This should only happen once");
                InputStream in = ownerActivity.getAssets().open("dark_theme.js");
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                byte[] buffer = new byte[in.available()];
                int size;
                while ((size = in.read(buffer)) != -1) {
                    bos.write(buffer, 0, size);
                }
                bos.close();
                in.close();
                darkThemeJs = "(function(){ " + new String(bos.toByteArray()) + " })();";
            } catch (IOException e) {
                Log.e(LOG_TAG, "Failed to load dark theme js script: " + e.toString());
                e.printStackTrace();
            }
        }
    }

    @Override
    public void onPageCommitVisible(WebView view, String url) {
        super.onPageCommitVisible(view, url);
        // Overwrite some of the websites CSS, so the website becomes dark in dark mode. This is a rather hacky method and might lead to ugly color combinations
        if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES && !darkThemeJs.isEmpty()) {
            view.loadUrl("javascript:" + darkThemeJs);
        }
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String urlStr) {
        // If the URL starts with mailto:, it needs to be handled as a mail-intent
        if (urlStr.startsWith("mailto:")) {
            Intent emailIntent = new Intent(Intent.ACTION_SENDTO);
            try {
                emailIntent.setData(Uri.parse(urlStr));
            } catch (Exception e) {
                Log.e(LOG_TAG, "Failed to parse mailto link", e);
                return true;
            }
            ownerActivity.startActivity(Intent.createChooser(emailIntent, ""));
            return true;
        }

        URL url;
        try {
            url = new URL(urlStr);
        } catch (MalformedURLException e) {
            Log.e(LOG_TAG, "Failed to parse invalid URL", e);
            return true;
        }

        // If the URL contains stg-sz.net it will be loaded inside the current WebView
        if (urlStr.contains("stg-sz.net")) {
            String[] parts = url.getPath().split("/");
            if (parts.length >= 2) {
                if (parts.length > 2 && parts[2].equalsIgnoreCase("author")) { // filter by author
                    int authorId = Utils.authorResponse.getAuthorBySlug(url.getPath().split("/")[3]).getId();
                    Intent intent = new Intent();
                    intent.setAction(SearchActivity.ACTION_FILTER_AUTHOR);
                    intent.putExtra(SearchActivity.EXTRA_AUTHOR_ID, authorId);
                    ownerActivity.startActivity(intent);
                } else if (!parts[2].matches("[2-9][0-9]{3}")) { // i don't think the app will last until year 10000
                    if (!urlStr.contains("?inapp") && !urlStr.contains("&inapp")) {
                        if (urlStr.contains("?")) {
                            view.loadUrl(urlStr + "&inapp");
                        } else {
                            view.loadUrl(urlStr + "?inapp");
                        }
                    } else {
                        view.loadUrl(urlStr);
                    }
                }
                return true;
            } else {
                Toast.makeText(ownerActivity, R.string.error_invalid_url, Toast.LENGTH_LONG).show();
                return false;
            }
        }

        // Otherwise it will be handled in a regular browser instance
        try {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(urlStr));
            ownerActivity.startActivity(browserIntent);
        } catch (Exception e) {
            Log.e(LOG_TAG, "Failed to open link inside browser", e);
        }
        return true;
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        // Adds some padding below content so FAB doesn't interfere
        view.loadUrl("javascript:(function(){ document.body.style.paddingBottom = '56px'})();");
    }

}