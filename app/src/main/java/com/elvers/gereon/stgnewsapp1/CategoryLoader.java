package com.elvers.gereon.stgnewsapp1;

import android.content.Context;
import android.support.annotation.Nullable;
import android.support.v4.content.AsyncTaskLoader;

import com.elvers.gereon.stgnewsapp1.api.CategoryResponse;

public class CategoryLoader extends AsyncTaskLoader<CategoryResponse> {

    CategoryLoader(Context context) {
        super(context);
    }

    @Override
    protected void onStartLoading() {
        forceLoad();
    }

    @Nullable
    @Override
    public CategoryResponse loadInBackground() {
        return Utils.updateCategories();
    }
}
