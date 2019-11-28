package com.elvers.gereon.stgnewsapp1.activities;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.app.AppCompatDelegate;
import android.support.v7.widget.Toolbar;
import android.text.Html;
import android.text.Spanned;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Toast;

import com.elvers.gereon.stgnewsapp1.R;
import com.elvers.gereon.stgnewsapp1.fragments.ArticleFragment;
import com.elvers.gereon.stgnewsapp1.fragments.CommentsFragment;
import com.elvers.gereon.stgnewsapp1.utils.ContextApp;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;

/**
 * Activity that manages displaying the selected Article
 *
 * @author Gereon Elvers
 */
public class ArticleActivity extends AppCompatActivity {

    // Tag for log messages
    private static final String LOG_TAG = ArticleActivity.class.getSimpleName();

    /* There are a lot of items declared outside of individual methods here.
    This is done because they are required to be available across methods and it's more economical to simply initialize them onCreate()*/
    public int articleID;
    public boolean isComments;
    public FragmentManager fragmentManager;
    public FloatingActionButton fab;
    public String articleURI;
    public Drawable ic_chat;
    public Drawable ic_plus;
    public String titleString;
    public SharedPreferences sharedPreferences;
    public boolean isFavorite;
    public String articleIdString;
    private List<String> favoritesList;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Utils.updateGlobalNightMode(this); // If the app is started directly into this activity, the theme should also be set correctly
        Utils.updateNightMode(this);

        super.onCreate(savedInstanceState);
        // Setting XML base layout
        setContentView(R.layout.activity_article);
        // Setting up Actionbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        ActionBar actionbar = getSupportActionBar();
        if (actionbar != null) {
            actionbar.setDisplayHomeAsUpEnabled(true);
        }
        Intent articleIntent = getIntent();

        /*
         * First attempt to get article data through regular methods.
         * If that fails, we can assume the activity was started through a deeplink and we have to make do with just the URL.
         * Both are executed in try blocks for easier debugging (and to make sure the app doesn't crash when both methods fail)
         */
        try {
            titleString = articleIntent.getStringExtra("ARTICLE_TITLE");
            articleID = articleIntent.getIntExtra("ARTICLE_ID", -1);
            articleURI = articleIntent.getStringExtra("ARTICLE_URI");
            final Spanned titleSpanned = Html.fromHtml(titleString);
            if (actionbar != null) {
                actionbar.setTitle(titleSpanned);
            }
        } catch (Exception e) {
            Log.e(LOG_TAG, "Failed to get article data through regular intent: " + e.toString());
            e.printStackTrace();
        }
        try {
            if (articleURI == null) {
                articleURI = articleIntent.getDataString();
                // The article URL is formatted in a way that puts the ID into the fifth segment.
                String articleIDString = articleIntent.getData().getPathSegments().get(5);
                // Since we can only get Strings from the intent, the segment is then parsed into an integer
                articleID = Integer.parseInt(articleIDString);
            }
        } catch (Exception e) {
            Log.e(LOG_TAG, "Failed to get article data through deeplink intent: " + e.toString());
            e.printStackTrace();
        }

        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        getFavorites();

        articleIdString = Integer.toString(articleID);
        checkFavorite(articleIdString, favoritesList);


        // FAB, drawables and FragmentManager are initialized here to save resources when switching between fragments later
        fab = findViewById(R.id.fab);
        ic_chat = getResources().getDrawable(R.drawable.ic_chat_dark);
        ic_plus = getResources().getDrawable(R.drawable.ic_plus_dark);
        fragmentManager = getSupportFragmentManager();

