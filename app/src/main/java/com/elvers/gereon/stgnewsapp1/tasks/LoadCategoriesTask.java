package com.elvers.gereon.stgnewsapp1.tasks;

import android.os.AsyncTask;

import com.elvers.gereon.stgnewsapp1.api.CategoryResponse;
import com.elvers.gereon.stgnewsapp1.handlers.ICategoriesLoadedHandler;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

import java.util.List;

public class LoadCategoriesTask extends AsyncTask<Void, Void, List<CategoryResponse.Category>> {

    private ICategoriesLoadedHandler handler;

    public LoadCategoriesTask(ICategoriesLoadedHandler handler) {
        this.handler = handler;
    }

    @Override
    protected List<CategoryResponse.Category> doInBackground(Void... unused) {
        if(Utils.categoryResponse == null)
            Utils.updateCategories();
        if(Utils.categoryResponse == null)
            return null;
        return Utils.categoryResponse.getCategories();
    }

    @Override
    protected void onPostExecute(List<CategoryResponse.Category> categories) {
        super.onPostExecute(categories);
        if(handler != null)
            handler.onCategoriesFetched(categories);
    }
}
