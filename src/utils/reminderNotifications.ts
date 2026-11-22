import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const getReminderKey = (patientCode: string) => `pedirehab_reminder_${patientCode}`;

export const reminderNotifications = {
  getSettings: async (patientCode: string): Promise<ReminderSettings> => {
    try {
      const raw = await AsyncStorage.getItem(getReminderKey(patientCode));
      if (raw) return JSON.parse(raw);
    } catch {
      // Varsayılan döner
    }
    return { enabled: false, hour: 18, minute: 0 };
  },

  enableDailyReminder: async (
    patientCode: string,
    hour: number,
    minute: number
  ): Promise<ReminderSettings> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      throw new Error('Bildirim izni verilmedi.');
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'PediRehab Egzersiz Zamanı ⭐',
        body: 'Bugünkü oyun görevlerimizi yapıp yeni yıldız kazanmaya hazır mısınız?',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    const settings: ReminderSettings = { enabled: true, hour, minute };
    await AsyncStorage.setItem(getReminderKey(patientCode), JSON.stringify(settings));
    return settings;
  },

  disableDailyReminder: async (patientCode: string): Promise<ReminderSettings> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const current = await reminderNotifications.getSettings(patientCode);
    const updated: ReminderSettings = { ...current, enabled: false };
    await AsyncStorage.setItem(getReminderKey(patientCode), JSON.stringify(updated));
    return updated;
  },
};
