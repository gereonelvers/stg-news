package com.elvers.gereon.stgnewsapp1.fragments;

import android.annotation.SuppressLint;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import androidx.appcompat.app.AppCompatDelegate;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AbsListView;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.TextView;

import com.elvers.gereon.stgnewsapp1.R;
import com.elvers.gereon.stgnewsapp1.adapter.CommentAdapter;
import com.elvers.gereon.stgnewsapp1.api.Comment;
import com.elvers.gereon.stgnewsapp1.handlers.ICommentsLoadedHandler;
import com.elvers.gereon.stgnewsapp1.tasks.LoadCommentsTask;

import java.util.ArrayList;
import java.util.List;

/**
 * Fragment that loads and displays the comments associated with an Article
 *
 * @author Gereon Elvers
 */
public class CommentsFragment extends Fragment implements ICommentsLoadedHandler, SharedPreferences.OnSharedPreferenceChangeListener {

    // Tag for log messages
    private static final String LOG_TAG = CommentsFragment.class.getSimpleName();

    /* There are a lot of items declared outside of individual methods here.
    This is done because they are required to be available across methods and it's more economical to simply initialize them onCreateView() */
    private static final String COMMENTS_REQUEST_URL = "stg-sz.net";
    View loadingIndicator;
    RelativeLayout emptyView;
    TextView emptyView_tv;
    ImageView emptyView_arrow_iv;
    ImageView emptyView_quill_iv;
    CommentAdapter commentAdapter;
    ListView listView;
    SwipeRefreshLayout mSwipeRefreshLayout;
    Integer pageNumber;

    // Parsed parameter
    private Integer articleID;
    private String numberOfCommentsParam;

    private ProgressBar loadingIndicatorBottom;
    private boolean loadingContent = false;
    private boolean canLoadMoreContent = true;

    // Required empty public constructor
    public CommentsFragment() {
    }

    public static CommentsFragment newInstance(int receivedArticleID) {
        Bundle bundle = new Bundle();
        bundle.putInt("articleID", receivedArticleID);
        CommentsFragment commentsFragment = new CommentsFragment();
        commentsFragment.setArguments(bundle);
        return commentsFragment;
    }

    // Try to retrieve article-ID from Bundle
    private void readBundle(Bundle bundle) {
        if (bundle != null) {
            articleID = bundle.getInt("articleID");
        }
    }


    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    /**
     * Since this is a fragment, construction is done onCreateView() since calls to the layout need to be made though "view.", which is only available here
     */
    @SuppressLint("SetTextI18n")
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        if (getActivity() == null)
            throw new RuntimeException("getActivity() returned null");

        // Set layout
        View view = inflater.inflate(R.layout.fragment_comments, container, false);
        // Try to get article ID from Bundle
        readBundle(getArguments());
        // Get number of comments to be loaded
        SharedPreferences sharedPreferences = PreferenceManager.getDefaultSharedPreferences(getActivity());
        numberOfCommentsParam = sharedPreferences.getString("comments_number", "10");
        sharedPreferences.registerOnSharedPreferenceChangeListener(this);

        loadingIndicator = view.findViewById(R.id.comments_loading_circle);
        listView = view.findViewById(R.id.comment_listView);
        emptyView = view.findViewById(R.id.comments_empty_view_rl);
        emptyView_tv = view.findViewById(R.id.comments_empty_view_tv);
        emptyView_arrow_iv = view.findViewById(R.id.comments_empty_view_arrow_iv);
        emptyView_quill_iv = view.findViewById(R.id.comments_empty_view_quill_iv);
        listView.setEmptyView(emptyView);

        loadingIndicatorBottom = new ProgressBar(getActivity());
        loadingIndicatorBottom.setVisibility(View.GONE);
        listView.addFooterView(loadingIndicatorBottom);

        listView.setOnScrollListener(new InfinityScrollListener());

        // When launching the Activity, the first page should be loaded
        pageNumber = 1;

