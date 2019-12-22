package com.elvers.gereon.stgnewsapp1.activities;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.SearchManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.design.widget.NavigationView;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.app.AppCompatDelegate;
import android.support.v7.widget.SearchView;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.TextView;

import com.elvers.gereon.stgnewsapp1.R;
import com.elvers.gereon.stgnewsapp1.adapter.ArticleAdapter;
import com.elvers.gereon.stgnewsapp1.api.Article;
import com.elvers.gereon.stgnewsapp1.api.CategoryResponse;
import com.elvers.gereon.stgnewsapp1.handlers.IArticlesLoadedHandler;
import com.elvers.gereon.stgnewsapp1.handlers.ICategoriesLoadedHandler;
import com.elvers.gereon.stgnewsapp1.tasks.LoadArticlesTask;
import com.elvers.gereon.stgnewsapp1.tasks.LoadCategoriesTask;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

import java.util.ArrayList;
import java.util.List;

/**
 * Main Activity of the App. This contains all functionality included in the main screen
 * This includes the main ListView (in a SwipeRefreshLayout) as well as a DrawerLayout
 *
 * @author Gereon Elvers
 */
public class MainActivity extends AppCompatActivity implements SharedPreferences.OnSharedPreferenceChangeListener, IArticlesLoadedHandler, ICategoriesLoadedHandler { //TODO if user refreshes content, categories should also be updated

    /**
     * Static request URL (modifiers will append to this)
     * Modifiers:
     * {@param filterParam} for category filtering
     * {@param numberOfArticlesParam} for changing the number of posts requested
     */
    private static final String WP_REQUEST_URL = "www.stg-sz.net";

    /* There are a lot of items declared outside of individual methods here.
    This is done because they are required to be available across methods and it's more economical to simply initialize them onCreate() */
    SwipeRefreshLayout mSwipeRefreshLayout;
    ListView articleListView;
    TextView emptyView;
    View loadingIndicator;
    String filterParam;
    String numberOfArticlesParam;
    Integer pageNumber;
    TextView pageNumberTV;
    Menu drawerMenu;
    NavigationView navigationView;
    boolean isFavoriteSelected;
    private ArticleAdapter mAdapter;
    private DrawerLayout mDrawerLayout;
    private ActionBar actionBar;
    private SharedPreferences sharedPreferences;

    /**
     * onCreate() is called when the Activity is launched.
     */
    @TargetApi(Build.VERSION_CODES.JELLY_BEAN)
    @SuppressLint("SetTextI18n")
    @Override
    protected void onCreate(final Bundle savedInstanceState) {
        sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);
        sharedPreferences.registerOnSharedPreferenceChangeListener(this);

        // set night mode state for app
        Utils.updateGlobalNightMode(this);

        // update activity theme based on night mode option
        Utils.updateNightMode(this);

        super.onCreate(savedInstanceState);
        // Setting XML base layout
        setContentView(R.layout.activity_main);

        // Finding loading indicator in layout
        loadingIndicator = findViewById(R.id.loading_circle);

        // Initializing filterParam so it can be concatenated with WP_REQUEST_URL even if no filter is applied (would be "null" otherwise)
        filterParam = "";

        // Getting numberOfArticlesParam from SharedPreferences (default: 10; modifiable through Preferences). This is the number of articles requested from the backend.
        numberOfArticlesParam = sharedPreferences.getString("post_number", "10");

