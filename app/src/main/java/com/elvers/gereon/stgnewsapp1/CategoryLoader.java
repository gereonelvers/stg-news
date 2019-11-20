package com.elvers.gereon.stgnewsapp1;

import android.content.Context;
import android.support.annotation.Nullable;
import android.support.v4.content.AsyncTaskLoader;

public class CategoryLoader extends AsyncTaskLoader<String> {

    public CategoryLoader(Context context) {
        super(context);
    }

    @Override
    protected void onStartLoading() {
        forceLoad();
    }

    @Nullable
    @Override
    public String loadInBackground() {
        return Utils.getCategories();
    }
}
