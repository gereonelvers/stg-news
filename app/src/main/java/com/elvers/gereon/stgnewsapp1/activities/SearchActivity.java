package com.elvers.gereon.stgnewsapp1.activities;

import android.annotation.SuppressLint;
import android.app.SearchManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.TextView;

import com.elvers.gereon.stgnewsapp1.R;
import com.elvers.gereon.stgnewsapp1.adapter.ArticleAdapter;
import com.elvers.gereon.stgnewsapp1.adapter.AuthorAdapter;
import com.elvers.gereon.stgnewsapp1.api.Article;
import com.elvers.gereon.stgnewsapp1.api.Author;
import com.elvers.gereon.stgnewsapp1.api.ListEntry;
import com.elvers.gereon.stgnewsapp1.handlers.IListContentLoadedHandler;
import com.elvers.gereon.stgnewsapp1.tasks.LoadListContentTask;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

import java.util.ArrayList;
import java.util.List;

/**
 * Search Activity of the App. This Activity is used when a search query is send through the SearchView on {@link MainActivity}.
 * It sends the query to the WordPress backend and displays the results in a ListView similar to the one used in {@link MainActivity}
 *
 * @author Gereon Elvers
 */
public class SearchActivity extends AppCompatActivity implements IListContentLoadedHandler, SharedPreferences.OnSharedPreferenceChangeListener {

    public static String ACTION_FILTER_AUTHOR = "FILTER_BY_AUTHOR";
    public static String EXTRA_AUTHOR_ID = "EXTRA_AUTHOR_ID";
    public static String EXTRA_CATEGORY_ID = "EXTRA_CATEGORY_ID";

    // Static request URL the data will be requested from. Putting it at the top like this allow easier modification of top level domain if required
    private static final String WP_REQUEST_URL = "www.stg-sz.net";

    /* There are a lot of items declared outside of individual methods here.
        This is done because they are required to be available across methods */
    SwipeRefreshLayout mSwipeRefreshLayout;
    String titleString = "";
    String searchFilter = ""; // don't want to cause a NullPointerException
    int authorFilter = -1;
    int categoryId = -1;
    ListView mListView;
    View loadingIndicator;
    TextView emptyView;
    String numberOfArticlesParam;
    Integer pageNumber;
    private ArrayAdapter mAdapter;
    private Button btnLoadMore;

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
        handleIntent(getIntent());
        if (actionbar != null) {
            actionbar.setDisplayHomeAsUpEnabled(true);
            actionbar.setTitle(titleString);
        }

        // Getting numberOfArticlesParam from SharedPreferences (default: 10; modifiable through Preferences). This is the number of articles requested from the backend.
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        numberOfArticlesParam = sharedPreferences.getString("post_number", "10");
        sharedPreferences.registerOnSharedPreferenceChangeListener(this);

        // Finding loadingIndicator
        loadingIndicator = findViewById(R.id.loading_circle);

        // EmptyView (The message that is shown when ListView is empty) is initialized and set on ListView
        emptyView = findViewById(R.id.empty_view);
        mListView = findViewById(R.id.listView);
        mListView.setEmptyView(emptyView);

