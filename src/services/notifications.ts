import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

/*
|--------------------------------------------------------------------------
| DOSEWISE NOTIFICATION SERVICE
|--------------------------------------------------------------------------
|
| This service handles:
|
| - Notification permissions
| - Android medication notification channel
| - Scheduling medication reminders
| - Repeating daily reminders
| - Cancelling individual reminders
| - Cancelling medication reminders
| - Notification data for navigation
|
|--------------------------------------------------------------------------
*/

export const MEDICATION_CHANNEL_ID =
  'dosewise-medication-reminders';

export type MedicationReminderData = {
  medicationId: string;
  medicationName: string;
  dosage?: string | null;
  scheduleId?: string | null;
  time: string;
};

export type ScheduleMedicationReminderParams = {
  medicationId: string;
  medicationName: string;
  dosage?: string | null;
  scheduleId?: string | null;

  /**
   * Expected format:
   * HH:mm
   *
   * Examples:
   * 08:00
   * 14:30
   * 21:15
   */
  time: string;
};

/*
|--------------------------------------------------------------------------
| FOREGROUND NOTIFICATION BEHAVIOUR
|--------------------------------------------------------------------------
|
| If DoseWise is open when a reminder fires, Expo still shows
| the notification banner and plays the configured notification sound.
|
*/

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/*
|--------------------------------------------------------------------------
| CREATE ANDROID NOTIFICATION CHANNEL
|--------------------------------------------------------------------------
*/

export async function configureNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(
    MEDICATION_CHANNEL_ID,
    {
      name: 'Medication Reminders',

      description:
        'DoseWise reminders for scheduled medications.',

      importance:
        Notifications.AndroidImportance.MAX,

      sound: 'default',

      vibrationPattern: [
        0,
        250,
        250,
        250,
      ],

      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,

      enableVibrate: true,

      showBadge: true,
    }
  );
}

/*
|--------------------------------------------------------------------------
| REQUEST NOTIFICATION PERMISSION
|--------------------------------------------------------------------------
|
| Returns true when DoseWise is allowed to send notifications.
|
*/

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    await configureNotificationChannel();

    const currentPermissions =
      await Notifications.getPermissionsAsync();

    if (
      currentPermissions.status ===
      'granted'
    ) {
      return true;
    }

    const requestedPermissions =
      await Notifications.requestPermissionsAsync();

    return (
      requestedPermissions.status ===
      'granted'
    );
  } catch (error) {
    console.error(
      'DoseWise notification permission error:',
      error
    );

    return false;
  }
}

/*
|--------------------------------------------------------------------------
| CHECK NOTIFICATION PERMISSION
|--------------------------------------------------------------------------
*/

export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const permissions =
      await Notifications.getPermissionsAsync();

    return (
      permissions.status ===
      'granted'
    );
  } catch (error) {
    console.error(
      'DoseWise notification permission check error:',
      error
    );

    return false;
  }
}

/*
|--------------------------------------------------------------------------
| PARSE MEDICATION TIME
|--------------------------------------------------------------------------
|
| Converts "08:30" into:
|
| {
|   hour: 8,
|   minute: 30
| }
|
*/

function parseMedicationTime(
  time: string
): {
  hour: number;
  minute: number;
} {
  const parts = time
    .trim()
    .split(':');

  if (parts.length < 2) {
    throw new Error(
      `Invalid medication time: ${time}`
    );
  }

  const hour = Number(
    parts[0]
  );

  const minute = Number(
    parts[1]
  );

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error(
      `Invalid medication time: ${time}`
    );
  }

  return {
    hour,
    minute,
  };
}

/*
|--------------------------------------------------------------------------
| BUILD REMINDER MESSAGE
|--------------------------------------------------------------------------
*/

function buildMedicationReminderBody(
  medicationName: string,
  dosage?: string | null
) {
  if (
    dosage &&
    dosage.trim().length > 0
  ) {
    return `It's time to take ${medicationName} — ${dosage}.`;
  }

  return `It's time to take ${medicationName}.`;
}

