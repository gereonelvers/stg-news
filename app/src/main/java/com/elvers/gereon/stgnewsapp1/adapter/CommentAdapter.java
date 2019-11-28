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
import com.elvers.gereon.stgnewsapp1.api.Comment;

import java.util.List;


public class CommentAdapter extends ArrayAdapter<Comment> {

    /**
     * Construct a new @{@link CommentAdapter}
     * Requires
     * {@param context} because it interacts with the layout and
     * {@param comments} a list of Comments  as a data source
     *
     * @author Gereon Elvers
     */
    public CommentAdapter(Context context, List<Comment> comments) {
        super(context, 0, comments);
    }

    // Tag for log messages
    private static final String LOG_TAG = CommentAdapter.class.getSimpleName();

    /**
     * Returns a list item view with the info of a single Comment object
     */
    @Override
    @NonNull
    public View getView(int position, View convertView, @NonNull ViewGroup parent) {
        // Check if there is an old listItemView. If there is, it will be reused to conserve resources (generating Views is resource intensive!)
        View listItemView = convertView;
        if (listItemView == null) {
            listItemView = LayoutInflater.from(getContext()).inflate(R.layout.comment_list_item, parent, false);
        }

        // Get current Comment from the list
        Comment currentComment = getItem(position);
        Log.i(LOG_TAG, "Reached getView for item " + position);

        /* The code below applies the info from the Comment to the listItemView */
        if (currentComment != null) {

            TextView authorTV = listItemView.findViewById(R.id.comment_author_name_tv);
            String author = currentComment.getAuthor();
            author += " " + getContext().getResources().getString(R.string.comment_author_add);
            authorTV.setText(author);

            TextView dateTV = listItemView.findViewById(R.id.comment_date_tv);
            String date = currentComment.getDate();
            dateTV.setText(date);

            TextView timeTV = listItemView.findViewById(R.id.comment_time_tv);
            String time = currentComment.getTime();
            timeTV.setText(time);

            TextView contentTV = listItemView.findViewById(R.id.comment_content_tv);
            String content = currentComment.getContent();
            Spanned spannedContent = Html.fromHtml(content);
            contentTV.setText(spannedContent);

        }
        // return the finished listItemView
        return listItemView;
    }

}
