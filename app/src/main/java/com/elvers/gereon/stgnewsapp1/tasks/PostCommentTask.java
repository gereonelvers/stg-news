package com.elvers.gereon.stgnewsapp1.tasks;

import android.os.AsyncTask;

import com.elvers.gereon.stgnewsapp1.handlers.ICommentPostedhandler;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

import java.io.IOException;

public class PostCommentTask extends AsyncTask<String, Void, Integer> {

    private ICommentPostedhandler handler;

    public PostCommentTask(ICommentPostedhandler handler) {
        this.handler = handler;
    }

    @Override
    protected Integer doInBackground(String... strings) {
        if(strings.length != 4) throw new IllegalArgumentException();
        if (strings[0].isEmpty() || strings[1].isEmpty() || strings[2].isEmpty() || strings[3].isEmpty()) {
            return 0;
        }
        try {
            return Utils.sendComment(strings[0], strings[1], strings[2], strings[3]);
        } catch (IOException e) {
            e.printStackTrace();
            return -1;
        }
    }

    @Override
    protected void onPostExecute(Integer integer) {
        super.onPostExecute(integer);
        if(handler != null)
            handler.onCommentPosted(integer);
    }
}
