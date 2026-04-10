package com.infash.cinevault.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.infash.cinevault.R
import android.content.SharedPreferences
import android.app.PendingIntent
import android.content.Intent
import com.infash.cinevault.MainActivity

class CineVaultWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val views = RemoteViews(context.packageName, R.layout.cinevault_widget)
            
            // Shared Preferences to bridge between React Native and Native Widget
            val prefs = context.getSharedPreferences("CineVaultPrefs", Context.MODE_PRIVATE)
            val watchedCount = prefs.getInt("watched_count", 0)
            val hoursWatched = prefs.getInt("hours_watched", 0)
            val currentlyWatching = prefs.getString("currently_watching", "Pick something to watch...")

            views.setTextViewText(R.id.stat_watched_val, watchedCount.toString())
            views.setTextViewText(R.id.stat_hours_val, hoursWatched.toString())
            views.setTextViewText(R.id.now_watching_title, currentlyWatching)

            // Open app on click
            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE)
            views.setOnClickPendingIntent(R.id.widget_title, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