/*
|--------------------------------------------------------------------------
| SCHEDULE DAILY MEDICATION REMINDER
|--------------------------------------------------------------------------
|
| This creates one repeating local notification.
|
| Example:
|
| medication: Amoxicillin
| dosage: 500 mg
| time: 08:00
|
| DoseWise will schedule a reminder every day at 08:00.
|
*/

export async function scheduleMedicationReminder(
  params: ScheduleMedicationReminderParams
): Promise<string> {
  const {
    medicationId,
    medicationName,
    dosage,
    scheduleId,
    time,
  } = params;

  if (!medicationId) {
    throw new Error(
      'Medication ID is required.'
    );
  }

  if (
    !medicationName ||
    medicationName.trim().length ===
      0
  ) {
    throw new Error(
      'Medication name is required.'
    );
  }

  const permissionGranted =
    await requestNotificationPermissions();

  if (!permissionGranted) {
    throw new Error(
      'Notification permission was not granted.'
    );
  }

  const {
    hour,
    minute,
  } = parseMedicationTime(time);

  const notificationId =
    await Notifications.scheduleNotificationAsync(
      {
        content: {
          title:
            'Medication Reminder',

          body:
            buildMedicationReminderBody(
              medicationName,
              dosage
            ),

          sound: 'default',

          data: {
            type:
              'medication-reminder',

            medicationId,

            medicationName,

            dosage:
              dosage ?? null,

            scheduleId:
              scheduleId ?? null,

            time,
          },
        },

        trigger: {
          type:
            Notifications.SchedulableTriggerInputTypes.DAILY,

          hour,

          minute,

          channelId:
            Platform.OS ===
            'android'
              ? MEDICATION_CHANNEL_ID
              : undefined,
        },
      }
    );

  return notificationId;
}

/*
|--------------------------------------------------------------------------
| SCHEDULE MULTIPLE REMINDERS
|--------------------------------------------------------------------------
|
| A medication may have more than one schedule:
|
| 08:00
| 14:00
| 20:00
|
| This helper schedules all of them.
|
*/

