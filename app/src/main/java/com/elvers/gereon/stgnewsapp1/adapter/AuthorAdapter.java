package com.elvers.gereon.stgnewsapp1.adapter;

import android.content.Context;
import android.support.annotation.NonNull;
import android.text.Html;
import android.text.Spanned;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import com.elvers.gereon.stgnewsapp1.R;
import com.elvers.gereon.stgnewsapp1.api.Author;

import java.util.List;

public class AuthorAdapter extends ArrayAdapter<Author> {

    private static final String LOG_TAG = AuthorAdapter.class.getSimpleName();

    /**
     * Construct a new @{@link AuthorAdapter}
     * Requires
     * {@param context} because it interacts with the layout and
     * {@param authors} a list of Authors  as a data source
     */
    public AuthorAdapter(Context context, List<Author> authors) {
        super(context, 0, authors);
    }

    /**
     * Returns a list item view with the info of a single Author object
     */
    @Override
    @NonNull
    public View getView(int position, View convertView, @NonNull ViewGroup parent) {
        // Check if there is an old listItemView. If there is, it will be reused to conserve resources (generating Views is resource intensive!)
        View listItemView = convertView;
        if (listItemView == null) {
            listItemView = LayoutInflater.from(getContext()).inflate(R.layout.author_list_item, parent, false);
        }

        // Get current Author from the list
        Author currentAuthor = getItem(position);
        Log.i(LOG_TAG, "Reached getView for item " + position);

        /* The code below applies the info from the Author to the listItemView */
        if (currentAuthor != null) {

            TextView authorTV = listItemView.findViewById(R.id.author_name_tv);
            authorTV.setText(currentAuthor.getName());

            TextView descriptionTV = listItemView.findViewById(R.id.author_description_tv);
            String description = currentAuthor.getDescription();
            if (description.isEmpty())
                description = getContext().getResources().getString(R.string.no_description);
            Spanned spannedContent = Html.fromHtml(description);
            descriptionTV.setText(spannedContent);

        }
        // return the finished listItemView
        return listItemView;
    }

}
