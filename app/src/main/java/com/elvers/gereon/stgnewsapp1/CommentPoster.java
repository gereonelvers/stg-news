package com.elvers.gereon.stgnewsapp1;

import android.content.Context;
import android.support.v4.content.AsyncTaskLoader;

import java.io.IOException;

import static com.elvers.gereon.stgnewsapp1.Utils.sendComment;

public class CommentPoster extends AsyncTaskLoader<Integer> {

    private String mArticleId;
    private String mAuthorEmail;
    private String mAuthorName;
    private String mContent;

    /**
     * Constructing a new CommentPoster
     *
     * @param context is the context it is loaded to
     * @param articleId is the ID of the article the comment will be posted to
     * @param authorName is the name of the comment poster
     * @param authorEmail is the email of the comment poster
     * @param content is the content of the comment
     *
     * When troubleshooting the request URL, place Debugger here instead of the UriBuilder to easily get requestUrl
     *
     * @author Gereon Elvers
     */
    CommentPoster(Context context, String articleId, String authorName, String authorEmail, String content) {
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
            e.printStackTrace();
            return 0;
        }
    }
}
