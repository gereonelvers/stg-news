package com.elvers.gereon.stgnewsapp1;

import android.app.SearchManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.design.widget.NavigationView;
import android.support.v4.app.LoaderManager;
import android.support.v4.content.Loader;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.SearchView;
import android.support.v7.widget.Toolbar;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ListView;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

/**
 * Main Activity of the App. This contains all functionality included in the main screen
 * This includes the main ListView (in a SwipeRefreshLayout) as well as a DrawerLayout
 *
 * @author Gereon Elvers
 */
public class MainActivity extends AppCompatActivity implements LoaderManager.LoaderCallbacks<List<Article>> {

    /**
     * Static request URL (modifiers will append to this)
     * Modifiers:
     * {@param filterParam} for category filtering
     * {@param numberOfArticlesParam} for changing the number of posts requested
     */

    // Static request URL the data will be requested from. Putting it at the top like this allow easier modification of top level domain if required
    private static final String WP_REQUEST_URL = "www.stg-sz.net";

    // Assign loader static ID (enables easier implementation of possible future loaders)
    private static final int ARTICLE_LOADER_ID = 1;

    /* There are a lot of items declared outside of individual methods here.
    This is done because they are required to be available across methods and it's more economical to simply initialize them onCreate() */
    SwipeRefreshLayout mSwipeRefreshLayout;
    ListView articleListView;
    TextView emptyView;
    LoaderManager loaderManager;
    View loadingIndicator;
    String filterParam;
    String numberOfArticlesParam;
    private ArticleAdapter mAdapter;
    private DrawerLayout mDrawerLayout;

    /**
     * onCreate() is called when the Activity is launched.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Setting XML base layout
        setContentView(R.layout.activity_main);

        // Finding loading indicator in layout
        loadingIndicator = findViewById(R.id.loading_circle);

        /*Initializing filterParam so it can be concatenated with WP_REQUEST_URL even if no filter is applied (would be "null" otherwise)*/
        filterParam = "";

        // Getting numberOfArticlesParam from SharedPreferences (default: 10; modifiable through Preferences). This is the number of articles requested from the backend.
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        numberOfArticlesParam = sharedPreferences.getString("post_number", "10");

