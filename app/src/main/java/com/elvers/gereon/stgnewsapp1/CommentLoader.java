package com.elvers.gereon.stgnewsapp1;

import android.content.Context;
import android.support.v4.content.AsyncTaskLoader;

import com.elvers.gereon.stgnewsapp1.api.Comment;

import java.util.List;

public class CommentLoader extends AsyncTaskLoader<List<Comment>> {
    private String mUrl;

    /**
     * Constructing a new CommentLoader
     *
     * @param url     is the URL the data is loaded from
     * @param context is the context it is loaded to
     *
     * When troubleshooting the request URL, place Debugger here instead of the UriBuilder to easily get requestUrl
     *
     * @author Gereon Elvers
     */
    CommentLoader(Context context, String url) {
        super(context);
        mUrl = url;
    }

    /* force load when loading is requested */
    @Override
    public void onStartLoading() {
        forceLoad();
    }

    /* This is the actual load being done in the background thread */
    @Override
    public List<Comment> loadInBackground() {
        if (mUrl == null) {
            return null;
        }
        return Utils.fetchComments(mUrl);
    }
}
