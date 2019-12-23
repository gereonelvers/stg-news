package com.elvers.gereon.stgnewsapp1.handlers;

import com.elvers.gereon.stgnewsapp1.api.ListEntry;

import java.util.List;

public interface IListContentLoadedHandler {

    void onListContentFetched(List<ListEntry> articles);

}
