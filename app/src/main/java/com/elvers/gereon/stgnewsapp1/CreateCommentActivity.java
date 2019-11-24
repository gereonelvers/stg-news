package com.elvers.gereon.stgnewsapp1;

import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.LoaderManager;
import android.support.v4.content.Loader;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.app.AppCompatDelegate;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Toast;

/**
 * Activity that manages creating and posting a comment
 *
 * @author Gereon Elvers
 */
public class CreateCommentActivity extends AppCompatActivity implements LoaderManager.LoaderCallbacks<Integer> {

    // Tag for log messages
    private static final String LOG_TAG = CreateCommentActivity.class.getSimpleName();
    /* There are a lot of items declared outside of individual methods here.
    This is done because they are required to be available across methods and it's more economical to simply initialize them onCreate()*/
    String articleId;
    EditText nameET;
    EditText emailET;
    EditText contentET;
    String nameString;
    String emailString;
    String contentString;
    int POSTER_ID = 5;
    LoaderManager loaderManager;
    ImageView name_help;
    ImageView email_help;
    ImageView content_help;
    ImageView email_wand;
    AlertDialog.Builder alertDialogBuilder;
    String nameAdd;
    String lonetString;
    SharedPreferences preferences;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Utils.updateNightMode(this);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_create_comment);
        Toolbar toolbar = findViewById(R.id.create_comment_toolbar);
        setSupportActionBar(toolbar);
        final ActionBar actionbar = getSupportActionBar();
        if (actionbar != null) {
            actionbar.setDisplayHomeAsUpEnabled(true);
            if (AppCompatDelegate.getDefaultNightMode() == AppCompatDelegate.MODE_NIGHT_YES) {
                actionbar.setHomeAsUpIndicator(R.drawable.ic_cancel_dark);
            } else {
                actionbar.setHomeAsUpIndicator(R.drawable.ic_cancel_light);
            }
            actionbar.setTitle(R.string.app_name);
        }

        lonetString = getString(R.string.lonet_string);
        loaderManager = getSupportLoaderManager();
        Intent createCommentIntent = getIntent();
        int articleId = createCommentIntent.getIntExtra("ARTICLE_ID", -1);
        this.articleId = String.valueOf(articleId);
        nameET = findViewById(R.id.create_comment_name_et);
        emailET = findViewById(R.id.create_comment_mail_et);
        contentET = findViewById(R.id.create_comment_content_et);
        name_help = findViewById(R.id.create_comment_name_question_iv);
        email_help = findViewById(R.id.create_comment_email_question_iv);
        content_help = findViewById(R.id.create_comment_content_question_iv);
        email_wand = findViewById(R.id.create_comment_email_wand_iv);

        preferences = PreferenceManager.getDefaultSharedPreferences(this);
        String name_string = preferences.getString("name", "");
        if (name_string != null && !name_string.equals("")) {
            nameET.setText(name_string);
            nameET.clearFocus();
            emailET.requestFocus();
        }
        String name_add = preferences.getString("name_add", "");
        if (name_add != null && !name_add.equals("")) {
            emailET.setText(name_add);
            emailET.clearFocus();
            contentET.requestFocus();
        }


        alertDialogBuilder = new AlertDialog.Builder(getApplication());

        name_help.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(CreateCommentActivity.this);
                alertDialogBuilder.setTitle(getString(R.string.create_comments_hint_title));
                alertDialogBuilder.setMessage(getString(R.string.create_comments_hint_name));
                alertDialogBuilder.setCancelable(true);
                alertDialogBuilder.setNeutralButton(getString(R.string.okay), new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int id) {
                        dialog.cancel();
                    }
                });
                AlertDialog alertDialog = alertDialogBuilder.create();
                alertDialog.show();
            }
        });

        email_help.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(CreateCommentActivity.this);
                alertDialogBuilder.setTitle(getString(R.string.create_comments_hint_title));
                alertDialogBuilder.setMessage(getString(R.string.create_comment_hint_email));
                alertDialogBuilder.setCancelable(true);
                alertDialogBuilder.setNeutralButton(getString(R.string.okay), new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int id) {
                        dialog.cancel();
                    }
                });
                AlertDialog alertDialog = alertDialogBuilder.create();
                alertDialog.show();
            }
        });

        content_help.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(CreateCommentActivity.this);
                alertDialogBuilder.setTitle(getString(R.string.create_comments_hint_title));
                alertDialogBuilder.setMessage(getString(R.string.create_comment_hint_content));
                alertDialogBuilder.setCancelable(true);
                alertDialogBuilder.setNeutralButton(getString(R.string.okay), new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int id) {
                        dialog.cancel();
                    }
                });
                AlertDialog alertDialog = alertDialogBuilder.create();
                alertDialog.show();
            }
        });


        // Since no one ever remembers their lo-net address, this onClickListener automatically generates it based on the input name
        email_wand.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                nameString = nameET.getText().toString();
                if (!nameString.isEmpty()) {
                    try {
                        // Replace invalid characters
                        nameString = nameString
                                .replace("ß", "ss")
                                .replace("ä", "ae")
                                .replace("ö", "oe")
                                .replace("ü", "ue");

                        // Create an Array of names, only the first and last name are relevant
                        String[] emailNameParts = nameString.split(" ");
                        // If the array contains at least 2 names, proceed with address generation
                        if (emailNameParts.length >= 2) {
                            // Get the first 3 characters of the first name
                            String firstName = emailNameParts[0].substring(0, 3).toLowerCase();
                            // Since the array starts at 0 but .length returns a value starting at 1, we need to subtract 1
                            String lastName = emailNameParts[emailNameParts.length - 1].toLowerCase();
                            nameAdd = firstName + "." + lastName;
                            if (emailNameParts.length > 2) {
                                Toast.makeText(getApplicationContext(), getString(R.string.name_too_long), Toast.LENGTH_SHORT).show();
                            }
                        } else {
                            Toast.makeText(getApplicationContext(), getString(R.string.first_last_name_identical), Toast.LENGTH_SHORT).show();
                        }
                    } catch (Exception e) {
                        Log.e(LOG_TAG, "Failed to create lo-net address: " + e.toString());
                        e.printStackTrace();
                    }
                }
                emailET.setText(nameAdd);
            }
        });
    }

    @Override
    protected void onRestart() {
        Utils.updateNightMode(this);
        super.onRestart();
        recreate();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the options menu from XML
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.create_comment_menu, menu);
        return true;

    }

    /**
     * This method sets associates actions with the menu options representing them
     */
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()) {
            // Back button
            case android.R.id.home:
                onBackPressed();
                return true;
            // Submit button
            case R.id.submit:
                nameString = nameET.getText().toString();
                emailString = emailET.getText().toString() + lonetString;
                contentString = contentET.getText().toString();
                if (articleId != null) {
                    // Check if lo-net address ending is present in email
                    loaderManager.destroyLoader(POSTER_ID);
                    loaderManager.initLoader(POSTER_ID, null, this);
                } else {
                    Log.e(LOG_TAG, "Article ID empty, can't submit comment");
                }
                return true;
            // Settings button
            case R.id.settings:
                Intent settingsIntent = new Intent(getApplicationContext(), SettingsActivity.class);
                startActivity(settingsIntent);
                return true;
            // About button
            case R.id.about:
                Intent aboutIntent = new Intent(getApplicationContext(), AboutActivity.class);
                startActivity(aboutIntent);
                return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @NonNull
    @Override
    public Loader<Integer> onCreateLoader(int i, @Nullable Bundle bundle) {
        return new CommentPoster(this, articleId, nameString, emailString, contentString);
    }

    @Override
    public void onLoadFinished(@NonNull Loader<Integer> loader, Integer responseCode) {
        // If submission was successful, status code will be 201. Return to previous activity to prevent duplicate submissions
        if (responseCode == 201) {
            Toast.makeText(this, getResources().getString(R.string.successful_post), Toast.LENGTH_LONG).show();
            SharedPreferences.Editor editor = preferences.edit();
            editor.putString("name_add", nameAdd);
            editor.putString("name", nameString);
            editor.apply();
            onBackPressed();
        }
        // If status code is anything but 201, submission was not successful.
        // Display error message while staying in activity.
        else {
            Toast.makeText(this, getResources().getString(R.string.unsuccessful_post) + " " + responseCode.toString(), Toast.LENGTH_LONG).show();
        }

    }

    /**
     * This method is only called when a more than one posting attempt is made sequentially.
     * Since there is no data being loaded into the activity, it can be left empty (it needs to be included because it overrides a LoaderCallbacks<> method)
     */
    @Override
    public void onLoaderReset(@NonNull Loader<Integer> loader) {
    }

}
