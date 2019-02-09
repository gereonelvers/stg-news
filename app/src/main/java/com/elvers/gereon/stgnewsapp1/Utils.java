package com.elvers.gereon.stgnewsapp1;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import android.preference.PreferenceManager;
import android.support.design.widget.NavigationView;
import android.support.v4.widget.DrawerLayout;
import android.util.Log;
import android.view.Menu;

import com.squareup.okhttp.Callback;
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
 * Utils is a class responsible for holding static variables and methods used by multiples Activities that don't need to be contained within them.
 * This makes future edits easier as it centralizes methods and maximizes code reusability
 *
 * @author Gereon Elvers
 */
final class Utils {

    // Tag for log messages
    private static final String LOG_TAG = Utils.class.getSimpleName();

    // Static request URL the list of authors will be requested from. Putting it at the top like this allows easier modification of top level domain if required.
    private static final String AUTHOR_REQUEST_URL = "http://stg-sz.net/wp-json/wp/v2/users/";
    private static final String BASE_REQUEST_URL = "stg-sz.net";
    private static JSONArray authorsArray;
    private static String categoryResponse = "";

    /**
     * Create a private Utils constructor to prevent creation of a Utils object. This class is only meant to hold static variables and methods, it should not be called as an object!
     */
    private Utils(){}

    /**
     * Query the WordPress site and return a list of {@link Article} objects.
     */
    static List<Article> fetchArticleData(String requestUrl) {
        // Create URL object
        URL url = createUrl(requestUrl);

        // Perform HTTP request to the URL and receive a JSON response back
        String jsonResponse = "";
        try {
            jsonResponse = makeHttpGetRequest(url);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Problem making the HTTP request.");
        }

        // Extract relevant fields from the JSON response and create a list of {@link Article}s. Return it.
        return extractArticleFeaturesFromJson(jsonResponse);
    }

