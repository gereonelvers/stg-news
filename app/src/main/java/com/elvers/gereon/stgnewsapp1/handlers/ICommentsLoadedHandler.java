package com.elvers.gereon.stgnewsapp1.handlers;

import com.elvers.gereon.stgnewsapp1.api.Comment;

import java.util.List;

public interface ICommentsLoadedHandler {

    void onCommentsFetched(List<Comment> comments);

}
