package com.elvers.gereon.stgnewsapp1.api;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * The AuthorResponse contains a list of {@link Author} which is used f.e. to get the name behind an authorId
 */
public class AuthorResponse {

    private List<Author> authors = new ArrayList<>();

    /**
     * Constructs AuthorResponse
     *
     * @param json response from server
     * @throws JSONException
     */
    public AuthorResponse(String json) throws JSONException {
        JSONArray array = new JSONArray(json);
        for (int i = 0; i < array.length(); i++) {
            JSONObject author = array.getJSONObject(i);
            authors.add(new Author(
                    author.getInt("id"),
                    author.getString("name"),
                    author.getString("description"),
                    author.getString("link"),
                    author.getString("slug")
            ));
        }
    }

    public Author getAuthorBySlug(String slug) {
        for (Author author : authors) {
            if (author.getSlug().equals(slug))
                return author;
        }
        return null;
    }

    public List<Author> getAuthors() {
        return authors;
    }

}