        btnLoadMore = new Button(this);
        btnLoadMore.setText(R.string.load_more);
        btnLoadMore.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loadingIndicator.setVisibility(View.VISIBLE);
                pageNumber++;
                startFetchingArticles();
            }
        });
        mListView.addFooterView(btnLoadMore);

        // When launching the Activity, the first page should be loaded
        pageNumber = 1;

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
        if(mAdapter != null)
            mAdapter.clear();
        loadingIndicator.setVisibility(View.VISIBLE);
        initLoaderListView();
        emptyView.setVisibility(View.INVISIBLE);
    }

    public void initLoaderListView() {
        pageNumber = 1;

        if(categoryId == -3) {
            mAdapter = new AuthorAdapter(this, new ArrayList<Author>());
            mListView.setAdapter(mAdapter);
            mListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
                @Override
                public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {
                    if (mAdapter.getCount() > i) {
                        Author currentAuthor = (Author) mAdapter.getItem(i);
                        Intent authorIntent = new Intent(getApplicationContext(), SearchActivity.class);
                        if (currentAuthor != null) {
                            authorIntent.setAction(SearchActivity.ACTION_FILTER_AUTHOR);
                            authorIntent.putExtra(SearchActivity.EXTRA_AUTHOR_ID, currentAuthor.getId());
                        }
                        finish(); // maybe the articles listed by author should have their own activity (this is just a dirty fix)
                        startActivity(authorIntent);
                    }
                }
            });
        } else {
            mAdapter = new ArticleAdapter(this, new ArrayList<Article>());
            mListView.setAdapter(mAdapter);
            mListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
                @Override
                public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {
                    if (mAdapter.getCount() > i) {
                        Article currentArticle = (Article) mAdapter.getItem(i);
                        Intent articleIntent = new Intent(getApplicationContext(), ArticleActivity.class);
                        if (currentArticle != null) {
                            articleIntent.putExtra("ARTICLE_URI", currentArticle.getUrl());
                            articleIntent.putExtra("ARTICLE_TITLE", currentArticle.getTitleHtmlEscaped());
                            articleIntent.putExtra("ARTICLE_ID", currentArticle.getId());
                        }
                        startActivity(articleIntent);
                    }
                }
            });
        }

        startFetchingArticles();
    }

    private void startFetchingArticles() {
        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder.scheme("https");
        uriBuilder.authority(WP_REQUEST_URL);
        uriBuilder.appendPath("wp-json").appendPath("wp").appendPath("v2");
        if(categoryId == -3) {
            uriBuilder.appendPath("users");
        } else {
            uriBuilder.appendPath("posts");
        }

        if (!searchFilter.isEmpty()) {
            uriBuilder.appendQueryParameter("search", searchFilter);
        } else if (authorFilter != -1 && categoryId != -3) {
            uriBuilder.appendQueryParameter("author", String.valueOf(authorFilter));
        }
        if(categoryId > 0) {
            uriBuilder.appendQueryParameter("categories", String.valueOf(categoryId));
        }

        if (categoryId == -2) {
            for(String fav : PreferenceManager.getDefaultSharedPreferences(this).getString("favorites", "").split(",")) {
                uriBuilder.appendQueryParameter("include[]", fav);
            }
        }

        if (!numberOfArticlesParam.isEmpty()) {
            uriBuilder.appendQueryParameter("per_page", numberOfArticlesParam);
        }

        uriBuilder.appendQueryParameter("page", pageNumber.toString());
        new LoadListContentTask(this).execute(uriBuilder.toString());
    }

    @Override
    public void onListContentFetched(List<ListEntry> entries) {
        btnLoadMore.setVisibility(View.VISIBLE);

        loadingIndicator.setVisibility(View.GONE);
        emptyView.setText(R.string.no_result_search);

        mAdapter.notifyDataSetChanged();
        if (entries != null && !entries.isEmpty()) {
            mAdapter.addAll(entries);
            if(entries.size() != Integer.parseInt(numberOfArticlesParam))
                btnLoadMore.setVisibility(View.INVISIBLE);
        } else {
            if(entries != null)
                btnLoadMore.setVisibility(View.INVISIBLE);
        }

        if (mSwipeRefreshLayout.isRefreshing()) {
            mSwipeRefreshLayout.setRefreshing(false);
        }
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
     * This method is called whenever data that was pushed through an Intent needs to be retrieved. It gets the String and saves it as searchFilter.
     * It also refreshes titleString to match the new search term.
     */
    public void handleIntent(Intent intent) {
        if (Intent.ACTION_SEARCH.equals(intent.getAction())) {
            searchFilter = intent.getStringExtra(SearchManager.QUERY);
            if(intent.hasExtra(EXTRA_CATEGORY_ID)) {
                categoryId = intent.getIntExtra(EXTRA_CATEGORY_ID, -1);
            }
            titleString = (categoryId == -3 ? getString(R.string.search_title_author) : getString(R.string.search_title)) + searchFilter + "\"";
        } else if (ACTION_FILTER_AUTHOR.equals(intent.getAction())) {
            authorFilter = intent.getIntExtra(EXTRA_AUTHOR_ID, -1);
            titleString = getString(R.string.search_title_by_author) + Utils.getAuthorName(authorFilter);
        }
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            onBackPressed();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
        if(key.equals("dark_mode")) {
            recreate();
        } else if (key.equals("post_number")) {
            recreate();
        }
    }
}