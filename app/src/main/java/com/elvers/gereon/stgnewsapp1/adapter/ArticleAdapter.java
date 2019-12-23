package com.elvers.gereon.stgnewsapp1.adapter;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.drawable.Drawable;
import android.preference.PreferenceManager;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatDelegate;
import android.text.Html;
import android.text.Spanned;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.DataSource;
import com.bumptech.glide.load.engine.GlideException;
import com.bumptech.glide.request.RequestListener;
import com.bumptech.glide.request.target.Target;
import com.daimajia.swipe.SwipeLayout;
import com.elvers.gereon.stgnewsapp1.R;
import com.elvers.gereon.stgnewsapp1.api.Article;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;

/**
 * Custom Adapter that adapts a List of Articles onto a given ListView
 * each Article item is projected onto an listItemView (layout is defined by article_list_item.xml)
 *
 * @author Gereon Elvers
 */
public class ArticleAdapter extends ArrayAdapter<Article> {


    private SharedPreferences sharedPreferences;
    private boolean isFavorite;
    private List<String> favoritesList;

    /**
     * Construct a new @{@link ArticleAdapter}
     * Requires
     * {@param context} because it interacts with the layout and
     * {@param articles} a list of Articles  as a data source
     */
    public ArticleAdapter(Context context, List<Article> articles) {
        super(context, 0, articles);
    }

    /**
     * Returns a list item view with the info of a single Article object
     */
    @Override
    @NonNull
    public View getView(int position, View convertView, @NonNull ViewGroup parent) {
        // Check if there is an old listItemView. If there is, it will be reused to conserve resources (generating Views is resource intensive!)
        SwipeLayout listItemView = (SwipeLayout) convertView;
        if (listItemView == null) {
            listItemView = (SwipeLayout) LayoutInflater.from(getContext()).inflate(R.layout.article_list_item, parent, false);
        }

        // Set swipe-animation
        listItemView.setShowMode(SwipeLayout.ShowMode.PullOut);


        // Get current Article from the list
        final Article currentArticle = getItem(position);


        /* The code below applies the info from the Article to the listItemView */
        if (currentArticle != null) {

            final ProgressBar imageProgressBar = listItemView.findViewById(R.id.img_load_indicator);

            ImageView coverIV = listItemView.findViewById(R.id.article_item_cover_iv);
            String coverImageString = currentArticle.getCoverImage();
            if (!coverImageString.isEmpty()) {
                // Load image with Glide
                Glide.with(super.getContext())
                        .load(coverImageString)
                        .centerCrop()
                        .thumbnail(0.25f)
                        .listener(new RequestListener<Drawable>() {
                            @Override
                            public boolean onLoadFailed(@Nullable GlideException e, Object model, Target<Drawable> target, boolean isFirstResource) {
                                // Remove load indicator if load fails
                                imageProgressBar.setVisibility(View.GONE);
                                return false;
                            }

                            @Override
                            public boolean onResourceReady(Drawable resource, Object model, Target<Drawable> target, DataSource dataSource, boolean isFirstResource) {
                                // Turn loading indicator into layout separator to indicate load success
                                imageProgressBar.setIndeterminate(false);
                                imageProgressBar.setProgress(100);
                                return false;
                            }
                        })
                        .into(coverIV);
            } else {
                coverIV.setVisibility(View.GONE);
                coverIV.setAdjustViewBounds(true);
            }

            // Display article title
            TextView titleTV = listItemView.findViewById(R.id.article_item_title_tv);
            String title = currentArticle.getTitleHtmlEscaped();
            Spanned spannedTitle = Html.fromHtml(title);
            titleTV.setText(spannedTitle);

            // Display author name
            TextView authorTV = listItemView.findViewById(R.id.article_item_author_name_tv);
            String authorName = currentArticle.getAuthor();
            String displayAuthor = "";
            if (!authorName.isEmpty()) {
                displayAuthor = getContext().getString(R.string.author_display_add) + authorName;
            }
            authorTV.setText(displayAuthor);

            // Display publication date
            TextView dateTV = listItemView.findViewById(R.id.article_item_date_tv);
            String dateString = currentArticle.getDate();
            dateTV.setText(dateString);

            // Display assigned categories
            TextView categoryTV = listItemView.findViewById(R.id.article_item_category_tv);
            String categoryString = currentArticle.getCategory();
            categoryTV.setText(categoryString);

            // Set up share functionality
            ImageView swipe_share_iv = listItemView.findViewById(R.id.swipe_share_iv);
            swipe_share_iv.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Intent shareIntent = new Intent(Intent.ACTION_SEND);
                    shareIntent.setType("text/plain");
                    shareIntent.putExtra(Intent.EXTRA_SUBJECT, getContext().getString(R.string.share_subject));
                    shareIntent.putExtra(Intent.EXTRA_TEXT, getContext().getString(R.string.share_text) + currentArticle.getUrl());
                    // launches share recipient chooser with share_title as title
                    getContext().startActivity(Intent.createChooser(shareIntent, getContext().getString(R.string.share_title)));

                }
            });

            // Initialize drawables to save resources for repeated uses
            final Drawable star;
            if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
                star = getContext().getResources().getDrawable(R.drawable.ic_star_dark);
            } else {
                star = getContext().getResources().getDrawable(R.drawable.ic_star_light);
            }
            final Drawable unstar;
            if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
                unstar = getContext().getResources().getDrawable(R.drawable.ic_star_border_dark);
            } else {
                unstar = getContext().getResources().getDrawable(R.drawable.ic_star_border_light);
            }
            final ImageView swipe_star_iv = listItemView.findViewById(R.id.swipe_star_iv);

            // Initializing SharedPreferences
            sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getContext());

            getFavorites();
            String articleID = String.valueOf(currentArticle.getId());

            // Set initial favorite-drawable
            checkFavorite(articleID, favoritesList);
            if (isFavorite) {
                swipe_star_iv.setImageDrawable(star);
            } else {
                swipe_star_iv.setImageDrawable(unstar);
            }
            swipe_star_iv.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    String articleID = String.valueOf(currentArticle.getId());
                    getFavorites();
                    checkFavorite(articleID, favoritesList);
                    if (isFavorite) {
                        unfavorite(articleID, favoritesList);
                        swipe_star_iv.setImageDrawable(unstar);
                        checkFavorite(articleID, favoritesList);
                        Toast.makeText(getContext(), getContext().getResources().getString(R.string.removed_from_favorites) + ": \"" + currentArticle.getTitle() + "\"", Toast.LENGTH_SHORT).show();
                    } else {
                        favorite(articleID, favoritesList);
                        swipe_star_iv.setImageDrawable(star);
                        checkFavorite(articleID, favoritesList);
                        Toast.makeText(getContext(), getContext().getResources().getString(R.string.added_to_favorites) + ": \"" + currentArticle.getTitle() + "\"", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }
        // return the finished listItemView
        return listItemView;
    }

    /**
     * Get favorites from SharedPreferences as String, then convert it to an Arraylist
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


}