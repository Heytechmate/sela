package com.infash.cinevault;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.widget.RemoteViews;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * CineVault Home Screen Widget
 * Reads directly from the Expo SQLite database to show live stats.
 *
 * Shows:
 *  - Watched count
 *  - Watchlist count
 *  - Total hours watched
 *  - Last watched movie title
 */
public class CineVaultWidget extends AppWidgetProvider {

    private static final String DB_NAME = "cinevault.db";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.cinevault_widget);

        // ── Read stats from SQLite ──────────────────────────────
        int watched   = 0;
        int watchlist = 0;
        int hours     = 0;
        String lastWatched = "—";

        try {
            // Expo SQLite stores DBs in the app's database directory
            File dbFile = context.getDatabasePath(DB_NAME);
            if (!dbFile.exists()) {
                // Try alternate path used by expo-sqlite
                dbFile = new File(context.getFilesDir(), "../databases/" + DB_NAME);
            }

            if (dbFile.exists()) {
                SQLiteDatabase db = SQLiteDatabase.openDatabase(
                    dbFile.getPath(), null, SQLiteDatabase.OPEN_READONLY
                );

                // Counts by status
                Cursor cur = db.rawQuery(
                    "SELECT " +
                    "SUM(CASE WHEN status='watched' THEN 1 ELSE 0 END) as watched, " +
                    "SUM(CASE WHEN status='watchlist' THEN 1 ELSE 0 END) as watchlist, " +
                    "SUM(CASE WHEN status='watched' THEN runtime ELSE 0 END) as total_mins " +
                    "FROM movies", null
                );
                if (cur.moveToFirst()) {
                    watched   = cur.getInt(0);
                    watchlist = cur.getInt(1);
                    int totalMins = cur.getInt(2);
                    hours = totalMins / 60;
                }
                cur.close();

                // Last watched title
                Cursor lastCur = db.rawQuery(
                    "SELECT title FROM movies WHERE status='watched' ORDER BY watch_date DESC LIMIT 1",
                    null
                );
                if (lastCur.moveToFirst()) {
                    lastWatched = lastCur.getString(0);
                }
                lastCur.close();
                db.close();
            }
        } catch (Exception e) {
            // Silently fail — widget shows zeros if DB not readable
        }

        // ── Populate views ──────────────────────────────────────
        views.setTextViewText(R.id.widget_watched_count,  String.valueOf(watched));
        views.setTextViewText(R.id.widget_watchlist_count, String.valueOf(watchlist));
        views.setTextViewText(R.id.widget_hours,          String.valueOf(hours));
        views.setTextViewText(R.id.widget_last_watched,   lastWatched);

        String timeStamp = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());
        views.setTextViewText(R.id.widget_last_updated, timeStamp);

        // ── Tap to open app ─────────────────────────────────────
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_watched_count, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
