package com.elvers.gereon.stgnewsapp1.handlers;

import com.elvers.gereon.stgnewsapp1.api.Article;

import java.util.List;

public interface IArticlesLoadedHandler {

    void onArticlesFetched(List<Article> articles);

}
