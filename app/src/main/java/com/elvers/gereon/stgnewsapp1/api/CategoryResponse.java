package com.elvers.gereon.stgnewsapp1.api;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class CategoryResponse {

    private List<Category> categories = new ArrayList<>();

    public CategoryResponse(String json) throws JSONException {
        JSONArray array = new JSONArray(json);

        for (int i = 0; i < array.length(); i++) {
            JSONObject category = array.getJSONObject(i);
            categories.add(new Category(
                    category.getInt("id"),
                    category.getInt("count"),
                    category.getString("description"),
                    category.getString("link"),
                    category.getString("name")
            ));
        }
    }

    public List<Category> getCategories() {
        return categories;
    }

    public Category getCategoryById(int id) {
        for (Category category : categories) {
            if (category.id == id)
                return category;
        }
        return null;
    }

    public class Category {
        public final int id;
        public final int count;
        public final String description;
        public final String link;
        public final String name;

        public Category(int id, int count, String description, String link, String name) {
            this.id = id;
            this.count = count;
            this.description = description;
            this.link = link;
            this.name = name;
        }
    }
}