        // Setting up ActionBar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.setDisplayHomeAsUpEnabled(true);
            if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
                actionBar.setHomeAsUpIndicator(R.drawable.ic_menu_dark);
            } else {
                actionBar.setHomeAsUpIndicator(R.drawable.ic_menu_light);
            }
            actionBar.setTitle(R.string.app_name);
        }

        // Setting up DrawerLayout
        mDrawerLayout = findViewById(R.id.drawer_layout);
        navigationView = findViewById(R.id.nav_view);
        drawerMenu = navigationView.getMenu();

        navigationView.setNavigationItemSelectedListener(new NavigationView.OnNavigationItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem menuItem) {
                pageNumber = 1;
                displayContentByMenuItem(menuItem);
                return true;
            }
        });

        // EmptyView (The message that is shown when ListView is empty) is initialized and set on ListView
        emptyView = findViewById(R.id.empty_view);
        articleListView = findViewById(R.id.article_list_view);
        articleListView.setEmptyView(emptyView);

        // Inflate page picker and add below ListView
        @SuppressLint("InflateParams")
        View pagePicker = LayoutInflater.from(this).inflate(R.layout.page_picker, null, false);
        articleListView.addFooterView(pagePicker);

        // Initialize page number TextView and set initial value
        pageNumber = 1;
        pageNumberTV = findViewById(R.id.page_number_tv);
        pageNumberTV.setText(pageNumber.toString());

        // Start loading categories
        new LoadCategoriesTask(this).execute();

        // Implement page back-button
        ImageView backIV = findViewById(R.id.back_iv);
        backIV.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (pageNumber > 1) {
                    pageNumber--;
                    pageNumberTV.setText(pageNumber.toString());
                    displayContentByMenuItem(navigationView.getCheckedItem());
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
                displayContentByMenuItem(navigationView.getCheckedItem());
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

        // Start loading Article objects into listView
        initLoaderListView();
    }

    /**
     * This method displays articles inside the article listview depending on the menu item (-> category)
     */
    private void displayContentByMenuItem(MenuItem menuItem) {
        navigationView.setCheckedItem(menuItem);
        int menuItemItemId = menuItem.getItemId();
        if (menuItem.getItemId() == -1) { // All articles
            filterParam = "";
            if (actionBar != null) {
                actionBar.setTitle(getString(R.string.app_name));
            }
            isFavoriteSelected = false;
        }
        // Favorite articles
        else if (menuItem.getItemId() == -2) {
            isFavoriteSelected = true;
            filterParam = "";
            if (actionBar != null) {
                actionBar.setTitle(getString(R.string.favorites_title));
            }

        } else { // A category
            filterParam = Integer.toString(menuItemItemId);
            isFavoriteSelected = false;
            if (actionBar != null) {
                actionBar.setTitle(menuItem.getTitle());
            }
        }
        pageNumberTV.setText(String.valueOf(pageNumber));
        refreshListView();
        mDrawerLayout.closeDrawers();
    }

    /**
     * This method is called when performing a refresh of the ListView while the Layout remains visible
     * It dumps the old Adapter and makes corrects the visibility of loadingIndicator and emptyView so make the user aware that new data is about to appear
     * This works even if there is no old data
     */
    public void refreshListView() {
        if (mAdapter != null)
            mAdapter.clear();
        loadingIndicator.setVisibility(View.VISIBLE);
        initLoaderListView();
        emptyView.setVisibility(View.INVISIBLE);
    }

    /**
     * This is the method actually loading the data and projecting it onto the ListView. It creates a new Adapter and sets it on the ListView
     * It also creates an OnItemClickListener that's set on the Articles projected onto the ListView and opens ArticleActivity when clicked
     * Lastly it destroys (if necessary)
     */
    public void initLoaderListView() {
        // init loader listview
        mAdapter = new ArticleAdapter(this, new ArrayList<Article>());
        articleListView.setAdapter(mAdapter);
        articleListView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> adapterView, View view, int i, long l) {
                if (mAdapter.getCount() > i) {
                    Article currentArticle = mAdapter.getItem(i);
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

        startFetchingArticles();
    }

    private void startFetchingArticles() {
        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder.scheme("https");
        uriBuilder.authority(WP_REQUEST_URL);
        uriBuilder.appendPath("wp-json").appendPath("wp").appendPath("v2").appendPath("posts");

        if (!filterParam.isEmpty()) {
            uriBuilder.appendQueryParameter("categories", filterParam);
        }
        if (!numberOfArticlesParam.isEmpty()) {
            uriBuilder.appendQueryParameter("per_page", numberOfArticlesParam);
        }
        if (isFavoriteSelected) {
            for(String fav : sharedPreferences.getString("favorites", "").split(",")) {
                uriBuilder.appendQueryParameter("include[]", fav);
            }
        }
        uriBuilder.appendQueryParameter("page", pageNumber.toString());
        Log.e("Query URI: ", uriBuilder.toString());

        new LoadArticlesTask(this).execute(uriBuilder.toString());
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

            // Refresh button
            case R.id.refresh:
                refreshListView();
                return true;

            case R.id.login:
                Intent loginIntent = new Intent(Intent.ACTION_VIEW);
                loginIntent.setData(Uri.parse("https://stg-sz.net/login"));
                startActivity(loginIntent);
                return true;

            case R.id.school_page:
                Intent schoolIntent = new Intent(Intent.ACTION_VIEW);
                schoolIntent.setData(Uri.parse("http://stg-segeberg.de"));
                startActivity(schoolIntent);
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
     * This method is called when a menu is created (in this instance on the ActionBar)
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
     * Adds cached categories to the navigation view
     */
    private void displayCachedCategories() {
        navigationView.getMenu().clear(); // remove all items
        Utils.createCategoryMenu(navigationView.getMenu(), navigationView, mDrawerLayout);
        navigationView.setCheckedItem(-1);
    }

    /**
     * update the current activity theme if dark mode settings changed
     */
    @Override
    public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
        if(key.equals("dark_mode")) {
            recreate();
        }
    }

    @Override
    public void onArticlesFetched(List<Article> articles) {
        // Once the load process is finished, the loadingIndicator circle should disappear
        loadingIndicator.setVisibility(View.GONE);

        // EmptyView is only visible if mAdapter is empty
        if (pageNumber == 1) {
            emptyView.setText(R.string.no_articles);
        } else {
            emptyView.setText(R.string.no_articles_page);
        }

        mAdapter.clear();
        if (articles == null || articles.isEmpty()) {
            emptyView.setText(articles == null ? R.string.no_articles_network : R.string.no_articles);
            emptyView.setOnClickListener(new View.OnClickListener() {
                @SuppressLint("SetTextI18n")
                @Override
                public void onClick(View v) {
                    if (pageNumber > 1) {
                        pageNumber--;
                        pageNumberTV.setText(pageNumber.toString());
                    }
                    refreshListView();
                }
            });
        } else {
            mAdapter.addAll(articles);
        }

        if (mSwipeRefreshLayout.isRefreshing()) {
            mSwipeRefreshLayout.setRefreshing(false);
        }
    }

    @Override
    public void onCategoriesFetched(List<CategoryResponse.Category> categories) {
        displayCachedCategories();
    }

}