        // SwipeRefreshLayout is initialized and refresh functionality is implemented
        mSwipeRefreshLayout = view.findViewById(R.id.swipeRefreshLayout);
        mSwipeRefreshLayout.setColorSchemeResources(R.color.colorAccent);
        mSwipeRefreshLayout.setOnRefreshListener(new SwipeRefreshLayout.OnRefreshListener() {
            @Override
            public void onRefresh() {
                mSwipeRefreshLayout.setRefreshing(true);
                refreshListView();

            }
        });

        initLoaderListView();
        return view;
    }

    public void refreshListView() {
        if (commentAdapter != null)
            commentAdapter.clear();
        loadingIndicator.setVisibility(View.VISIBLE);
        initLoaderListView();
        emptyView.setVisibility(View.INVISIBLE);
    }

    /**
     * This is the method actually loading the data and projecting it onto the ListView. It creates a new Adapter and sets it on the ListView
     */
    public void initLoaderListView() {
        pageNumber = 1;

        commentAdapter = new CommentAdapter(getActivity(), new ArrayList<Comment>());
        listView.setAdapter(commentAdapter);
        startFetchingComments();
    }

    private void startFetchingComments() {
        loadingContent = true;

        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder.scheme("https");
        uriBuilder.authority(COMMENTS_REQUEST_URL);
        uriBuilder.appendPath("wp-json").appendPath("wp").appendPath("v2").appendPath("comments");
        uriBuilder.appendQueryParameter("post", articleID.toString());
        if (!numberOfCommentsParam.isEmpty()) {
            uriBuilder.appendQueryParameter("per_page", numberOfCommentsParam);
            uriBuilder.appendQueryParameter("page", pageNumber.toString());
        }
        new LoadCommentsTask(this).execute(uriBuilder.toString());
    }

    @Override
    public void onCommentsFetched(List<Comment> comments) {
        pageNumber = 1;
        canLoadMoreContent = true;

        // Since we can't be sure the fragment will still be active when comments are fetched, this is done in a try-block
        try {
            loadingIndicator.setVisibility(View.GONE);
            loadingIndicatorBottom.setVisibility(View.GONE);

            emptyView_tv.setText(getString(R.string.comments_empty_view));
            if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
                emptyView_arrow_iv.setImageResource(R.drawable.ic_arrow_dark);
            } else {
                emptyView_arrow_iv.setImageResource(R.drawable.ic_arrow_light);
            }
            emptyView_quill_iv.setImageResource(R.drawable.ic_quill);

            commentAdapter.notifyDataSetChanged();
            if (comments != null && !comments.isEmpty()) {
                commentAdapter.addAll(comments);
                if (comments.size() != PreferenceManager.getDefaultSharedPreferences(getActivity()).getInt("comments_number", 10))
                    canLoadMoreContent = false;
            } else {
                if (comments != null)
                    canLoadMoreContent = false;
            }
        } catch (Exception e) {
            Log.e(LOG_TAG, "Can't push comments to Adapter: " + e.toString());
            e.printStackTrace();
        }
        if (mSwipeRefreshLayout.isRefreshing()) {
            mSwipeRefreshLayout.setRefreshing(false);
        }

        loadingContent = false;
    }

    @Override
    public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
        if (key.equals("dark_mode")) {
            getActivity().recreate();
        } else if (key.equals("comments_number")) {
            getActivity().recreate();
        }
    }

    private class InfinityScrollListener implements AbsListView.OnScrollListener {
        @Override
        public void onScrollStateChanged(AbsListView view, int scrollState) {
        }

        @Override
        public void onScroll(AbsListView view, int firstVisibleItem, int visibleItemCount, int totalItemCount) {
            if (firstVisibleItem + visibleItemCount + 2 >= totalItemCount && !loadingContent && canLoadMoreContent && totalItemCount > 0 && visibleItemCount > 0) {
                loadingIndicatorBottom.setVisibility(View.VISIBLE);
                pageNumber++;
                startFetchingComments();
            }
        }
    }
}