        // Setting up Actionbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        final ActionBar actionbar = getSupportActionBar();
        if (actionbar != null) {
            actionbar.setDisplayHomeAsUpEnabled(true);
            actionbar.setHomeAsUpIndicator(R.drawable.ic_action_hamburger);
            actionbar.setTitle(R.string.app_name);
        }
        // Setting up DrawerLayout
        mDrawerLayout = findViewById(R.id.drawer_layout);
        NavigationView navigationView = findViewById(R.id.nav_view);
        // Item selected when launching the App is "All Articles"
        navigationView.setCheckedItem(R.id.all_articles);
        /* This NavigationItemSelectListener manages the change between different filter presets (filtering by categories) */
        navigationView.setNavigationItemSelectedListener(
                new NavigationView.OnNavigationItemSelectedListener() {
                    @Override
                    public boolean onNavigationItemSelected(@NonNull MenuItem menuItem) {
                        menuItem.setChecked(true);
                        /* If an item is selected this means that a filter will be applied.
                         * Hardcoding categories like this is not really elegant but since WordPress IDs are unpredictable and each category corresponds to a fixed item in the drawer_view, it is unavoidable (AFAIK)
                         * Once the filter is applied, the ListView is refreshed and the drawer is closed
                         *
                         * If you want to implement a new category to filter by, first implement it in WordPress. After that, find out it's WordPress-ID,
                         * implement it in drawer_view.xml (This is where you assign an internal ID and a drawable to represent the category)
                         * and create a new case here. Scheme:
                         *
                         * case R.id.[ID you assigned in drawer_view.xml]
                         *      filterParam = "[WordPress-ID]"
                         *      refreshListView();
                         *      actionBar.setTitle([Name of category])
                         *      mDrawerLayout.closeDrawers();
                         *      return true;
                         *
                         * Please don't hardcode the category name, instead create a new string resource in strings.xml and simply reference it's ID here.
                         * You'll also want to implement the new category in Utils.xml (extractArticleFeaturesFromJson()) to make it correctly show up in list items.
                         *
                         */
                        if (actionbar != null) {
                            switch (menuItem.getItemId()) {
                                case R.id.all_articles:
                                    filterParam = "";
                                    refreshListView();
                                    actionbar.setTitle(R.string.app_name);
                                    mDrawerLayout.closeDrawers();
                                    return true;

                                case R.id.team:
                                    filterParam = "2";
                                    refreshListView();
                                    actionbar.setTitle(R.string.author_team_cat);
                                    mDrawerLayout.closeDrawers();
                                    return true;

                                case R.id.sports:
                                    filterParam = "3";
                                    refreshListView();
                                    actionbar.setTitle(R.string.sport_cat);
                                    mDrawerLayout.closeDrawers();
                                    return true;

                                case R.id.culture:
                                    filterParam = "4";
                                    refreshListView();
                                    actionbar.setTitle(R.string.culture_cat);
                                    mDrawerLayout.closeDrawers();
                                    return true;

                                case R.id.trips:
                                    filterParam = "5";
                                    refreshListView();
                                    actionbar.setTitle(R.string.trips_cat);
                                    mDrawerLayout.closeDrawers();
                                    return true;

                                case R.id.sv:
                                    filterParam = "6";
                                    refreshListView();
                                    actionbar.setTitle(R.string.sv_news_cat);
                                    mDrawerLayout.closeDrawers();
                                    return true;

                                case R.id.interviews:
                                    filterParam = "7";
                                    refreshListView();
                                    actionbar.setTitle(R.string.interviews_cat);
                                    mDrawerLayout.closeDrawers();
                                    return true;

                                case R.id.opinion:
                                    filterParam = "8";
                                    refreshListView();
                                    actionbar.setTitle(R.string.opinions_cat);
                                    mDrawerLayout.closeDrawers();
                                    return true;

                                case R.id.knowledge:
                                    filterParam = "9";
                                    refreshListView();
                                    actionbar.setTitle(R.string.knowledge_cat);
                                    mDrawerLayout.closeDrawers();
                                    return true;

                                case R.id.history:
                                    filterParam = "12";
                                    refreshListView();
                                    actionbar.setTitle(R.string.history_cat);
                                    mDrawerLayout.closeDrawers();
                                    return true;

                                case R.id.teachers:
                                    filterParam = "11";
                                    refreshListView();
                                    actionbar.setTitle(R.string.teachers_cat);
                                    mDrawerLayout.closeDrawers();
                                    return true;

                                case R.id.other:
                                    filterParam = "1";
                                    refreshListView();
                                    actionbar.setTitle(R.string.other_cat);
                                    mDrawerLayout.closeDrawers();
                                    return true;
                            }
                        }
                        refreshListView();
                        mDrawerLayout.closeDrawers();
                        return true;
                    }
                });

        // Initializing loaderManager
        loaderManager = getSupportLoaderManager();

        // EmptyView (The message that is shown when ListView is empty) is initialized and set on ListView
        emptyView = findViewById(R.id.empty_view);
        articleListView = findViewById(R.id.article_list_view);
        articleListView.setEmptyView(emptyView);

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

        // Load of Article objects onto listView is requested
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

