package com.elvers.gereon.stgnewsapp1.tasks;

import android.content.Context;
import android.support.annotation.Nullable;
import android.support.v4.content.AsyncTaskLoader;

import com.elvers.gereon.stgnewsapp1.api.CategoryResponse;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

/**
 * Loads a list of Category objects using an AsyncTask to perform the network request to the given URL.
 * (As data should not be loaded from of-device in the UI-Thread, an AsyncTask is used to push it onto a secondary thread)
 *
 * @author Gereon Elvers
 */
public class CategoryLoader extends AsyncTaskLoader<CategoryResponse> {

    /**
     * Constructing a new CommentLoader
     *
     * @param context is the context it is loaded to
     */
    public CategoryLoader(Context context) {
        super(context);
    }

    /* force load when loading is requested */
    @Override
    protected void onStartLoading() {
        forceLoad();
    }

    /* This is the actual load being done in the background thread */
    @Nullable
    @Override
    public CategoryResponse loadInBackground() {
        return Utils.updateCategories();
    }
}
