package com.elvers.gereon.stgnewsapp1.activities;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.preference.PreferenceManager;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import android.view.MenuItem;

import com.elvers.gereon.stgnewsapp1.R;
import com.elvers.gereon.stgnewsapp1.fragments.SettingsFragment;
import com.elvers.gereon.stgnewsapp1.utils.Utils;

/**
 * Activity that manages the settings displayed within the App
 *
 * @author Gereon Elvers
 */
public class SettingsActivity extends AppCompatActivity implements SharedPreferences.OnSharedPreferenceChangeListener {

    /**
     * Since it is best practice to manage settings through a SettingsFragment utilizing a preferences.xml file,
     * this Activity just displays the fragment in a Layout matching the rest of App.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        Utils.updateNightMode(this);
        PreferenceManager.getDefaultSharedPreferences(this).registerOnSharedPreferenceChangeListener(this);

        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        ActionBar actionbar = getSupportActionBar();
        if (actionbar != null) {
            actionbar.setDisplayHomeAsUpEnabled(true);
            actionbar.setTitle(R.string.settings_string);
        }
        SettingsFragment settingsFragment = new SettingsFragment();
        getSupportFragmentManager().beginTransaction().replace(R.id.fragment_ll, settingsFragment).commit();
    }

    @Override
    public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
        if (key.equals("dark_mode")) {
            recreate();
        }
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            onBackPressed();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

}