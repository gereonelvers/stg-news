package com.elvers.gereon.stgnewsapp1;

import android.content.Context;
import android.content.Intent;
import android.content.res.AssetManager;
import android.graphics.Bitmap;
import android.net.MailTo;
import android.net.Uri;
import android.support.v7.app.AppCompatDelegate;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * Custom WebViewClient for loading article from URL
 *
 * @author Gereon Elvers
 */
public class ArticleWebViewClient extends WebViewClient {

    private String darkThemeJs = "";

    ArticleWebViewClient(AssetManager assetManager) {
        try {
            InputStream in = assetManager.open("dark_theme.js");
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
            e.printStackTrace();
        }
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        super.onPageStarted(view, url, favicon);
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        // Get context for intents
        Context context = ContextApp.getContext();
        // If the URL starts with mailto:, it needs to be handled as a mail-intent
        if (url.startsWith("mailto:")) {
            MailTo mt = MailTo.parse(url);
            Intent emailIntent = createEmailIntent(mt.getTo(), mt.getSubject(), mt.getBody(), mt.getCc());
            context.startActivity(emailIntent);
            view.reload();
            return true;
        }
        // If the URL contains stg-sz.net it will be loaded inside the WebView
        else if (url.contains("stg-sz.net")) {
            if (!url.contains("inapp")) {
                url += "?inapp";
            }
            view.loadUrl(url);
        }
        // Otherwise it will be handled in a regular browser instance
        else {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
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

        // Overwrite some of the website CSS, so the website becomes dark in dark mode. This is a rather hacky method and can lead to ugly text colors
        if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES && !darkThemeJs.isEmpty()) {
            view.loadUrl("javascript:" + darkThemeJs);
        }
    }

}