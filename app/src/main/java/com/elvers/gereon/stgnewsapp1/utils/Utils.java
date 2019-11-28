package com.elvers.gereon.stgnewsapp1.utils;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import android.preference.PreferenceManager;
import android.support.design.widget.NavigationView;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.AppCompatDelegate;
import android.util.Log;
import android.view.Menu;

import com.elvers.gereon.stgnewsapp1.R;
import com.elvers.gereon.stgnewsapp1.api.Article;
import com.elvers.gereon.stgnewsapp1.api.AuthorResponse;
import com.elvers.gereon.stgnewsapp1.api.CategoryResponse;
import com.elvers.gereon.stgnewsapp1.api.Comment;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.RequestBody;
import com.squareup.okhttp.Response;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.net.URL;
import java.text.ParsePosition;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;


/**
 * Utils is a class responsible for holding static variables and methods used by multiple Activities that don't need to be contained within them.
 * This makes future edits easier as it centralizes methods and maximizes code reusability
 *
 * @author Gereon Elvers
 */
public final class Utils {

    // Tag for log messages
    private static final String LOG_TAG = Utils.class.getSimpleName();

    // DateFormat used inside server responses
    private static final SimpleDateFormat wpDateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.GERMAN);

    // Cached API responses
    public static CategoryResponse categoryResponse = null;
    public static AuthorResponse authorResponse = null;

    // Static request URL the list of authors will be requested from. Putting it at the top like this allows easier modification of top level domain if required.
    private static final String AUTHOR_REQUEST_URL = "https://stg-sz.net/wp-json/wp/v2/users?per_page=100";
    private static final String BASE_REQUEST_URL = "stg-sz.net";

    /**
     * Create a private Utils constructor to prevent creation of a Utils object. This class is only meant to hold static variables and methods, it should not be called as an object!
     */
    private Utils() {
    }

    /**
     * Query the WordPress site and return a list of {@link Article} objects.
     */
    public static List<Article> fetchArticles(String requestUrl) {
        // Create URL object
        URL url = createUrl(requestUrl);

        // Perform HTTP request to the URL and receive a JSON response back
        String jsonResponse = "";
        try {
            jsonResponse = makeHttpGetRequest(url);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Problem making the HTTP request: " + e.toString());
            e.printStackTrace();
        }

        if (jsonResponse.isEmpty())
            return null;

        // Extract relevant fields from the JSON response and create a list of {@link Article}s. Return it.
        return extractArticleFeaturesFromJson(jsonResponse);
    }

    /**
     * Query the WordPress site and return a list of {@link Comment} objects.
     */
    public static List<Comment> fetchComments(String requestUrl) {
        // Create URL object
        URL url = createUrl(requestUrl);

        // Perform HTTP request to the URL and receive a JSON response back
        String jsonResponse = "";
        try {
            jsonResponse = makeHttpGetRequest(url);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Problem making the HTTP request: " + e.toString());
            e.printStackTrace();
        }

        if (jsonResponse.isEmpty())
            return null;

        // Extract relevant fields from the JSON response and create a list of {@link Article}s. Return it.
        return extractCommentFeaturesFromJson(jsonResponse);
    }

    /**
     * Returns new URL object from the given string URL.
     */
    private static URL createUrl(String stringUrl) {
        URL url = null;
        try {
            url = new URL(stringUrl);
        } catch (Exception e) {
            Log.e(LOG_TAG, "Problem building the URL: " + e.toString());
            e.printStackTrace();
        }
        return url;
    }

    /**
     * Make an HTTP request to the given URL and return the response as a String.
     */
    private static String makeHttpGetRequest(URL url) throws IOException {
        String jsonResponse;
        OkHttpClient client = new OkHttpClient();
        Request request = new Request.Builder().url(url).build();
        jsonResponse = client.newCall(request).execute().body().string();
        return jsonResponse;
    }

    /**
     * Return a list of {@link Article} objects that has been built up from
     * parsing the given JSON response.
     * This method should not be called from the ui thread, because it could perform a web request, which might block the ui thread
     */
    private static List<Article> extractArticleFeaturesFromJson(String articleJSON) {
        List<Article> articles = new ArrayList<>();

        try {
            JSONArray array = new JSONArray(articleJSON);
            // This loop iterates over the array to parse the JSONArray into an array of articles
            for (int i = 0; i < array.length(); i++) {

                // Get current Article from Array
                JSONObject article = array.getJSONObject(i);

                // Get WordPress Article ID
                int id = article.getInt("id");

                // Get article URL
                String urlString = article.getString("link");

                // Get article title
                String titleString = article.getJSONObject("title").getString("rendered");

                // Get article author
                String authorString = getAuthorName(article.getInt("author"));

                // Get article date
                String dateStringInput = article.getString("date");

                Date articleDate = null;
                try {
                    articleDate = wpDateFormat.parse(dateStringInput, new ParsePosition(0));
                } catch (Exception e) {
                    Log.e(LOG_TAG, "Error parsing dateString into format: " + e.toString());
                    e.printStackTrace();
                }
                SimpleDateFormat outputFormat = new SimpleDateFormat("dd.MM.yyyy, HH:mm", Locale.getDefault());
                String dateString = outputFormat.format(articleDate);

                /* Get article cover image URL
                 * This code block either gets the highest fixed resolution image URL or the original source image URL depending on whether or not isHighRes is true.
                 */
                Context mContext = ContextApp.getContext();
                SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mContext);
                boolean isHighRes = prefs.getBoolean("high_resolution", false);
                String imageUrlString = "";
                JSONObject imgObj = null;
                try {
                    JSONObject betterFeaturedImage = article.getJSONObject("better_featured_image");
                    if (!isHighRes) {
                        JSONObject media_details = betterFeaturedImage.getJSONObject("media_details");
                        JSONObject sizes = media_details.getJSONObject("sizes");
                        try {
                            imgObj = sizes.getJSONObject("large");
                        } catch (Exception e) {
                            Log.i(LOG_TAG, "Failed to get large image");
                        }
                        try {
                            if (imgObj == null) {
                                imgObj = sizes.getJSONObject("medium");
                            }
                        } catch (Exception e) {
                            Log.i(LOG_TAG, "Failed to get medium image");
                        }
                        try {
                            if (imgObj == null) {
                                imgObj = sizes.getJSONObject("thumbnail");
                            }
                        } catch (Exception e) {
                            Log.i(LOG_TAG, "Failed to get thumbnail image");
                        }
                    } else {
                        imgObj = betterFeaturedImage;
                    }

                    if (imgObj != null) {
                        imageUrlString = imgObj.getString("source_url");
                    }

                } catch (Exception e) {
                    Log.e(LOG_TAG, "IMG Conversion for article " + i + " Can't parse img through betterFeaturedImage: " + e.toString());
                    e.printStackTrace();
                }

                if (categoryResponse == null)
                    updateCategories();

                StringBuilder categoryString = new StringBuilder();
                boolean isFirstCategory = true;

                JSONArray articleCategoryArray = article.getJSONArray("categories");
                for (int j = 0; j < articleCategoryArray.length(); j++) {
                    int targetCategoryId = articleCategoryArray.getInt(j);
                    CategoryResponse.Category category = categoryResponse.getCategoryById(targetCategoryId);
                    if (category != null) {
                        if (isFirstCategory) {
                            categoryString.append(category.name);
                            isFirstCategory = false;
                        } else {
                            categoryString.append(", ").append(category.name);
                        }
                    }
                }

                // After the individual parts of the Article are retrieved individually, they are parsed into an Article object and added to the array
                articles.add(new Article(id, titleString, authorString, dateString, urlString, imageUrlString, categoryString.toString()));
            }
        } catch (Exception e) {
            Log.e(LOG_TAG, "Problem parsing article JSON: " + e.toString());
            e.printStackTrace();
        }
        return articles;
    }

    /**
     * Return a list of {@link Comment} objects that has been built up from
     * parsing the given JSON response.
     */
    private static List<Comment> extractCommentFeaturesFromJson(String commentJSON) {
        List<Comment> comments = new ArrayList<>();

        // Check for empty JSON response
        try {
            JSONArray rawComments = new JSONArray(commentJSON);
            // This loop iterates over the rawComments to parse the JSONArray into an rawComments of Comments
            for (int i = 0; i < rawComments.length(); i++) {

                // Get current Comment from Array
                JSONObject currentComment = rawComments.getJSONObject(i);

                // Get WordPress Comment ID
                int id = currentComment.getInt("id");

                // Get comment author
                String authorString = currentComment.getString("author_name");

                // Get article date
                String dateStringInput = currentComment.getString("date");
                Date articleDate = null;
                try {
                    articleDate = wpDateFormat.parse(dateStringInput, new ParsePosition(0));
                } catch (Exception e) {
                    Log.e(LOG_TAG, "Error parsing dateString into format: " + e.toString());
                    e.printStackTrace();
                }
                SimpleDateFormat outputFormatDate = new SimpleDateFormat("dd.MM.yyyy", Locale.getDefault());
                SimpleDateFormat outputFormatTime = new SimpleDateFormat("HH:mm", Locale.getDefault());
                String dateString = outputFormatDate.format(articleDate);
                String timeString = outputFormatTime.format(articleDate);

                JSONObject content = currentComment.getJSONObject("content");
                String contentString = content.getString("rendered");


                // After the individual parts of the Article are retrieved individually, they are parsed into an Article object and added to the rawComments
                comments.add(new Comment(id, authorString, dateString, timeString, contentString));
            }
        } catch (Exception e) {
            Log.e(LOG_TAG, "Problem parsing comment JSON: " + e.toString());
            e.printStackTrace();
        }
        return comments;
    }

    /**
     * Since the WordPress API only provides author ID (not the complete name), the process to retrieve names is a little more intricate, which is why it's moved into a separate method.
     * <p>
     * To get he author name, an array of authors and their respective IDs is requested from the backend. Since this process is resource intensive, it is only done once (in updateAuthors())
     * The array is then stored as AuthorResponse. extractArticleFeaturesFromJson() then retrieves the author ID from currentArticle and iterates against authorResponse until a match is found.
     * <p>
     * This method should not be called from the ui thread, because it could perform a web request, which might block the ui thread
     */
    private static String getAuthorName(int authorID) {
        // Fill authorsArray with author data (if it's empty)
        if (authorResponse == null) {
            updateAuthors();
        }

        // Iterate over authorsResponse until the author ID of currentArticle matches the changing ID of the authors in authorsResponse
        for (int i = 0; i < authorResponse.getAuthors().size(); i++) {
            AuthorResponse.Author author = authorResponse.getAuthors().get(i);
            if (author.id == authorID) {
                return author.name;
            }
        }

        return "";
    }

    /**
     * Request an array of authors from AUTHOR_REQUEST_URL which will be cached inside authorResponse to achieve faster loading times
     * Necessary to correctly display author name in article listview
     */
    private static void updateAuthors() {
        URL url = createUrl(AUTHOR_REQUEST_URL);
        String jsonResponse = null;
        try {
            jsonResponse = makeHttpGetRequest(url);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Problem making the HTTP request: " + e.toString());
            e.printStackTrace();
        }
        try {
            authorResponse = new AuthorResponse(jsonResponse);
        } catch (JSONException e) {
            Log.e(LOG_TAG, "Error parsing author info: " + e.toString());
            e.printStackTrace();
        }
    }

    /**
     * This is the method that gets called when a comment is submitted through CreateCommentActivity.
     * It handles posting said comment and returns a http status code.
     */
    public static int sendComment(String id, String authorName, String authorEmail, String content) throws IOException {
        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder.scheme("https");
        uriBuilder.authority(BASE_REQUEST_URL);
        uriBuilder.appendPath("wp-json").appendPath("wp").appendPath("v2").appendPath("comments");
        uriBuilder.appendQueryParameter("post", id)
                .appendQueryParameter("author_name", authorName)
                .appendQueryParameter("author_email", authorEmail)
                .appendQueryParameter("content", content);
        URL url = createUrl(uriBuilder.toString());
        return makeHttpPostRequest(url);
    }

    /**
     * Make an HTTP request to the given URL and return the response as String.
     */
    private static int makeHttpPostRequest(URL url) throws IOException {
        int responseCode = 0;

        // If the URL is null, then return an early response. No need to delay or cause IOException here.
        if (url == null) {
            return responseCode;
        }
        OkHttpClient client = new OkHttpClient();
        RequestBody requestBody = RequestBody.create(null, new byte[0]);
        Request.Builder requestBuilder = new Request.Builder()
                .url(url)
                .method("POST", requestBody)
                .header("Content-Length", "");
        Request request = requestBuilder.build();
        responseCode = client.newCall(request).execute().code();
        return responseCode;
    }

    /**
     * Request an array of categories which will be cached inside categoryResponse to achieve faster loading times
     */
    public static CategoryResponse updateCategories() {
        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder
                .scheme("http") // use http here for less request time TODO should be overridable by some option called "force https"
                .authority(BASE_REQUEST_URL)
                .appendPath("wp-json")
                .appendPath("wp")
                .appendPath("v2")
                .appendPath("categories")
                .appendQueryParameter("per_page", "100");
        URL requestURL = createUrl(uriBuilder.toString());
        OkHttpClient client = new OkHttpClient();
        final Request request = new Request.Builder().url(requestURL).build();
        try {
            Response response = client.newCall(request).execute();
            categoryResponse = new CategoryResponse(response.body().string());
            int count = Integer.parseInt(response.header("x-wp-total"));
            if (count > 100) {
                Log.e(LOG_TAG, "Could not get all categories (total of " + count + ")");
            }
        } catch (Exception e) {
            Log.e(LOG_TAG, "Failed to get categories from server: " + e.toString());
            e.printStackTrace();
        }
        return categoryResponse;
    }

    /**
     * Fills the navigationMenu with category filter items
     */
    public static void createCategoryMenu(Menu navigationMenu, NavigationView navigationView, DrawerLayout drawerLayout) {
        if (categoryResponse != null) { // if there was no category request, don't fill in the items; DON'T perform the request, because of potentially blocking the ui thread
            navigationMenu.add(R.id.mainGroup, -2, 0, R.string.favorites_title);
            navigationMenu.getItem(0).setCheckable(true);
            navigationMenu.add(R.id.mainGroup, -1, 1, ContextApp.getApplication().getResources().getString(R.string.all_articles_cat));
            navigationMenu.getItem(1).setCheckable(true);
            for (int i = 0; i < categoryResponse.getCategories().size(); i++) {
                CategoryResponse.Category category = categoryResponse.getCategories().get(i);
                navigationMenu.add(/*Group ID*/R.id.mainGroup, /*itemID*/category.id, /*Order*/i + 2, /*name*/category.name);
                navigationMenu.getItem(i + 2).setCheckable(true);
            }

            navigationView.invalidate();
            drawerLayout.invalidate();
            drawerLayout.requestLayout();
        } else {
            Log.e(LOG_TAG, "Failed to create category menu: no category response");
        }
    }

    /**
     * Sets the theme of the activity based on the current night mode setting
     *
     * @param activity activity to update
     */
    public static void updateNightMode(Activity activity) {
        if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
            activity.setTheme(R.style.AppThemeDark);
        } else {
            activity.setTheme(R.style.AppTheme);
        }
    }

    /**
     * Sets night mode state which is used to determine which theme should be used for all activities
     */
    public static void updateGlobalNightMode(Activity activity) {
        AppCompatDelegate.setDefaultNightMode(PreferenceManager.getDefaultSharedPreferences(activity).getBoolean("dark_mode", false) ? AppCompatDelegate.MODE_NIGHT_YES : AppCompatDelegate.MODE_NIGHT_NO);
    }

}