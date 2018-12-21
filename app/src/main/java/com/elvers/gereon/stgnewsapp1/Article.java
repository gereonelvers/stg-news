package com.elvers.gereon.stgnewsapp1;

/**
 * An {@link Article} object contains information related to a single Article.
 *
 * @author Gereon Elvers
 */
class Article {
    private int mId;
    private String mTitle;
    private String mAuthor;
    private String mDate;
    private String mUrl;
    private String mCoverImage;
    private String mCategory;

    /**
     * Constructs a new {@link Article} object.
     *
     * @param id         is the WordPress-ID of the article
     * @param title      is the title of the article
     * @param author     is the author of the article
     * @param date       is the publication date of the article
     * @param url        is the website URL of the article
     * @param coverImage is the image URL of the cover image (if present)
     * @param category   contains the first three categories of the article (concatenated as String; ", ..." added if more than three categories are present)
     */
    Article(int id, String title, String author, String date, String url, String coverImage, String category) {
        mId = id;
        mTitle = title;
        mAuthor = author;
        mDate = date;
        mUrl = url;
        mCoverImage = coverImage;
        mCategory = category;
    }

    /**
     * The following methods return the individual components of the Article (think of the Article object as a container containing the other objects)
     */

    int getId() {
        return mId;
    }

    String getTitle() {
        return mTitle;
    }

    String getAuthor() {
        return mAuthor;
    }

    String getDate() {
        return mDate;
    }

    String getUrl() {
        return mUrl;
    }

    String getCoverImage() {
        return mCoverImage;
    }

    String getCategory() {
        return mCategory;
    }


}
