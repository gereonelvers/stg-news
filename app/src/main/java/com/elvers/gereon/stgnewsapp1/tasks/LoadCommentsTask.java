package com.elvers.gereon.stgnewsapp1.tasks;

import android.os.AsyncTask;

import com.elvers.gereon.stgnewsapp1.api.Comment;
import com.elvers.gereon.stgnewsapp1.handlers.ICommentsLoadedHandler;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

import java.util.List;

public class LoadCommentsTask extends AsyncTask<String, Void, List<Comment>> {

    private ICommentsLoadedHandler handler;

    public LoadCommentsTask(ICommentsLoadedHandler handler) {
        this.handler = handler;
    }

    @Override
    protected List<Comment> doInBackground(String... strings) {
        if(strings.length != 1) throw new IllegalArgumentException();
        return Utils.fetchComments(strings[0]);
    }

    @Override
    protected void onPostExecute(List<Comment> comments) {
        super.onPostExecute(comments);
        if(handler != null)
            handler.onCommentsFetched(comments);
    }
}
