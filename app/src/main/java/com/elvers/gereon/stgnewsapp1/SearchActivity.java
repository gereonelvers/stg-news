package com.elvers.gereon.stgnewsapp1;

import android.app.SearchManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.v4.app.LoaderManager;
import android.support.v4.content.Loader;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ListView;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

/**
 * Search Activity of the App. This Activity is used when a search query is send through the SearchView on {@link MainActivity}.
 * It sends the query to the WordPress backend and displays the results in a ListView similar to the one used in {@link MainActivity}
 *
 * @author Gereon Elvers
 */
public class SearchActivity extends AppCompatActivity implements LoaderManager.LoaderCallbacks<List<Article>> {

    // Static request URL the data will be requested from. Putting it at the top like this allow easier modification of top level domain if required
    private static final String WP_REQUEST_URL = "www.stg-sz.net";

    /* Assign loader static ID (enables easier implementation of possible future loaders).
        This ID differs from the one used in MainActivity to avoid interference if the original loader is not destroyed before this one is launched */
    private static final int ARTICLE_SEARCH_LOADER_ID = 2;

    /* There are a lot of items declared outside of individual methods here.
        This is done because they are required to be available across methods */
    String titleString;
    String requestTerm;
    LoaderManager loaderManager;
    ListView mListView;
    View loadingIndicator;
    TextView emptyView;
    String numberOfArticlesParam;
    private ArticleAdapter mAdapter;

    /**
     * onCreate is called when this Activity is launched. It is therefore responsible for setting it up based on the query specified in the Intent used to launch it.
     * As the base layout of this Activity is very similar to {@link MainActivity}, this will be as well.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Setting XML base layout
        setContentView(R.layout.activity_search);

        // Setting up Actionbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        ActionBar actionbar = getSupportActionBar();
        titleString = getString(R.string.search_title);
        handleIntent(getIntent());
        if (actionbar != null) {
            actionbar.setDisplayHomeAsUpEnabled(true);
            actionbar.setTitle(titleString);
        }

        // Getting numberOfArticlesParam from SharedPreferences (default: 10; modifiable through Preferences). This is the number of articles requested from the backend.
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        numberOfArticlesParam = sharedPreferences.getString("post_number","10");

        // Initializing loaderManager
        loaderManager = getSupportLoaderManager();

        // Finding loadingIndicator
        loadingIndicator = findViewById(R.id.loading_circle);

        // EmptyView (The message that is shown when ListView is empty) is initialized and set on ListView
        emptyView = findViewById(R.id.empty_view);
        mListView = findViewById(R.id.listView);
        mListView.setEmptyView(emptyView);

        //  Load of Article objects onto mListView is requested
        initLoaderListView();

    }

    public void initLoaderListView() {
        mAdapter = new ArticleAdapter(this, new ArrayList<Article>());
        mListView.setAdapter(mAdapter);
        mListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {
                Article currentArticle = mAdapter.getItem(i);
                Intent articleIntent = new Intent(getApplicationContext(), ArticleActivity.class);
                if (currentArticle != null) {
                    articleIntent.putExtra("ARTICLE_URI", currentArticle.getUrl());
                    articleIntent.putExtra("ARTICLE_TITLE", currentArticle.getTitle());
                }
                startActivity(articleIntent);
            }
        });

        loaderManager.destroyLoader(ARTICLE_SEARCH_LOADER_ID);
        loaderManager.initLoader(ARTICLE_SEARCH_LOADER_ID, null, this);
    }


    /**
     * Refreshing mListView when returning to SearchActivity to make sure results are up-to-date.
     */
    @Override
    public void onRestart() {
        super.onRestart();
        mAdapter.clear();
        loadingIndicator.setVisibility(View.VISIBLE);
        initLoaderListView();
        emptyView.setVisibility(View.INVISIBLE);
    }


    /**
     * This method is called when creating a new ArticleLoader. It creates a modified query URL (by adding the filter parameters listed below) and initializes the ArticleLoader.
     *
     * Parameters:
     * {@param requestTerm} is a String containing the search term
     * {@param numberOfArticlesParam} is a String containing the number of Article objects requested from the server
     */
    @Override
    @NonNull
    public Loader<List<Article>> onCreateLoader(int i, Bundle bundle) {
        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder.scheme("http");
        uriBuilder.authority(WP_REQUEST_URL);
        uriBuilder.appendPath("wp-json").appendPath("wp").appendPath("v2").appendPath("posts");
        if (!requestTerm.isEmpty()){
            uriBuilder.appendQueryParameter("search", requestTerm);
        }

        if (!numberOfArticlesParam.isEmpty()){
            uriBuilder.appendQueryParameter("per_page", numberOfArticlesParam);
        }
        return new ArticleLoader(this, uriBuilder.toString());
    }

    /**
     * Method called once the ArticleLoader has finished loading
     * It manages visibility of loadingIndicator and emptyView and pushes the list of Article objects onto the ArticleAdapter
     */
    @Override
    public void onLoadFinished(@NonNull Loader<List<Article>> loader, List<Article> articles) {
        loadingIndicator.setVisibility(View.GONE);
        TextView emptyView = findViewById(R.id.empty_view);
        emptyView.setText(R.string.no_articles_search);
        mAdapter.clear();
        if (articles != null && !articles.isEmpty()) {
            mAdapter.addAll(articles);
        }
    }

    /**
     * If the ArticleLoader is reset, so should the ArticleAdapter
     */
    @Override
    public void onLoaderReset(@NonNull Loader<List<Article>> loader) {
        mAdapter.clear();
    }

    /**
     * This method is called when a new is detected (e.g. when launching the Activity through an Intent)
     * Since the response to it is the same as the one required in onCreate(), it simply calls handleIntent()
     */
    @Override
    protected void onNewIntent(Intent intent) {
        handleIntent(intent);
    }


    /**
     * This method is called whenever data that was pushed through an Intent needs to be retrieved. It gets the String and saves it as requestTerm.
     * It also refreshes titleString to match the new search term.
     */
    public void handleIntent(Intent intent) {
        if (Intent.ACTION_SEARCH.equals(intent.getAction())) {
            requestTerm = intent.getStringExtra(SearchManager.QUERY);
            titleString = titleString + requestTerm + "\"";
        }
    }

}