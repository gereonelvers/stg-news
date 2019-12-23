package com.elvers.gereon.stgnewsapp1.tasks;

import android.os.AsyncTask;

import com.elvers.gereon.stgnewsapp1.api.Article;
import com.elvers.gereon.stgnewsapp1.api.AuthorResponse;
import com.elvers.gereon.stgnewsapp1.api.ListEntry;
import com.elvers.gereon.stgnewsapp1.handlers.IListContentLoadedHandler;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

import java.util.ArrayList;
import java.util.List;

public class LoadListContentTask extends AsyncTask<String, Void, List<ListEntry>> {

    private IListContentLoadedHandler handler;

    public LoadListContentTask(IListContentLoadedHandler handler) {
        this.handler = handler;
    }

    @Override
    protected List<ListEntry> doInBackground(String... urls) {
        if(urls.length != 1) throw new IllegalArgumentException();

        List<ListEntry> content = new ArrayList<>();
        if(urls[0].contains("wp-json/wp/v2/users")) {
            AuthorResponse response = Utils.fetchAuthors(urls[0]);
            if(response == null)
                return null;
            content.addAll(response.getAuthors());
        } else {
            List<Article> articles = Utils.fetchArticles(urls[0]);
            if(articles == null)
                return null;
            content.addAll(articles);
        }

        return content;
    }

    @Override
    protected void onPostExecute(List<ListEntry> articles) {
        super.onPostExecute(articles);
        if(handler != null)
            handler.onListContentFetched(articles);
    }
}