    /**
     * Query the WordPress site and return a list of {@link Comment} objects.
     */
    static List<Comment> fetchCommentData(String requestUrl) {
        // Create URL object
        URL url = createUrl(requestUrl);

        // Perform HTTP request to the URL and receive a JSON response back
        String jsonResponse = "";
        try {
            jsonResponse = makeHttpGetRequest(url);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Problem making the HTTP request.");
        }

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
            Log.e(LOG_TAG, "Problem building the URL ");
        }
        return url;
    }

    /**
     * Make an HTTP request to the given URL and return a String as the response.
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
     */
    private static List<Article> extractArticleFeaturesFromJson(String articleJSON){
        // Check for empty JSON response
        if(articleJSON.isEmpty()){
            return null;
        }

        List<Article> articles = new ArrayList<>();
        authorsArray = null;

        try {
            JSONArray articleArray = new JSONArray(articleJSON);
            /* This loop iterates over the articleArray to parse the JSONArray into an array of articles */
            for(int i = 0; i<articleArray.length(); i++){

                // Get current Article from Array
                JSONObject currentArticle = articleArray.getJSONObject(i);

                // Get WordPress Article ID
                int id = currentArticle.getInt("id");

                // Get article URL
                String urlString = currentArticle.getString("link");

                // Get article title
                JSONObject title = currentArticle.getJSONObject("title");
                String titleString = title.getString("rendered");

                // Get article author
                int authorID = currentArticle.getInt("author");
                String authorString = getAuthorName(authorID);

                // Get article date
                String dateStringInput = currentArticle.getString("date");
                ParsePosition p = new ParsePosition(0);
                SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.GERMAN);
                Date articleDate = null;
                try {
                    articleDate = inputFormat.parse(dateStringInput, p);
                } catch (Exception e) {
                    Log.e(LOG_TAG,"Error parsing dateString into format");
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
                    JSONObject betterFeaturedImage = currentArticle.getJSONObject("better_featured_image");
                    if (!isHighRes) {
                    JSONObject media_details = betterFeaturedImage.getJSONObject("media_details");
                    JSONObject sizes = media_details.getJSONObject("sizes");
                    try{
                    imgObj = sizes.getJSONObject("large"); }
                    catch (Exception e){
                        Log.i(LOG_TAG, "Failed to get large image");
                    }
                    try {
                        if (imgObj == null) {
                            imgObj = sizes.getJSONObject("medium");
                        }
                    }
                    catch (Exception e){
                        Log.i(LOG_TAG, "Failed to get medium image");
                    }
                    try {
                        if (imgObj == null) {
                            imgObj = sizes.getJSONObject("thumbnail");
                            }
                        }
                    catch (Exception e){
                        Log.i(LOG_TAG, "Failed to get thumbnail image");
                        }
                    }
                    else {
                        imgObj = betterFeaturedImage;
                        }

                    if (imgObj != null) {
                    imageUrlString = imgObj.getString("source_url");
                    }

                }
                catch (Exception e){
                    Log.e(LOG_TAG , "IMG Conversion for article " + i + " Can't parse img through betterFeaturedImage");
                }

                SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(mContext);
                JSONArray categoryJSONArray = new JSONArray(sharedPreferences.getString("categoryJSONString", "[{\"id\":1,\"count\":5,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/andere\\/\",\"name\":\"Andere\",\"slug\":\"andere\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/1\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=1\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":12,\"count\":1,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/damals\\/\",\"name\":\"Damals\",\"slug\":\"damals\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/12\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=12\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":7,\"count\":3,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/interviews\\/\",\"name\":\"Interviews\",\"slug\":\"interviews\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/7\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=7\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":5,\"count\":0,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/fahrten\\/\",\"name\":\"Klassenfahrten\",\"slug\":\"fahrten\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/5\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=5\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":4,\"count\":2,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/kultur\\/\",\"name\":\"Kultur\",\"slug\":\"kultur\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/4\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=4\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":11,\"count\":2,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/lehrer\\/\",\"name\":\"Lehrerportraits\",\"slug\":\"lehrer\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/11\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=11\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":8,\"count\":1,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/meinung\\/\",\"name\":\"Nachgedacht - Ansichtssache\",\"slug\":\"meinung\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/8\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=8\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":6,\"count\":0,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/sv\\/\",\"name\":\"News der SV\",\"slug\":\"sv\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/6\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=6\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":3,\"count\":0,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/sport\\/\",\"name\":\"Sport\",\"slug\":\"sport\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/3\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=3\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}},{\"id\":13,\"count\":0,\"description\":\"\",\"link\":\"https:\\/\\/stg-sz.net\\/posts\\/category\\/testcat1\\/\",\"name\":\"TestCat1\",\"slug\":\"testcat1\",\"taxonomy\":\"category\",\"parent\":0,\"meta\":[],\"_links\":{\"self\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\\/13\"}],\"collection\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/categories\"}],\"about\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/taxonomies\\/category\"}],\"wp:post_type\":[{\"href\":\"https:\\/\\/stg-sz.net\\/wp-json\\/wp\\/v2\\/posts?categories=13\"}],\"curies\":[{\"name\":\"wp\",\"href\":\"https:\\/\\/api.w.org\\/{rel}\",\"templated\":true}]}}]"));
                JSONArray articleCategoryArray = currentArticle.getJSONArray("categories");

                StringBuilder categoryString = new StringBuilder();
                boolean isFirstCategory = true;

                for (int q=0; q<categoryJSONArray.length(); q++) {
                    JSONObject currentCategory = categoryJSONArray.getJSONObject(q);
                    int cat1 = currentCategory.getInt("id");
                    for (int w=0; w<articleCategoryArray.length(); w++) {
                        int currentArticleCat = articleCategoryArray.getInt(w);
                        if (cat1==currentArticleCat) {
                            if (isFirstCategory) {
                                categoryString.append(currentCategory.getString("name"));
                                isFirstCategory = false;
                            } else {
                                categoryString.append(", ").append(currentCategory.getString("name"));
                            }
                        }
                    }
                }


                /* After the individual parts of the Article are retrieved individually, they are parsed into an Article object and added to the array */
                Article article = new Article(id, titleString, authorString, dateString, urlString, imageUrlString, categoryString.toString());
                articles.add(article);
            }
    }
        catch (Exception e){
            Log.e(LOG_TAG, "Problem parsing article JSON");
        }
        return articles;
    }

    private static List<Comment> extractCommentFeaturesFromJson(String commentJSON){

        if (commentJSON.isEmpty()) {
        return null;
        }

        List<Comment> comments = new ArrayList<>();

        // Check for empty JSON response
        try {
            JSONArray commentArray = new JSONArray(commentJSON);
            /* This loop iterates over the commentArray to parse the JSONArray into an array of Comments */
            for(int i = 0; i<commentArray.length(); i++){

                // Get current Comment from Array
                JSONObject currentComment = commentArray.getJSONObject(i);

                // Get WordPress Comment ID
                int id = currentComment.getInt("id");

                // Get comment author
                String authorString = currentComment.getString("author_name");

                // Get article date
                String dateStringInput = currentComment.getString("date");
                ParsePosition p = new ParsePosition(0);
                SimpleDateFormat inputFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.GERMAN);
                Date articleDate = null;
                try {
                    articleDate = inputFormat.parse(dateStringInput, p);
                } catch (Exception e) {
                    Log.e(LOG_TAG,"Error parsing dateString into format");
                }
                SimpleDateFormat outputFormatDate = new SimpleDateFormat("dd.MM.yyyy", Locale.getDefault());
                SimpleDateFormat outputFormatTime = new SimpleDateFormat("HH:mm", Locale.getDefault());
                String dateString = outputFormatDate.format(articleDate);
                String timeString = outputFormatTime.format(articleDate);

                JSONObject content = currentComment.getJSONObject("content");
                String contentString = content.getString("rendered");


                /* After the individual parts of the Article are retrieved individually, they are parsed into an Article object and added to the array */
                Comment comment = new Comment(id, authorString, dateString, timeString, contentString);
                comments.add(comment);
            }
        }
        catch (Exception e){
            Log.e(LOG_TAG, "Problem parsing comment JSON");
        }
        return comments;
    }

    /**
     * Since the WordPress API only provides author ID (not the complete name), the process to retrieve names is a little more intricate, which is why it's moved into a separate method.
     *
     * To get he author name, an array of authors and their respective IDs is requested from the backend. Since this process is resource intensive, it is only done once per request (in getAuthorData())
     * The array is then stored as authorsArray. extractArticleFeaturesFromJson() then retrieves the author ID from currentArticle and iterates against authorsArray until a match is found.
     */
    private static String getAuthorName(int authorID){
        String authorName = "";

        // Fill authorsArray with author data (if it's empty)
        if (authorsArray == null){
            getAuthorData();
        }

        // Iterate over authorsArray until currentId (the author ID of currentArticle) matches authorID (the changing ID of the authors in authorsArray)
        for(int i = 0; i<authorsArray.length(); i++){
            int currentId = 0;
            JSONObject currentAuthor = null;
            try {
                currentAuthor = authorsArray.getJSONObject(i);
                currentId = currentAuthor.getInt("id");
            } catch (Exception e){
                // This can happen if the array of authors doesn't contain an author matching the ID of the author for a certain article.
                // If that happens, ArticleAdapter will simply hide the author field
                Log.e(LOG_TAG, "Finding matching author failed");
            }
            if (currentId==authorID){
                try {
                    if (currentAuthor != null) {
                        authorName = currentAuthor.getString("name");
                    }
                } catch (Exception e){
                    Log.e(LOG_TAG, "Failed to get author name");
                }
            }
        }

        return authorName;
    }


    /**
     * Request an array of authors from AUTHOR_REQUEST_URL
     * Necessary to correctly display author name in article listview
     */
    private static void getAuthorData(){
        URL url = createUrl(AUTHOR_REQUEST_URL);
        String jsonResponse = null;
        try {
            jsonResponse = makeHttpGetRequest(url);
        } catch (IOException e) {
            Log.e(LOG_TAG, "Problem making the HTTP request.", e);
        }
        try {
            authorsArray = new JSONArray(jsonResponse);
        } catch (JSONException e) {
            Log.e(LOG_TAG, "Error parsing author info");
        }
    }

    /**
     * This is the method that gets called when a comment is submitted though CreateCommentActivity.
     * It handles posting said comment and returns a http status code.
     */
    static int sendComment(String id, String authorName, String authorEmail, String content) throws IOException {
        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder.scheme("http");
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
     * Make an HTTP request to the given URL and return a String as the response.
     */
    private static int makeHttpPostRequest(URL url) throws IOException{
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


    static String getCategories() {
        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder
                .scheme("http")
                .authority(BASE_REQUEST_URL)
                .appendPath("wp-json")
                .appendPath("wp")
                .appendPath("v2")
                .appendPath("categories");
        URL requestURL = createUrl(uriBuilder.toString());
        OkHttpClient client = new OkHttpClient();
        final Request request = new Request.Builder().url(requestURL).build();
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Request request, IOException e) {
                Log.e(LOG_TAG, "Failed to get categories from server");
            }

            @Override
            public void onResponse(Response response) throws IOException {
                categoryResponse = response.body().string();

            }
        });

        return categoryResponse;
    }

    static void createMenu(String categoryString, Menu navigationMenu, NavigationView navigationView, DrawerLayout drawerLayout) throws JSONException {
        JSONArray categoryArray = null;
        try {
            categoryArray = new JSONArray(categoryString);
        } catch (JSONException e) {
            Log.e(LOG_TAG, "Failed to parse new categoryString");
        }
        if (categoryArray != null){
            navigationMenu.add(R.id.mainGroup, -1, 0, ContextApp.getApplication().getResources().getString(R.string.all_articles_cat));
        for(int i = 0; i<categoryArray.length(); i++){

            // Get current category from Array
            JSONObject currentCategory = categoryArray.getJSONObject(i);

            // Get WordPress category ID
            int id = currentCategory.getInt("id");

            // Get category name
            String name = currentCategory.getString("name");

            navigationMenu.add(/*Group ID*/R.id.mainGroup, /*itemID*/id, /*Order*/i+2, /*name*/name);
            }

            for (int j=0; j<navigationMenu.size(); j++) {
                navigationMenu.getItem(j).setCheckable(true);
            }

            navigationView.invalidate();
            drawerLayout.invalidate();
            drawerLayout.requestLayout();
        }
    }

}