export async function scheduleMedicationReminders(
  reminders: ScheduleMedicationReminderParams[]
): Promise<string[]> {
  const scheduledIds: string[] =
    [];

  try {
    for (
      const reminder of reminders
    ) {
      const id =
        await scheduleMedicationReminder(
          reminder
        );

      scheduledIds.push(id);
    }

    return scheduledIds;
  } catch (error) {
    /*
     * If scheduling fails halfway through,
     * remove the reminders that were already
     * created during this operation.
     */

    for (
      const notificationId of scheduledIds
    ) {
      try {
        await Notifications.cancelScheduledNotificationAsync(
          notificationId
        );
      } catch (cancelError) {
        console.error(
          'Unable to roll back notification:',
          cancelError
        );
      }
    }

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL ONE NOTIFICATION
|--------------------------------------------------------------------------
*/

export async function cancelNotification(
  notificationId: string
): Promise<void> {
  if (!notificationId) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(
      notificationId
    );
  } catch (error) {
    console.error(
      'Unable to cancel DoseWise notification:',
      error
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL MULTIPLE NOTIFICATIONS
|--------------------------------------------------------------------------
*/

export async function cancelNotifications(
  notificationIds: string[]
): Promise<void> {
  for (
    const notificationId of notificationIds
  ) {
    try {
      await Notifications.cancelScheduledNotificationAsync(
        notificationId
      );
    } catch (error) {
      console.error(
        `Unable to cancel notification ${notificationId}:`,
        error
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL ALL REMINDERS FOR ONE MEDICATION
|--------------------------------------------------------------------------
|
| This reads scheduled notifications from the device and removes only
| reminders belonging to the specified medication.
|
*/

export async function cancelMedicationReminders(
  medicationId: string
): Promise<void> {
  if (!medicationId) {
    return;
  }

  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();

  const matchingNotifications =
    scheduledNotifications.filter(
      (notification) => {
        const data =
          notification.content
            .data as
            | Record<
                string,
                unknown
              >
            | undefined;

        return (
          data?.type ===
            'medication-reminder' &&
          data?.medicationId ===
            medicationId
        );
      }
    );

  for (
    const notification of matchingNotifications
  ) {
    try {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    } catch (error) {
      console.error(
        `Unable to cancel reminder ${notification.identifier}:`,
        error
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL ALL DOSEWISE MEDICATION REMINDERS
|--------------------------------------------------------------------------
|
| This does NOT blindly cancel every notification belonging to the app.
| It only cancels scheduled notifications whose data identifies them as
| DoseWise medication reminders.
|
*/

export async function cancelAllMedicationReminders(): Promise<void> {
  const scheduledNotifications =
    await Notifications.getAllScheduledNotificationsAsync();

  const medicationNotifications =
    scheduledNotifications.filter(
      (notification) => {
        const data =
          notification.content
            .data as
            | Record<
                string,
                unknown
              >
            | undefined;

        return (
          data?.type ===
          'medication-reminder'
        );
      }
    );

  for (
    const notification of medicationNotifications
  ) {
    try {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    } catch (error) {
      console.error(
        'Unable to cancel medication reminder:',
        error
      );
    }
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL SCHEDULED MEDICATION REMINDERS
|--------------------------------------------------------------------------
|
| Useful later for:
|
| Settings
| Debugging
| Rescheduling
| Synchronising notifications with Supabase
|
*/

export async function getScheduledMedicationReminders() {
  const notifications =
    await Notifications.getAllScheduledNotificationsAsync();

  return notifications.filter(
    (notification) => {
      const data =
        notification.content
          .data as
          | Record<
              string,
              unknown
            >
          | undefined;

      return (
        data?.type ===
        'medication-reminder'
      );
    }
  );
}

/*
|--------------------------------------------------------------------------
| RESCHEDULE A MEDICATION
|--------------------------------------------------------------------------
|
| Used after editing a medication.
|
| Existing reminders for that medication are removed first.
| Then the latest schedules are created.
|
*/

export async function rescheduleMedicationReminders(
  medicationId: string,
  reminders: ScheduleMedicationReminderParams[]
): Promise<string[]> {
  await cancelMedicationReminders(
    medicationId
  );

  if (
    reminders.length === 0
  ) {
    return [];
  }

  return scheduleMedicationReminders(
    reminders
  );
}

/*
|--------------------------------------------------------------------------
| TEST NOTIFICATION
|--------------------------------------------------------------------------
|
| We will use this during development to confirm that notifications
| work on the physical phone before connecting the medication database.
|
*/

export async function sendTestNotification(): Promise<string> {
  const permissionGranted =
    await requestNotificationPermissions();

  if (!permissionGranted) {
    throw new Error(
      'Notification permission was not granted.'
    );
  }

  return Notifications.scheduleNotificationAsync(
    {
      content: {
        title:
          'DoseWise Reminder',

        body:
          'Notifications are working. DoseWise can now remind you when it is time to take your medication.',

        sound: 'default',

        data: {
          type:
            'dosewise-test',
        },
      },

      trigger: {
        type:
          Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,

        seconds: 5,

        repeats: false,

        channelId:
          Platform.OS ===
          'android'
            ? MEDICATION_CHANNEL_ID
            : undefined,
      },
    }
  );
}

/*
|--------------------------------------------------------------------------
| INITIALIZE NOTIFICATIONS
|--------------------------------------------------------------------------
|
| Called when DoseWise starts.
|
*/

export async function initializeNotifications(): Promise<void> {
  try {
    await configureNotificationChannel();

    /*
     * Permission requests should normally happen when the user enables
     * reminders or schedules medication. We therefore don't force a
     * permission popup every time DoseWise starts.
     */

    if (!Device.isDevice) {
      console.log(
        'DoseWise notifications: running on a simulator/emulator. Test medication reminders on a physical device.'
      );
    }
  } catch (error) {
    console.error(
      'DoseWise notification initialization error:',
      error
    );
  }
}