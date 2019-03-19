package com.elvers.gereon.stgnewsapp1;

import android.content.Context;
import android.support.annotation.NonNull;
import android.text.Html;
import android.text.Spanned;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;
import com.bumptech.glide.Glide;
import java.util.List;


/**
 * Custom Adapter that adapts a List of Articles onto a given ListView
 * each Article item is projected onto an listItemView (layout is defined by article_list_item.xml)
 *
 * @author Gereon Elvers
 */
public class ArticleAdapter extends ArrayAdapter<Article> {


    /**
     * Construct a new @{@link ArticleAdapter}
     * Requires
     * {@param context} because it interacts with the layout and
     * {@param articles} a list of Articles  as a data source
     */
    ArticleAdapter(Context context, List<Article> articles) {
        super(context, 0, articles);
    }

    /**
     * Returns a list item view with the info of a single Article object
     */
    @Override
    @NonNull
    public View getView(int position, View convertView, @NonNull ViewGroup parent) {
        // Check if there is an old listItemView. If there is, it will be reused to conserve resources (generating Views is resource intensive!)
        View listItemView = convertView;
        if (listItemView == null) {
            listItemView = LayoutInflater.from(getContext()).inflate(R.layout.article_list_item, parent, false);
        }

        // Get current Article from the list
        Article currentArticle = getItem(position);


        /* The code below applies the info from the Article to the listItemView */
        if (currentArticle != null) {

            ImageView coverIV = listItemView.findViewById(R.id.article_item_cover_iv);
            String coverImageString = currentArticle.getCoverImage();
            if (!coverImageString.isEmpty()){
            Glide.with(super.getContext()).load(coverImageString).centerCrop().into(coverIV);
            } else {
                coverIV.setVisibility(View.GONE);
                coverIV.setAdjustViewBounds(true);
            }

            TextView titleTV = listItemView.findViewById(R.id.article_item_title_tv);
            String title = currentArticle.getTitle();
            Spanned spannedTitle = Html.fromHtml(title);
            titleTV.setText(spannedTitle);

            TextView authorTV = listItemView.findViewById(R.id.article_item_author_name_tv);
            String authorName = currentArticle.getAuthor();
            String displayAuthor = "";
            if (!authorName.isEmpty()) {
                displayAuthor = getContext().getString(R.string.author_display_add) + authorName;
            }
            authorTV.setText(displayAuthor);

            TextView dateTV = listItemView.findViewById(R.id.article_item_date_tv);
            String dateString = currentArticle.getDate();
            dateTV.setText(dateString);

            TextView categoryTV = listItemView.findViewById(R.id.article_item_category_tv);
            String categoryString = currentArticle.getCategory();
            categoryTV.setText(categoryString);

        }
        // return the finished listItemView
        return listItemView;
    }

}