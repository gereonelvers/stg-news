package com.elvers.gereon.stgnewsapp1;
import android.os.Bundle;
import android.support.v7.preference.PreferenceFragmentCompat;

/**
 * Fragment responsible for displaying the preferences.xml file through Androids built-in settings library
 *
 * @author Gereon Elvers
 */
public class SettingsFragment extends PreferenceFragmentCompat {

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
        setPreferencesFromResource(R.xml.preferences, rootKey);
    }


}
