package com.elvers.gereon.stgnewsapp1.api;

import android.support.annotation.NonNull;

public class Author extends ListEntry {

    private int id;
    private String name;
    private String description;
    private String link;
    private String slug;

    public Author(int id, String name, String description, String link, String slug) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.link = link;
        this.slug = slug;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getLink() {
        return link;
    }

    public String getSlug() {
        return slug;
    }

    @NonNull
    @Override
    public String toString() {
        return name + "@" + id;
    }
}
