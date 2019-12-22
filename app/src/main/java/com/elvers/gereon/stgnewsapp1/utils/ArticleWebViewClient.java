package com.elvers.gereon.stgnewsapp1.utils;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.MailTo;
import android.net.Uri;
import android.support.v7.app.AppCompatDelegate;
import android.util.Log;
import android.webkit.WebView;
import android.webkit.WebViewClient;

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
        URL url;
        try {
            url = new URL(urlStr);
        } catch (MalformedURLException e) {
            Log.e(LOG_TAG, "Tried to parse invalid URL: " + e.toString());
            e.printStackTrace();
            return false;
        }

        // Get context for intents
        Context context = ContextApp.getContext();
        // If the URL starts with mailto:, it needs to be handled as a mail-intent
        if (urlStr.startsWith("mailto:")) {
            MailTo mt = MailTo.parse(urlStr);
            Intent emailIntent = createEmailIntent(mt.getTo(), mt.getSubject(), mt.getBody(), mt.getCc());
            context.startActivity(emailIntent);
            view.reload();
        }
        // If the URL contains stg-sz.net it will be loaded inside the WebView
        else if (urlStr.contains("stg-sz.net")) {
            String[] parts = url.getPath().split("/");
            if (parts[2].equalsIgnoreCase("author")) { // filter by author
                int authorId = Utils.authorResponse.getAuthorBySlug(url.getPath().split("/")[3]).getId();
                Intent intent = new Intent();
                intent.setAction(SearchActivity.ACTION_FILTER_AUTHOR);
                intent.putExtra(SearchActivity.EXTRA_AUTHOR_ID, authorId);
                ownerActivity.startActivity(intent);
            } else if (!parts[2].matches("[2-9][0-9]{3}")) { // i don't think the app will last until year 10000
                if (!urlStr.contains("inapp")) {
                    view.loadUrl(urlStr + "?inapp");
                } else {
                    return false;
                }
            }
        }
        // Otherwise it will be handled in a regular browser instance
        else {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(urlStr));
            browserIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(browserIntent);
        }
        return true;
    }

    // Create the actual email intent based on info from the mailto address
    private Intent createEmailIntent(String address, String subject, String body, String cc) {
        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.putExtra(Intent.EXTRA_EMAIL, new String[]{address});
        intent.putExtra(Intent.EXTRA_TEXT, body);
        intent.putExtra(Intent.EXTRA_SUBJECT, subject);
        intent.putExtra(Intent.EXTRA_CC, cc);
        intent.setType("message/rfc822");
        return intent;
    }

    @Override
    public void onPageFinished(WebView view, String url) {
        // Adds some padding below content so FAB doesn't interfere
        view.loadUrl("javascript:(function(){ document.body.style.paddingBottom = '56px'})();");
    }

}