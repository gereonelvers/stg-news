package com.elvers.gereon.stgnewsapp1.tasks;

import android.content.Context;
import android.support.annotation.Nullable;
import android.support.v4.content.AsyncTaskLoader;

import com.elvers.gereon.stgnewsapp1.api.CategoryResponse;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

public class CategoryLoader extends AsyncTaskLoader<CategoryResponse> {

    public CategoryLoader(Context context) {
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