    /**
     * This is the method actually loading the data and projecting it onto the ListView. It creates a new Adapter and sets it on the ListView
     * It also creates an OnItemClickListener that's set on the Articles projected onto the ListView and opens ArticleActivity when clicked
     * Lastly it destroys (if necessary) and restarts the ArticleLoader responsible for filling the ArticleAdapter with content
     */
    public void initLoaderListView() {
        mAdapter = new ArticleAdapter(this, new ArrayList<Article>());
        articleListView.setAdapter(mAdapter);
        articleListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {
                Article currentArticle = mAdapter.getItem(i);
                Intent articleIntent = new Intent(getApplicationContext(), ArticleActivity.class);
                if (currentArticle != null) {
                    articleIntent.putExtra("ARTICLE_URI", currentArticle.getUrl());
                    articleIntent.putExtra("ARTICLE_TITLE", currentArticle.getTitle());
                    articleIntent.putExtra("ARTICLE_ID", currentArticle.getId());
                }
                startActivity(articleIntent);
            }
        });

        loaderManager.destroyLoader(ARTICLE_LOADER_ID);
        loaderManager.initLoader(ARTICLE_LOADER_ID, null, this);
    }

    /**
     * This method associates actions with the menu options representing them on the ActionBar
     */
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            // This is the "hamburger menu" that expands the Drawer when activated
            case android.R.id.home:
                mDrawerLayout.openDrawer(GravityCompat.START);
                return true;

            // Settings button
            case R.id.settings:
                Intent settingsIntent = new Intent(getApplicationContext(), SettingsActivity.class);
                startActivity(settingsIntent);
                return true;

            // About button
            case R.id.about:
                Intent aboutIntent = new Intent(getApplicationContext(), AboutActivity.class);
                startActivity(aboutIntent);
                return true;
        }
        return super.onOptionsItemSelected(item);
    }

    /**
     * Refresh listView when returning to the MainActivity. This is necessary to make sure the data is up to date when returning to the App
     */
    @Override
    public void onRestart() {
        super.onRestart();
        refreshListView();
    }


    /**
     * This method is called when creating a new ArticleLoader. It creates a modified query URL (by adding the filter parameters listed below) and initializes the ArticleLoader.
     *
     * Parameters:
     * {@param filterParam} is a String containing the id of the category requested (if present)
     * {@param numberOfArticlesParam} is a String containing the number of Article objects requested from the server
     */
    @Override
    @NonNull
    public Loader<List<Article>> onCreateLoader(int i, Bundle bundle) {
        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder.scheme("http");
        uriBuilder.authority(WP_REQUEST_URL);
        uriBuilder.appendPath("wp-json").appendPath("wp").appendPath("v2").appendPath("posts");

        if (!filterParam.isEmpty()) {
            uriBuilder.appendQueryParameter("categories", filterParam);
        }
        if (!numberOfArticlesParam.isEmpty()) {
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
        // Once the load process is finished, the loadingIndicator circle should disappear
        loadingIndicator.setVisibility(View.GONE);

        // EmptyView is only visible if mAdapter is empty
        TextView emptyView = findViewById(R.id.empty_view);
        emptyView.setText(R.string.no_articles);

        // Clears the ArticleAdapter to allow the new array of Articles to be projected (if it's not empty)
        mAdapter.clear();
        if (articles != null && !articles.isEmpty()) {
            mAdapter.addAll(articles);
        }
        if (mSwipeRefreshLayout.isRefreshing()){mSwipeRefreshLayout.setRefreshing(false);}
    }


    /**
     * This method is called when a menu is created (in this instance on the ActionBar
     * It sets up the menu as well as other components that require setup (in this case just the searchView initialization)
     */
    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the options menu from XML
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.toolbar_menu, menu);
        // Get the SearchView and set the searchable configuration
        SearchManager searchManager = (SearchManager) getSystemService(Context.SEARCH_SERVICE);
        SearchView searchView = (SearchView) menu.findItem(R.id.search).getActionView();
        // Redirects searches originating from searchView to SearchActivity
        ComponentName cn = new ComponentName(this, SearchActivity.class);
        if (searchManager != null) {
            searchView.setSearchableInfo(searchManager.getSearchableInfo(cn));
        }
        // Makes sure that search expands correctly when icon is clicked
        searchView.setIconifiedByDefault(false);
        return true;

    }

    /**
     * If the ArticleLoader is reset, so should the ArticleAdapter
     */
    @Override
    public void onLoaderReset(@NonNull Loader<List<Article>> loader) {
        mAdapter.clear();
    }


}