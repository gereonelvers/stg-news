package com.elvers.gereon.stgnewsapp1.tasks;

import android.content.Context;
import android.support.v4.content.AsyncTaskLoader;

import com.elvers.gereon.stgnewsapp1.api.Comment;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

import java.util.List;

/**
 * Loads a list of Comment objects using an AsyncTask to perform the network request to the given URL.
 * (As data should not be loaded from of-device in the UI-Thread, an AsyncTask is used to push it onto a secondary thread)
 *
 * @author Gereon Elvers
 */
public class CommentLoader extends AsyncTaskLoader<List<Comment>> {
    private String mUrl;

    /**
     * Constructing a new CommentLoader
     *
     * @param url     is the URL the data is loaded from
     * @param context is the context it is loaded to
     *                <p>
     *                When troubleshooting the request URL, place Debugger here instead of the UriBuilder to easily get requestUrl
     * @author Gereon Elvers
     */
    public CommentLoader(Context context, String url) {
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
