package com.elvers.gereon.stgnewsapp1.tasks;

import android.os.AsyncTask;

import com.elvers.gereon.stgnewsapp1.api.Article;
import com.elvers.gereon.stgnewsapp1.handlers.IArticlesLoadedHandler;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

import java.util.List;

public class LoadArticlesTask extends AsyncTask<String, Void, List<Article>> {

    private IArticlesLoadedHandler handler;

    public LoadArticlesTask(IArticlesLoadedHandler handler) {
        this.handler = handler;
    }

    @Override
    protected List<Article> doInBackground(String... urls) {
        if(urls.length != 1) throw new IllegalArgumentException();
        return Utils.fetchArticles(urls[0]);
    }

    @Override
    protected void onPostExecute(List<Article> articles) {
        super.onPostExecute(articles);
        handler.onArticlesFetched(articles);
    }
}
