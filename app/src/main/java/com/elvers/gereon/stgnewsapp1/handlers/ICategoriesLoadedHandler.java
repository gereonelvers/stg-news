package com.elvers.gereon.stgnewsapp1.handlers;

import com.elvers.gereon.stgnewsapp1.api.CategoryResponse;

import java.util.List;

public interface ICategoriesLoadedHandler {

    void onCategoriesFetched(List<CategoryResponse.Category> categories);

}
