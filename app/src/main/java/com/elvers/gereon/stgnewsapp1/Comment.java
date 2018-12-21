package com.elvers.gereon.stgnewsapp1;


class Comment {
    private int mId;
    private String mAuthor;
    private String mDate;
    private String mTime;
    private String mContent;

    /**
     * Constructs a new {@link Comment} object.
     *
     * @param id         is the WordPress assigned comment ID of the comment
     * @param author     is the author of the Comment
     * @param date       is the publication date of the Comment
     * @param content    is the content of the Comment as String
     */
    Comment(int id, String author, String date, String time, String content) {
        mId = id;
        mAuthor = author;
        mDate = date;
        mTime = time;
        mContent = content;
    }

    /**
     * The following methods return the individual components of the Comment (think of the Comment object as a container containing the other objects)
     */

    int getId() {
        return mId;
    }

    String getAuthor() {
        return mAuthor;
    }

    String getDate() {
        return mDate;
    }

    String getTime(){
        return mTime;
    }

    String getContent(){
        return mContent;
    }


}
