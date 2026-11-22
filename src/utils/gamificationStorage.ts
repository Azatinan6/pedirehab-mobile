import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AvatarOption {
  id: string;
  emoji: string;
  name: string;
  bg: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'lion', emoji: '🦁', name: 'Cesur Aslan', bg: '#FEF3C7' },
  { id: 'panda', emoji: '🐼', name: 'Neşeli Panda', bg: '#DCFCE7' },
  { id: 'rabbit', emoji: '🐰', name: 'Hızlı Tavşan', bg: '#FCE7F3' },
  { id: 'astronaut', emoji: '🧑‍🚀', name: 'Minik Astronot', bg: '#E0F2FE' },
  { id: 'dino', emoji: '🦖', name: 'Güçlü Dino', bg: '#D1FAE5' },
  { id: 'butterfly', emoji: '🦋', name: 'Renkli Kelebek', bg: '#EDE9FE' },
];

export interface GamificationData {
  avatarId: string;
  totalStars: number;
}

const getKey = (patientCode: string) => `pedirehab_gamification_${patientCode}`;

export const gamificationStorage = {
  get: async (patientCode: string): Promise<GamificationData> => {
    try {
      const raw = await AsyncStorage.getItem(getKey(patientCode));
      if (raw) return JSON.parse(raw);
    } catch {
      // Varsayılan değer döner
    }
    return { avatarId: 'lion', totalStars: 0 };
  },

  setAvatar: async (patientCode: string, avatarId: string): Promise<GamificationData> => {
    const current = await gamificationStorage.get(patientCode);
    const updated = { ...current, avatarId };
    await AsyncStorage.setItem(getKey(patientCode), JSON.stringify(updated));
    return updated;
  },

  addStar: async (patientCode: string): Promise<GamificationData> => {
    const current = await gamificationStorage.get(patientCode);
    const updated = { ...current, totalStars: current.totalStars + 1 };
    await AsyncStorage.setItem(getKey(patientCode), JSON.stringify(updated));
    return updated;
  },
};

export const getAvatarById = (id: string): AvatarOption =>
  AVATAR_OPTIONS.find((a) => a.id === id) ?? AVATAR_OPTIONS[0];
