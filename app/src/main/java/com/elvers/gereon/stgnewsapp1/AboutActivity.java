package com.elvers.gereon.stgnewsapp1;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.v7.app.ActionBar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.TextView;


/**
 * Activity that shows "About" information like sources and feedback links
 *
 * @author Gereon Elvers
 */
public class AboutActivity extends AppCompatActivity {


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_about);
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        ActionBar actionbar = getSupportActionBar();
        if (actionbar != null) {
            actionbar.setDisplayHomeAsUpEnabled(true);
            actionbar.setTitle(R.string.about_string);
        }
        TextView contentFeedbackTV = findViewById(R.id.about_content_feedback);
        contentFeedbackTV.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent contentFeedbackIntent = new Intent(Intent.ACTION_SENDTO);
                contentFeedbackIntent.setData(Uri.parse("mailto:stg-schuelerzeitung+content@gmail.com"));
                contentFeedbackIntent.putExtra(Intent.EXTRA_SUBJECT, "Feedback zum Inhalt");
                startActivity(contentFeedbackIntent);
            }
        });
        final TextView codeFeedbackTV = findViewById(R.id.about_code_feedback);
        codeFeedbackTV.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent codeFeedbackIntent = new Intent(Intent.ACTION_SENDTO);
                codeFeedbackIntent.setData(Uri.parse("mailto:stg-schuelerzeitung+code@gmail.com"));
                codeFeedbackIntent.putExtra(Intent.EXTRA_SUBJECT, "Feedback zum Code");
                startActivity(codeFeedbackIntent);
            }
        });
        TextView codeSource = findViewById(R.id.about_code_source);
        codeSource.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent codeSourceIntent = new Intent(Intent.ACTION_VIEW);
                // TODO: actual link here
                codeSourceIntent.setData(Uri.parse("github.com/"));
                startActivity(codeSourceIntent);
            }
        });
        TextView source1 = findViewById(R.id.about_link1);
        source1.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent source1Intent = new Intent(Intent.ACTION_VIEW);
                source1Intent.setData(Uri.parse("https://www.vexels.com/vectors/preview/77711/hand-drawn-arrow-set"));
                startActivity(source1Intent);
            }
        });
        TextView source2 = findViewById(R.id.about_link2);
        source2.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent source2Intent = new Intent(Intent.ACTION_VIEW);
                source2Intent.setData(Uri.parse("http://www.freepik.com"));
                startActivity(source2Intent);
            }
        });
        TextView source3 = findViewById(R.id.about_link3);
        source3.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent source3Intent = new Intent(Intent.ACTION_VIEW);
                source3Intent.setData(Uri.parse("http://www.flaticon.com"));
                startActivity(source3Intent);
            }
        });
        TextView source4 = findViewById(R.id.about_link4);
        source4.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent source4Intent = new Intent(Intent.ACTION_VIEW);
                source4Intent.setData(Uri.parse("http://creativecommons.org/licenses/by/3.0/"));
                startActivity(source4Intent);
            }
        });
    }


}