        // FAB should either show comments or open CreateCommentActivity, depending on which fragment is active
        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (!isComments) {
                    showComments();
                } else {
                    Intent createCommentIntent = new Intent(getApplicationContext(), CreateCommentActivity.class);
                    createCommentIntent.putExtra("ARTICLE_ID", articleID);
                    startActivity(createCommentIntent);
                }
            }
        });
        // if "#comments" is present in the URI, this means that the Article has been accessed though a deeplink meant to link directly to the comments or the activity has been restarted and the last instance showed the comments.
        // Therefore jump straight to CommentsFragment
        if (articleURI.contains("#comments") || (savedInstanceState != null && savedInstanceState.containsKey("isComments") && savedInstanceState.getBoolean("isComments"))) {
            showComments();
        } else {
            // If that isn't the case, start off by showing the article
            showArticle();
        }
    }

    @Override
    public boolean onPrepareOptionsMenu(Menu menu) {
        MenuItem favoriteMenuItem = menu.findItem(R.id.favorite_menu_item);
        checkFavorite(articleIdString, favoritesList);
        if (isFavorite) {
            favoriteMenuItem.setTitle(getString(R.string.favorites_remove_action));
            if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
                favoriteMenuItem.setIcon(R.drawable.ic_star_dark);
            } else {
                favoriteMenuItem.setIcon(R.drawable.ic_star_light);
            }
        } else {
            favoriteMenuItem.setTitle(getString(R.string.favorite_action));
            if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
                favoriteMenuItem.setIcon(R.drawable.ic_star_border_dark);
            } else {
                favoriteMenuItem.setIcon(R.drawable.ic_star_border_light);
            }
        }
        return super.onPrepareOptionsMenu(menu);
    }

    @Override
    protected void onRestart() {
        Utils.updateNightMode(this);
        super.onRestart();
        recreate();
    }

    /**
     * Setting OptionsMenu on ActionBar
     */
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.article_menu, menu);
        return true;
    }

    /**
     * This method sets associates actions with the menu options representing them
     */
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            // Back button
            case android.R.id.home:
                if (!isComments) {
                    super.onBackPressed();
                } else {
                    showArticle();
                }
                return true;
            // Share button
            case R.id.share:
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("text/plain");
                // subject text: share_subject
                shareIntent.putExtra(Intent.EXTRA_SUBJECT, getString(R.string.share_subject));
                // main text: share_text
                String shareUrlString;
                shareUrlString = articleURI;
                if (isComments) {
                    shareUrlString += "#comments";
                }
                shareIntent.putExtra(Intent.EXTRA_TEXT, getString(R.string.share_text) + shareUrlString);
                // launches share recipient chooser with share_title as title
                startActivity(Intent.createChooser(shareIntent, getString(R.string.share_title)));
                return true;
            case R.id.favorite_menu_item:
                getFavorites();
                checkFavorite(articleIdString, favoritesList);
                if (isFavorite) {
                    unfavorite(articleIdString, favoritesList);
                    if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
                        item.setIcon(R.drawable.ic_star_border_dark);
                    } else {
                        item.setIcon(R.drawable.ic_star_border_light);
                    }
                    item.setTitle(getString(R.string.favorite_action));
                    checkFavorite(articleIdString, favoritesList);
                    Toast.makeText(ContextApp.getContext(), getString(R.string.removed_from_favorites), Toast.LENGTH_SHORT).show();
                } else {
                    favorite(articleIdString, favoritesList);
                    if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
                        item.setIcon(R.drawable.ic_star_dark);
                    } else {
                        item.setIcon(R.drawable.ic_star_light);
                    }
                    item.setTitle(getString(R.string.favorites_remove_action));
                    checkFavorite(articleIdString, favoritesList);
                    Toast.makeText(ContextApp.getContext(), getString(R.string.added_to_favorites), Toast.LENGTH_SHORT).show();
                }
                return true;


            // Login in browser
            case R.id.login:
                Intent loginIntent = new Intent(Intent.ACTION_VIEW);
                loginIntent.setData(Uri.parse("https://stg-sz.net/login"));
                startActivity(loginIntent);
                return true;

            // Settings button
            case R.id.settings:
                Intent settingsIntent = new Intent(getApplicationContext(), SettingsActivity.class);
                startActivity(settingsIntent);
                return true;
            // About button
            case R.id.about:
                Intent aboutIntent = new Intent(getApplicationContext(), AboutActivity.class);
                startActivity(aboutIntent);
                return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onBackPressed() {
        if (isComments) {
            showArticle();
        } else {
            // redirect to webview
            Fragment fragment = getSupportFragmentManager().findFragmentById(R.id.article_frame);
            if (fragment instanceof ArticleFragment) {
                if (((ArticleFragment) fragment).webView.canGoBack()) { // kotlin smart cast would be nice here...
                    ((ArticleFragment) fragment).webView.goBack();
                    return;
                }
            }

            super.onBackPressed();
        }
    }

    // Show CommentFragment
    public void showComments() {
        // Create a FragmentTransaction with a custom animation and show a CommentFragment
        FragmentTransaction fragmentTransaction = fragmentManager.beginTransaction();
        CommentsFragment commentFragment = CommentsFragment.newInstance(articleID);
        fragmentTransaction.setCustomAnimations(R.anim.slide_in_right, R.anim.slide_out_left);
        fragmentTransaction.replace(R.id.article_frame, commentFragment);
        fragmentTransaction.commit();
        fab.setImageDrawable(ic_plus);
        isComments = true;
    }

    // Show ArticleFragment
    public void showArticle() {
        // Create a FragmentTransaction with a custom animation and show a CommentFragment
        FragmentTransaction fragmentTransaction = fragmentManager.beginTransaction();
        ArticleFragment articleFragment = ArticleFragment.newInstance(articleURI);
        fragmentTransaction.setCustomAnimations(R.anim.slide_in_left, R.anim.slide_out_right);
        fragmentTransaction.replace(R.id.article_frame, articleFragment);
        fragmentTransaction.commit();
        fab.setImageDrawable(ic_chat);
        isComments = false;
    }

    /**
     * Remove list item from favorites
     */
    private void unfavorite(String articleID, List<String> favoritesList) {
        // Remove all instances of article-ID from List
        for (int i = 0; i < favoritesList.size(); i++) {
            String currentFavorite = favoritesList.get(i);
            if (currentFavorite.equals(articleID)) {
                //noinspection SuspiciousListRemoveInLoop
                favoritesList.remove(i);
            }
        }
        // SharedPreferences can't store a ArrayList, so the list is converted into a String
        StringBuilder favoritesStringBuilder = new StringBuilder();
        for (String s : favoritesList) {
            favoritesStringBuilder.append(s);
            // Individual items are separated by commas
            favoritesStringBuilder.append(",");
        }
        String favoriteString = favoritesStringBuilder.toString();
        // Regex to remove front-loaded commas
        favoriteString = favoriteString.replaceAll(Matcher.quoteReplacement("^,+"), "");
        sharedPreferences.edit().putString("favorites", favoriteString).apply();
        isFavorite = false;

    }

    /**
     * Add the list item to favorites
     */
    private void favorite(String articleID, List<String> favoritesList) {
        // Add item to List of article-IDs
        favoritesList.add(articleID);
        // SharedPreferences can't store a ArrayList, so the list is converted into a String
        StringBuilder favoritesStringBuilder = new StringBuilder();
        for (String s : favoritesList) {
            favoritesStringBuilder.append(s);
            // Individual items are separated by commas
            favoritesStringBuilder.append(",");
        }
        String favoriteString = favoritesStringBuilder.toString();
        // Regex to remove front-loaded commas
        favoriteString = favoriteString.replaceAll(Matcher.quoteReplacement("^,+"), "");
        sharedPreferences.edit().putString("favorites", favoriteString).apply();
        isFavorite = true;

    }

    /**
     * Get favorites from SharedPreferences as String, then convert it to an ArrayList
     */
    private void getFavorites() {
        String favorites = sharedPreferences.getString("favorites", "");
        assert favorites != null;
        String[] favoritesStringArray = favorites.split(",");
        favoritesList = new ArrayList<>();
        Collections.addAll(favoritesList, favoritesStringArray);
    }

    /**
     * Check if article is listed as a favorite
     */
    private void checkFavorite(String articleID, List<String> favoritesList) {
        boolean hasChanged = false;
        for (int i = 0; i < favoritesList.size(); i++) {
            if (favoritesList.get(i).contains(articleID)) {
                isFavorite = true;
                hasChanged = true;
            }
        }
        if (!hasChanged) {
            isFavorite = false;
        }
    }

    /**
     * Save data which will be given to new instance/recreated instance of this activity; this is needed to remember to show comments after visiting the settings
     *
     * @param outState will contain all information to pass to new instance
     */
    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putBoolean("isComments", isComments);
    }
}