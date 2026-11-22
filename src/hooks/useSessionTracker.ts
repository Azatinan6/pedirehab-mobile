import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { patientApi } from '../api/patientApi';

export const useSessionTracker = () => {
  const sessionStartRef = useRef<Date>(new Date());
  const appStateRef = useRef<string>(AppState.currentState ?? 'active');

  useEffect(() => {
    const flushSession = async () => {
      const startedAt = sessionStartRef.current;
      const endedAt = new Date();
      const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

      // En az 5 saniye süren anlamlı oturumları veritabanına kaydet
      if (durationSeconds >= 5) {
        try {
          await patientApi.recordSession({
            startedAt: startedAt.toISOString(),
            endedAt: endedAt.toISOString(),
            durationSeconds,
          });
        } catch {
          // Oturum kaydı sessizce arka planda çalışır, kullanıcı deneyimini bölmez
        }
      }
    };

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        flushSession();
      } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        sessionStartRef.current = new Date();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
      flushSession();
    };
  }, []);
};
