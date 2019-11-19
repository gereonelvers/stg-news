package com.elvers.gereon.stgnewsapp1;

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
import android.support.v4.app.LoaderManager;
import android.support.v4.content.Loader;
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

import org.json.JSONException;

import java.util.ArrayList;
import java.util.Arrays;
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

    // Tag for log messages
    private static final String LOG_TAG = MainActivity.class.getSimpleName();

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
    Integer pageNumber;
    TextView pageNumberTV;
    String categoryJSONString;
    Menu drawerMenu;
    NavigationView navigationView;
    ArrayList<String> favoritesArray;
    boolean isFavoriteSelected;
    private ArticleAdapter mAdapter;
    private DrawerLayout mDrawerLayout;

    /**
     * onCreate() is called when the Activity is launched.
     */
    @TargetApi(Build.VERSION_CODES.JELLY_BEAN)
    @SuppressLint("SetTextI18n")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        final SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(this);

        // set night mode state for app
        AppCompatDelegate.setDefaultNightMode(sharedPreferences.getBoolean("dark_mode", false) ? AppCompatDelegate.MODE_NIGHT_YES : AppCompatDelegate.MODE_NIGHT_NO);

        Utils.updateNightMode(this);

        super.onCreate(savedInstanceState);
        // Setting XML base layout
        setContentView(R.layout.activity_main);

        // Finding loading indicator in layout
        loadingIndicator = findViewById(R.id.loading_circle);

        /*Initializing filterParam so it can be concatenated with WP_REQUEST_URL even if no filter is applied (would be "null" otherwise)*/
        filterParam = "";

        // Getting numberOfArticlesParam from SharedPreferences (default: 10; modifiable through Preferences). This is the number of articles requested from the backend.
        numberOfArticlesParam = sharedPreferences.getString("post_number", "10");

        // Setting up Actionbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        final ActionBar actionbar = getSupportActionBar();
        if (actionbar != null) {
            actionbar.setDisplayHomeAsUpEnabled(true);
            if(AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
                actionbar.setHomeAsUpIndicator(R.drawable.ic_menu_dark);
            } else {
                actionbar.setHomeAsUpIndicator(R.drawable.ic_menu_light);
            }
            actionbar.setTitle(R.string.app_name);
        }

        // Setting up DrawerLayout
        mDrawerLayout = findViewById(R.id.drawer_layout);
        navigationView = findViewById(R.id.nav_view);
        drawerMenu = navigationView.getMenu();

        categoryJSONString = sharedPreferences.getString("categoryJSONString", "[{\"id\":1,\"count\":5,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/andere\\/\",\"name\":\"Andere\",\"slug\":\"andere\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/1\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=1\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":12,\"count\":1,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/damals\\/\",\"name\":\"Damals\",\"slug\":\"damals\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/12\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=12\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":7,\"count\":3,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/interviews\\/\",\"name\":\"Interviews\",\"slug\":\"interviews\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/7\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=7\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":5,\"count\":0,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/fahrten\\/\",\"name\":\"Klassenfahrten\",\"slug\":\"fahrten\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/5\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=5\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":4,\"count\":2,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/kultur\\/\",\"name\":\"Kultur\",\"slug\":\"kultur\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/4\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=4\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":11,\"count\":2,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/lehrer\\/\",\"name\":\"Lehrerportraits\",\"slug\":\"lehrer\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/11\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=11\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":8,\"count\":1,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/meinung\\/\",\"name\":\"Nachgedacht - Ansichtssache\",\"slug\":\"meinung\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/8\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=8\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":6,\"count\":0,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/sv\\/\",\"name\":\"News der SV\",\"slug\":\"sv\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/6\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=6\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":3,\"count\":0,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/sport\\/\",\"name\":\"Sport\",\"slug\":\"sport\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/3\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=3\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":2,\"count\":1,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/unser-redaktionsteam\\/\",\"name\":\"Unser Redaktionsteam\",\"slug\":\"unser-redaktionsteam\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/2\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=2\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}}]");
        String currentCategoryJSONString = Utils.getCategories();
        if (!currentCategoryJSONString.equals(categoryJSONString) && !currentCategoryJSONString.equals("") && !currentCategoryJSONString.isEmpty()) {
            categoryJSONString = currentCategoryJSONString;
            sharedPreferences
                    .edit()
                    .putString("categoryJSONString", categoryJSONString)
                    .apply();
        }
        try {
            Utils.createMenu(categoryJSONString, navigationView.getMenu(), navigationView, mDrawerLayout);
        } catch (JSONException e) {
            Log.e(LOG_TAG, "Failed to create menu from JSON");
        }

        navigationView.setCheckedItem(-1);

        navigationView.setNavigationItemSelectedListener(new NavigationView.OnNavigationItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem menuItem) {
                navigationView.setCheckedItem(menuItem);
                int menuItemItemId = menuItem.getItemId();
                if (menuItem.getItemId() == -1) {
                    filterParam = "";
                    if (actionbar != null) {
                        actionbar.setTitle(getString(R.string.app_name));
                    }
                    isFavoriteSelected = false;
                }
                // Favorite articles
                else if (menuItem.getTitle().equals(getString(R.string.favorites_title))) {
                    isFavoriteSelected = true;
                    filterParam = "";
                    String favoritesString = sharedPreferences.getString("favorites", "");
                    favoritesArray = null;
                    if (favoritesString != null) {
                        favoritesArray = new ArrayList<>(Arrays.asList(favoritesString.split(",")));
                    }
                    if (actionbar != null) {
                        actionbar.setTitle(getString(R.string.favorites_title));
                    }
                    pageNumber = 1;
                    pageNumberTV.setText(pageNumber.toString());

                } else {
                    filterParam = Integer.toString(menuItemItemId);
                    isFavoriteSelected = false;
                    if (actionbar != null) {
                        actionbar.setTitle(menuItem.getTitle());
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

        // Inflate page picker and add below ListView
        @SuppressLint("InflateParams")
        View pagePicker = LayoutInflater.from(this).inflate(R.layout.page_picker, null, false);
        articleListView.addFooterView(pagePicker);

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
                    Log.e(LOG_TAG, "How did you even do this? OutOfBounds in MainActivity onItemClick");
                }
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
     * Recreate activity when returning to the MainActivity. This is necessary to make sure the right theme is set and data is up to date when returning to the Activity
     */
    @Override
    public void onRestart() {
        Utils.updateNightMode(this);
        super.onRestart();
        recreate(); // will also update content
    }


    /**
     * This method is called when creating a new ArticleLoader. It creates a modified query URL (by adding the filter parameters listed below) and initializes the ArticleLoader.
     * <p>
     * Parameters:
     * {@param filterParam} is a String containing the id of the category requested (if present)
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

        if (!filterParam.isEmpty()) {
            uriBuilder.appendQueryParameter("categories", filterParam);
        }
        if (!numberOfArticlesParam.isEmpty()) {
            uriBuilder.appendQueryParameter("per_page", numberOfArticlesParam);
        }
        if (isFavoriteSelected) {
            for (int j = 0; j < favoritesArray.size(); j++) {
                uriBuilder.appendQueryParameter("include[]", favoritesArray.get(j));
            }
        }
        uriBuilder.appendQueryParameter("page", pageNumber.toString());
        Log.e("Query URI: ", uriBuilder.toString());
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

        if (pageNumber == 1) {
            emptyView.setText(R.string.no_articles);
        } else {
            emptyView.setText(R.string.no_articles_page);
        }

        // Clears the ArticleAdapter to allow the new array of Articles to be projected (if it's not empty)
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