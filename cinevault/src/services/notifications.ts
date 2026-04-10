// Placeholder for notifications to prevent Expo Go SDK 53 errors
// Remote notifications are not supported in Expo Go for SDK 53+
export async function registerForPushNotificationsAsync() {
  console.log("Notifications disabled in Expo Go to prevent crash.");
  return false;
}

export async function scheduleNotification(title: string, body: string, date: Date, data?: any) {
  console.log("Notification scheduling skipped in Expo Go:", title);
  return null;
}

export async function cancelNotification(id: string) {
  return;
}

export async function getAllScheduled() {
  return [];
}
