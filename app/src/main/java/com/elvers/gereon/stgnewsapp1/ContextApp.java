package com.elvers.gereon.stgnewsapp1;

import android.app.Application;
import android.content.Context;


/**
 * Class solely exists to provide Application Context for abstract methods that require it
 * This is not good practice and usage of this class should therefore be minimized!
 * Try getContext() and Context.getApplicationContext() before falling back on this
 *
 * @author Gereon Elvers
 */
public class ContextApp extends Application {
    private static Application sApplication;

    public static Application getApplication() {
        return sApplication;
    }

    public static Context getContext() {
        return getApplication().getApplicationContext();
    }

    @Override
    public void onCreate() {
        super.onCreate();
        sApplication = this;
    }
}
