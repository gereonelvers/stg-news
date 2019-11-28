package com.elvers.gereon.stgnewsapp1.api;

import android.support.annotation.NonNull;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class AuthorResponse {

    private List<Author> authors = new ArrayList<>();

    public AuthorResponse(String json) throws JSONException {
        JSONArray array = new JSONArray(json);
        for(int i = 0; i < array.length(); i++) {
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
        for(Author author : authors) {
            if(author.slug.equals(slug))
                return author;
        }
        return null;
    }

    public List<Author> getAuthors() {
        return authors;
    }

    public class Author {
        public final int id;
        public final String name;
        public final String description;
        public final String link;
        public final String slug;

        public Author(int id, String name, String description, String link, String slug) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.link = link;
            this.slug = slug;
        }

        @NonNull
        @Override
        public String toString() {
            return name + "@" + id;
        }
    }

}
