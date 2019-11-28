package com.elvers.gereon.stgnewsapp1.tasks;

import android.content.Context;
import android.support.v4.content.AsyncTaskLoader;
import android.util.Log;

import java.io.IOException;

import static com.elvers.gereon.stgnewsapp1.utils.Utils.sendComment;

/**
 * Posts a comment
 * (As data should not be loaded or sent from of-device in the UI-Thread, an AsyncTask is used to push it onto a secondary thread)
 *
 * @author Gereon Elvers
 */
public class CommentPoster extends AsyncTaskLoader<Integer> {

    private static final String LOG_TAG = CommentPoster.class.getSimpleName();

    private String mArticleId;
    private String mAuthorEmail;
    private String mAuthorName;
    private String mContent;

    /**
     * Constructing a new CommentPoster
     *
     * @param context     is the context it is loaded to
     * @param articleId   is the ID of the article the comment will be posted to
     * @param authorName  is the name of the comment poster
     * @param authorEmail is the email of the comment poster
     * @param content     is the content of the comment
     *                    <p>
     *                    When troubleshooting the request URL, place Debugger here instead of the UriBuilder to easily get requestUrl
     * @author Gereon Elvers
     */
    public CommentPoster(Context context, String articleId, String authorName, String authorEmail, String content) {
        super(context);
        mArticleId = articleId;
        mAuthorName = authorName;
        mAuthorEmail = authorEmail;
        mContent = content;
    }

    /* force load when loading is requested */
    @Override
    public void onStartLoading() {
        forceLoad();
    }

    /* This is the actual load being done in the background thread */
    @Override
    public Integer loadInBackground() {
        // Since articleId is handled programmatically and not exposed to the end user, it does not need to be checked.
        if (mAuthorName.isEmpty() || mAuthorEmail.isEmpty() || mContent.isEmpty()) {
            return 0;
        }
        try {
            return sendComment(mArticleId, mAuthorName, mAuthorEmail, mContent);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Failed to post comment: " + e.toString());
            e.printStackTrace();
            return 0;
        }
    }
}
