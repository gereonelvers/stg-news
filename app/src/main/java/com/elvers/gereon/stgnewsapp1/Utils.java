package com.elvers.gereon.stgnewsapp1;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;
import android.preference.PreferenceManager;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.Charset;
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

    // Static request URL the list of authors will be requested from. Putting it at the top like this allow easier modification of top level domain if required.
    private static final String AUTHOR_REQUEST_URL = "http://stg-sz.net/wp-json/wp/v2/users/";
    private static final String BASE_REQUEST_URL = "stg-sz.net";
    private static JSONArray authorsArray;

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
        } catch (MalformedURLException e) {
            Log.e(LOG_TAG, "Problem building the URL ", e);
        }
        return url;
    }

    /**
     * Make an HTTP request to the given URL and return a String as the response.
     */
    private static String makeHttpGetRequest(URL url) throws IOException {
        String jsonResponse = "";

        // If the URL is null, then return an early response. No need to delay or cause IOException here.
        if (url == null) {
            return jsonResponse;
        }

        HttpURLConnection urlConnection = null;
        InputStream inputStream = null;
        try {
            // Set parameters for the URL connection and connect
            urlConnection = (HttpURLConnection) url.openConnection();
            urlConnection.setReadTimeout(10000 /* milliseconds */);
            urlConnection.setConnectTimeout(15000 /* milliseconds */);
            urlConnection.setRequestMethod("GET");
            urlConnection.connect();

            // If the request was successful (response code 200),
            // then read the input stream and parse the response.
            if (urlConnection.getResponseCode() == 200) {
                inputStream = urlConnection.getInputStream();
                jsonResponse = readFromStream(inputStream);
            } else {
                Log.e(LOG_TAG, "Error response code: " + urlConnection.getResponseCode());
            }
        } catch (IOException e) {
            Log.e(LOG_TAG, "Problem retrieving the JSON results.");
        } finally {
            if (urlConnection != null) {
                urlConnection.disconnect();
            }
            if (inputStream != null) {
                // Closing the input stream could throw an IOException, which is why
                // the makeHttpGetRequest(URL url) method specifies than an IOException
                // could be thrown.
                inputStream.close();
            }
        }
        return jsonResponse;
    }

    /**
     * Convert the {@link InputStream} into a String which contains the
     * whole JSON response from the server.
     */
    private static String readFromStream(InputStream inputStream) throws IOException {
        StringBuilder output = new StringBuilder();
        if (inputStream != null) {
            InputStreamReader inputStreamReader = new InputStreamReader(inputStream, Charset.forName("UTF-8"));
            BufferedReader reader = new BufferedReader(inputStreamReader);
            String line = reader.readLine();
            while (line != null) {
                output.append(line);
                line = reader.readLine();
            }
        }
        return output.toString();
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
                    Log.e("formatDate:","Error parsing dateString into format");
                }
                SimpleDateFormat outputFormat = new SimpleDateFormat("dd.MM.yyyy, HH:mm", Locale.getDefault());
                String dateString = outputFormat.format(articleDate);

                /* Get article cover image URL
                 * This code block either gets the highest fixed resolution image URL or the original source image URL depending on whether or not isHighRes is true.
                 */
                Context mContext = ContextApp.getContext();
                SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(mContext);
                Boolean isHighRes = prefs.getBoolean("high_resolution", false);
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
                        Log.e(LOG_TAG, "Failed to get large image");
                    }
                    try {
                        if (imgObj == null) {
                            imgObj = sizes.getJSONObject("medium");
                        }
                    }
                    catch (Exception e){
                        Log.e(LOG_TAG, "Failed to get medium image");
                    }
                    try {
                        if (imgObj == null) {
                            imgObj = sizes.getJSONObject("thumbnail");
                            }
                        }
                    catch (Exception e){
                        Log.e(LOG_TAG, "Failed to get thumbnail image");
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
                    Log.e(LOG_TAG + "IMG Conversion for article " + i, "Can't parse img through betterFeaturedImage");
                }


                /* Get article categories
                 * The static switch statement is not really elegant, but since category IDs are unpredictable (and therefore can't be parsed in a loop), this will have to do.
                 */
                JSONArray categoriesArray = currentArticle.getJSONArray("categories");
                String categoryString = "";
                int currentCategory;
                for (int a=0; a<categoriesArray.length();a++){
                    currentCategory = categoriesArray.getInt(a);
                    switch (currentCategory){
                        case 12:
                            categoryString = String.format("%s%s, ", categoryString, mContext.getString(R.string.history_cat));
                            break;

                        case 7:
                            categoryString = String.format("%s%s, ", categoryString, mContext.getString(R.string.interviews_cat));
                            break;

                        case 4:
                            categoryString = String.format("%s%s, ", categoryString, mContext.getString(R.string.culture_cat));
                            break;

                        case 5:
                            categoryString = String.format("%s%s, ", categoryString, mContext.getString(R.string.trips_cat));
                            break;

                        case 11:
                            categoryString = String.format("%s%s, ", categoryString, mContext.getString(R.string.teachers_cat));
                            break;

                        case 8:
                            categoryString = String.format("%s%s, ", categoryString, mContext.getString(R.string.opinions_cat));
                            break;

                        case 6:
                            categoryString = String.format("%s%s, ", categoryString, mContext.getString(R.string.sv_news_cat));
                            break;

                        case 3:
                            categoryString = String.format("%s%s, ", categoryString, mContext.getString(R.string.sport_cat));
                            break;

                        case 2:
                            categoryString = String.format("%s%s, ", categoryString, mContext.getString(R.string.author_team_cat));
                            break;

                        case 9:
                            categoryString = String.format("%s%s, ", categoryString, mContext.getString(R.string.knowledge_cat));
                            break;

                        case 1:
                            categoryString = String.format("%s%s, ", categoryString, mContext.getString(R.string.other_cat));
                            break;
                    }
                }

                /* Since ", " is added after every category, this statement removes it from the end String if it's not empty */
                if (!categoryString.equals("")){
                    categoryString = categoryString.substring(0, categoryString.length() - 2);
                }


                /* After the individual parts of the Article are retrieved individually, they are parsed into an Article object and added to the array */
                Article article = new Article(id, titleString, authorString, dateString, urlString, imageUrlString, categoryString);
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
                    Log.e("formatDate:","Error parsing dateString into format");
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
                Log.e("getAuthorName", "Finding matching author failed");
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
            Log.e("", "Error parsing author info");
        }
    }

    static int sendComment(String id, String authorName, String authorEmail, String content){
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
    private static int makeHttpPostRequest(URL url) {
        Integer responseCode = 0;

        // If the URL is null, then return an early response. No need to delay or cause IOException here.
        if (url == null) {
            return responseCode;
        }

        HttpURLConnection urlConnection = null;
        try {
            // Set parameters for the URL connection and connect
            urlConnection = (HttpURLConnection) url.openConnection();

            urlConnection.setReadTimeout(10000 /* milliseconds */);
            urlConnection.setConnectTimeout(15000 /* milliseconds */);

            urlConnection.setRequestMethod("POST");

            urlConnection.setDoOutput(true);
            urlConnection.setDoInput(true);

            urlConnection.connect();

            responseCode = urlConnection.getResponseCode();

        } catch (IOException e){
            Log.e(LOG_TAG, "POST failed");}
        finally {
            if (urlConnection != null) {
                urlConnection.disconnect();
            }
        }
        return responseCode;
    }

}