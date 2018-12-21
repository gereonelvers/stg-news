package com.elvers.gereon.stgnewsapp1;

import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.v4.app.Fragment;
import android.support.v4.app.LoaderManager;
import android.support.v4.content.Loader;
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

    // Parsed parameters
    private Integer articleID;

    private String numberOfCommentsParam;

    // Required empty public constructor
    public CommentsFragment() { }

    public static CommentsFragment newInstance(int receivedArticleID) {
        Bundle bundle = new Bundle();
        bundle.putInt("articleID", receivedArticleID);
        CommentsFragment commentsFragment = new CommentsFragment();
        commentsFragment.setArguments(bundle);
        return commentsFragment;
    }

    private void readBundle(Bundle bundle) {
        if (bundle != null) {
            articleID = bundle.getInt("articleID");
        }
    }


    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_comments, container, false);
        readBundle(getArguments());
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
        initLoaderListView();
        return view;
    }

    @Override
    @NonNull
    public Loader<List<Comment>> onCreateLoader(int i, Bundle bundle) {
        Uri.Builder uriBuilder = new Uri.Builder();
        uriBuilder.scheme("http");
        uriBuilder.authority(COMMENTS_REQUEST_URL);
        uriBuilder.appendPath("wp-json").appendPath("wp").appendPath("v2").appendPath("comments");
        uriBuilder.appendQueryParameter("post", articleID.toString());
        if (!numberOfCommentsParam.isEmpty()) {
            uriBuilder.appendQueryParameter("per_page", numberOfCommentsParam);
        }
        return new CommentLoader(getContext(), uriBuilder.toString());
    }

    @Override
    public void onLoadFinished(@NonNull Loader<List<Comment>> loader, List<Comment> comments) {
        // Since we can't be sure the fragment will still be active when comments are fetched, this is done in a try-block
        try {
            loadingIndicator.setVisibility(View.GONE);
            emptyView_tv.setText(getString(R.string.comments_empty_view));
            emptyView_arrow_iv.setImageResource(R.drawable.ic_arrow);
            emptyView_quill_iv.setImageResource(R.drawable.ic_quill);
            commentAdapter.clear();
            if (comments != null && !comments.isEmpty()) {
                commentAdapter.addAll(comments);
            }
        } catch (Exception e) {
            Log.e("onLoadFinished", "Can't push comments to Adapter");
        }
    }

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
