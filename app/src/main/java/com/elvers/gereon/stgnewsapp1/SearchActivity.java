package com.elvers.gereon.stgnewsapp1;

import android.annotation.SuppressLint;
import android.app.SearchManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.v4.app.LoaderManager;
import android.support.v4.content.Loader;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ImageView;
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

    // Tag for log messages
    private static final String LOG_TAG = SearchActivity.class.getSimpleName();

    // Static request URL the data will be requested from. Putting it at the top like this allow easier modification of top level domain if required
    private static final String WP_REQUEST_URL = "www.stg-sz.net";

    /* Assign loader static ID (enables easier implementation of possible future loaders).
        This ID differs from the one used in MainActivity to avoid interference if the original loader is not destroyed before this one is launched */
    private static final int ARTICLE_SEARCH_LOADER_ID = 2;

    /* There are a lot of items declared outside of individual methods here.
        This is done because they are required to be available across methods */
    SwipeRefreshLayout mSwipeRefreshLayout;
    String titleString;
    String requestTerm;
    LoaderManager loaderManager;
    ListView mListView;
    View loadingIndicator;
    TextView emptyView;
    String numberOfArticlesParam;
    Integer pageNumber;
    TextView pageNumberTV;
    private ArticleAdapter mAdapter;

    /**
     * onCreate is called when this Activity is launched. It is therefore responsible for setting it up based on the query specified in the Intent used to launch it.
     * As the base layout of this Activity is very similar to {@link MainActivity}, this will be as well.
     */
    @SuppressLint("SetTextI18n")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Utils.updateNightMode(this);

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
        numberOfArticlesParam = sharedPreferences.getString("post_number", "10");

        // Initializing loaderManager
        loaderManager = getSupportLoaderManager();

        // Finding loadingIndicator
        loadingIndicator = findViewById(R.id.loading_circle);

        // EmptyView (The message that is shown when ListView is empty) is initialized and set on ListView
        emptyView = findViewById(R.id.empty_view);
        mListView = findViewById(R.id.listView);
        mListView.setEmptyView(emptyView);

        // Inflate page picker and add below ListView
        View pagePicker = LayoutInflater.from(this).inflate(R.layout.page_picker, null, false);
        mListView.addFooterView(pagePicker);

        // When launching the Activity, the first page should be loaded
        pageNumber = 1;

        // Initialize page number TextView and set initial value (at this point, always 1)
        pageNumberTV = findViewById(R.id.page_number_tv);
        pageNumberTV.setText(pageNumber.toString());

        // Implement page back-button
        ImageView backIV = findViewById(R.id.back_iv);
        backIV.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (pageNumber > 1) {
                    pageNumber--;
                    pageNumberTV.setText(pageNumber.toString());
                    refreshListView();
                }
            }
        });
        // Implement page forward-button
        ImageView forwardIV = findViewById(R.id.forward_iv);
        forwardIV.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                pageNumber++;
                pageNumberTV.setText(pageNumber.toString());
                refreshListView();
            }
        });

        // SwipeRefreshLayout is initialized and refresh functionality is implemented
        mSwipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        mSwipeRefreshLayout.setColorSchemeResources(R.color.colorAccent);
        mSwipeRefreshLayout.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
            @Override
            public void onRefresh() {
                mSwipeRefreshLayout.setRefreshing(true);
                refreshListView();
            }
        });

        //  Load of Article objects onto mListView is requested
        initLoaderListView();

    }

    /**
     * This method is called when performing a refresh of the ListView while the Layout remains visible
     * It dumps the old Adapter and makes corrects the visibility of loadingIndicator and emptyView so make the user aware that new data is about to appear
     */
    public void refreshListView() {
        mAdapter.clear();
        loadingIndicator.setVisibility(View.VISIBLE);
        initLoaderListView();
        emptyView.setVisibility(View.INVISIBLE);
    }

    public void initLoaderListView() {
        mAdapter = new ArticleAdapter(this, new ArrayList<Article>());
        mListView.setAdapter(mAdapter);
        mListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {
                /*
                 * This really, really shouldn't require a try-block, but I once managed to reach an IndexOutOfBoundsException here for some reason.
                 * I haven't been able to reproduce it since, but I decided to keep this in a try-block anyway ¯\_(ツ)_/¯
                 */
                try {
                    Article currentArticle = mAdapter.getItem(i);
                    Intent articleIntent = new Intent(getApplicationContext(), ArticleActivity.class);
                    if (currentArticle != null) {
                        articleIntent.putExtra("ARTICLE_URI", currentArticle.getUrl());
                        articleIntent.putExtra("ARTICLE_TITLE", currentArticle.getTitle());
                        articleIntent.putExtra("ARTICLE_ID", currentArticle.getId());
                    }
                    startActivity(articleIntent);
                } catch (Exception e) {
                    Log.e(LOG_TAG, "How did you even do this? OutOfBounds in SearchActivity onItemClick");
                }
            }
        });

        loaderManager.destroyLoader(ARTICLE_SEARCH_LOADER_ID);
        loaderManager.initLoader(ARTICLE_SEARCH_LOADER_ID, null, this);
    }


    /**
     * Refreshing mListView when returning to SearchActivity to make sure results are up-to-date.
     */
    @Override
    public void onRestart() { // there is no option to change the theme from this activity, so I don't have to recreate the activity
        super.onRestart();
        mAdapter.clear();
        loadingIndicator.setVisibility(View.VISIBLE);
        initLoaderListView();
        emptyView.setVisibility(View.INVISIBLE);
    }


    /**
     * This method is called when creating a new ArticleLoader. It creates a modified query URL (by adding the filter parameters listed below) and initializes the ArticleLoader.
     * <p>
     * Parameters:
     * {@param requestTerm} is a String containing the search term
     * {@param numberOfArticlesParam} is a String containing the number of Article objects requested from the server
     * {@param pageNumber} is the page number loaded
     */
    @Override
    @NonNull
    public Loader<List<Article>> onCreateLoader(int i, Bundle bundle) {
        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder.scheme("https");
        uriBuilder.authority(WP_REQUEST_URL);
        uriBuilder.appendPath("wp-json").appendPath("wp").appendPath("v2").appendPath("posts");
        if (!requestTerm.isEmpty()) {
            uriBuilder.appendQueryParameter("search", requestTerm);
        }

        if (!numberOfArticlesParam.isEmpty()) {
            uriBuilder.appendQueryParameter("per_page", numberOfArticlesParam);
        }

        uriBuilder.appendQueryParameter("page", pageNumber.toString());
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
        if (pageNumber == 1) {
            emptyView.setText(R.string.no_articles_search);
        } else {
            emptyView.setText(R.string.no_articles_search_page);
        }
        mAdapter.clear();
        if (articles != null && !articles.isEmpty()) {
            mAdapter.addAll(articles);
        } else {
            emptyView.setOnClickListener(new View.OnClickListener() {
                @SuppressLint("SetTextI18n")
                @Override
                public void onClick(View v) {
                    if (pageNumber != 1) {
                        pageNumber--;
                        pageNumberTV.setText(pageNumber.toString());
                        refreshListView();
                    }
                }
            });
        }
        if (mSwipeRefreshLayout.isRefreshing()) {
            mSwipeRefreshLayout.setRefreshing(false);
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