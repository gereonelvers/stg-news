package com.elvers.gereon.stgnewsapp1;
import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatDelegate;
import android.support.v7.preference.Preference;
import android.support.v7.preference.PreferenceFragmentCompat;

/**
 * Fragment responsible for displaying the preferences.xml file through Androids built-in settings library
 *
 * @author Gereon Elvers
 */
public class SettingsFragment extends PreferenceFragmentCompat {

    private SettingsActivity rootActivity;

    // this is ugly as hell, but android api forces me to do that (doesn't allow custom constructors)
    public void setRootActivity(SettingsActivity rootActivity) {
        this.rootActivity = rootActivity;
    }

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, final String rootKey) {
        setPreferencesFromResource(R.xml.preferences, rootKey);
        Preference pref = findPreference("dark_mode");
        pref.setOnPreferenceChangeListener(new Preference.OnPreferenceChangeListener() {
            @Override
            public boolean onPreferenceChange(Preference preference, Object o) {
                if(o instanceof Boolean) {
                    if((Boolean)o) {
                        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
                    } else {
                        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
                    }
                    if(rootActivity != null) {
                        rootActivity.finish();
                        startActivity(rootActivity.getIntent());
                    }
                    return true;
                }
                return false;
            }
        });
    }

}
