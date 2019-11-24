package com.elvers.gereon.stgnewsapp1;

import android.annotation.SuppressLint;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.v4.app.Fragment;
import android.support.v4.app.LoaderManager;
import android.support.v4.content.Loader;
import android.support.v4.widget.SwipeRefreshLayout;
import android.support.v7.app.AppCompatDelegate;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.RelativeLayout;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

/**
 * Fragment that loads and displays the comments associated with an Article
 *
 * @author Gereon Elvers
 */
public class CommentsFragment extends Fragment implements LoaderManager.LoaderCallbacks<List<Comment>> {

    // Tag for log messages
    private static final String LOG_TAG = CommentsFragment.class.getSimpleName();

    /* There are a lot of items declared outside of individual methods here.
    This is done because they are required to be available across methods and it's more economical to simply initialize them onCreateView() */
    private static final String COMMENTS_REQUEST_URL = "stg-sz.net";
    private static final int COMMENT_LOADER_ID = 3;
    LoaderManager loaderManager;
    View loadingIndicator;
    RelativeLayout emptyView;
    TextView emptyView_tv;
    ImageView emptyView_arrow_iv;
    ImageView emptyView_quill_iv;
    CommentAdapter commentAdapter;
    ListView listView;
    SwipeRefreshLayout mSwipeRefreshLayout;
    Integer pageNumber;
    TextView pageNumberTV;

    // Parsed parameter
    private Integer articleID;

    private String numberOfCommentsParam;

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
        loadingIndicator = view.findViewById(R.id.comments_loading_circle);
        listView = view.findViewById(R.id.comment_listView);
        loaderManager = getActivity().getSupportLoaderManager();
        emptyView = view.findViewById(R.id.comments_empty_view_rl);
        emptyView_tv = view.findViewById(R.id.comments_empty_view_tv);
        emptyView_arrow_iv = view.findViewById(R.id.comments_empty_view_arrow_iv);
        emptyView_quill_iv = view.findViewById(R.id.comments_empty_view_quill_iv);
        listView.setEmptyView(emptyView);

        // Inflate page picker and add below ListView
        View pagePicker = LayoutInflater.from(getActivity()).inflate(R.layout.page_picker, null, false);
        listView.addFooterView(pagePicker);

        // When launching the Activity, the first page should be loaded
        pageNumber = 1;

        // Initialize page number TextView and set initial value (at this point, always 1)
        pageNumberTV = view.findViewById(R.id.page_number_tv);
        pageNumberTV.setText(pageNumber.toString());

        // Implement page back-button
        ImageView backIV = view.findViewById(R.id.back_iv);
        backIV.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (pageNumber > 1) {
                    pageNumber--;
                    pageNumberTV.setText(pageNumber.toString());
                    refreshListView();
                }
            }
        });
        // Implement page forward-button
        ImageView forwardIV = view.findViewById(R.id.forward_iv);
        forwardIV.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                pageNumber++;
                pageNumberTV.setText(pageNumber.toString());
                refreshListView();
            }
        });

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
        commentAdapter.clear();
        loadingIndicator.setVisibility(View.VISIBLE);
        initLoaderListView();
        emptyView.setVisibility(View.INVISIBLE);
    }

    /**
     * This method is called when creating a new CommentLoader. It creates a modified query URL (by adding the filter parameters listed below) and initializes the CommentLoader.
     * <p>
     * Parameters:
     * {@param articleID} is the ID of the Article)
     * {@param numberOfCommentsParam} is a String containing the number of Comment objects requested from the server
     * {@param pageNumber} is the page number loaded
     */
    @Override
    @NonNull
    public Loader<List<Comment>> onCreateLoader(int i, Bundle bundle) {
        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder.scheme("https");
        uriBuilder.authority(COMMENTS_REQUEST_URL);
        uriBuilder.appendPath("wp-json").appendPath("wp").appendPath("v2").appendPath("comments");
        uriBuilder.appendQueryParameter("post", articleID.toString());
        if (!numberOfCommentsParam.isEmpty()) {
            uriBuilder.appendQueryParameter("per_page", numberOfCommentsParam);
            uriBuilder.appendQueryParameter("page", pageNumber.toString());
        }
        return new CommentLoader(getContext(), uriBuilder.toString());
    }

    @Override
    public void onLoadFinished(@NonNull Loader<List<Comment>> loader, List<Comment> comments) {
        // Since we can't be sure the fragment will still be active when comments are fetched, this is done in a try-block
        try {
            loadingIndicator.setVisibility(View.GONE);
            if (pageNumber == 1) {
                emptyView_tv.setText(getString(R.string.comments_empty_view));
                if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
                    emptyView_arrow_iv.setImageResource(R.drawable.ic_arrow_dark);
                } else {
                    emptyView_arrow_iv.setImageResource(R.drawable.ic_arrow_light);
                }
                emptyView_quill_iv.setImageResource(R.drawable.ic_quill);
            } else {
                emptyView_tv.setText(getString(R.string.comments_empty_view_page));
            }

            commentAdapter.clear();
            if (comments != null && !comments.isEmpty()) {
                commentAdapter.addAll(comments);
            } else {
                if (pageNumber != 1) {
                    emptyView_quill_iv.setVisibility(View.INVISIBLE);
                    emptyView_arrow_iv.setVisibility(View.INVISIBLE);
                    emptyView_tv.setOnClickListener(new View.OnClickListener() {
                        @SuppressLint("SetTextI18n")
                        @Override
                        public void onClick(View v) {
                            pageNumber--;
                            pageNumberTV.setText(pageNumber.toString());
                            refreshListView();
                        }
                    });
                }
            }
        } catch (Exception e) {
            Log.e(LOG_TAG, "Can't push comments to Adapter: " + e.toString());
            e.printStackTrace();
        }
        if (mSwipeRefreshLayout.isRefreshing()) {
            mSwipeRefreshLayout.setRefreshing(false);
        }
    }


    /**
     * This is the method actually loading the data and projecting it onto the ListView. It creates a new Adapter and sets it on the ListView
     * Also destroys (if necessary) and restarts the ArticleLoader responsible for filling the CommentAdapter with content
     */
    public void initLoaderListView() {
        commentAdapter = new CommentAdapter(getActivity(), new ArrayList<Comment>());
        listView.setAdapter(commentAdapter);
        loaderManager.destroyLoader(COMMENT_LOADER_ID);
        loaderManager.initLoader(COMMENT_LOADER_ID, null, this);
    }

    @Override
    public void onLoaderReset(@NonNull Loader<List<Comment>> loader) {
        commentAdapter.clear();
    }

}
