import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { PatientStackParamList } from '../../navigation/PatientNavigator';
import { COLORS } from '../../theme/colors';
import {
  AVATAR_OPTIONS,
  gamificationStorage,
  GamificationData,
} from '../../utils/gamificationStorage';
import {
  reminderNotifications,
  ReminderSettings,
} from '../../utils/reminderNotifications';

export const PatientProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PatientStackParamList>>();
  const { user, logout } = useAuth();
  const patientCode = user?.username ?? 'SP-01';

  const [gamification, setGamification] = useState<GamificationData>({
    avatarId: 'lion',
    totalStars: 0,
  });
  const [reminder, setReminder] = useState<ReminderSettings>({
    enabled: false,
    hour: 18,
    minute: 30,
  });
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      gamificationStorage.get(patientCode).then(setGamification);
      reminderNotifications.getSettings(patientCode).then(setReminder);
    }, [patientCode])
  );

  const handleToggleReminder = async (next: boolean) => {
    try {
      if (next) {
        const updated = await reminderNotifications.enableDailyReminder(patientCode, 18, 30);
        setReminder(updated);
        Alert.alert('Bildirim Açıldı ✓', 'Her gün 18:30 için egzersiz hatırlatıcısı kuruldu.');
      } else {
        const updated = await reminderNotifications.disableDailyReminder(patientCode);
        setReminder(updated);
      }
    } catch {
      Alert.alert('İzin Gerekli', 'Bildirimler için cihaz ayarlarından izin verin.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Profil</Text>

        {/* Büyük SP Avatarı */}
        <View style={styles.profileHeader}>
          <View style={styles.bigCircle}>
            <Text style={styles.bigCircleText}>SP</Text>
          </View>
          <Text style={styles.codeText}>{patientCode}</Text>
          <Text style={styles.subCodeText}>Hesap Kodu • ⭐ {gamification.totalStars} Yıldız</Text>
        </View>

        {/* Temiz Ayarlar Listesi */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('ProgressStats')}
          >
            <View style={[styles.menuIcon, { backgroundColor: COLORS.greenSoft }]}>
              <Ionicons name="stats-chart" size={18} color={COLORS.green} />
            </View>
            <Text style={styles.menuText}>İlerlemem ve İstatistikler</Text>
            <Ionicons name="chevron-forward" size={18} color="#B8BEDB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setAvatarModalVisible(true)}
          >
            <View style={[styles.menuIcon, { backgroundColor: COLORS.indigoSoft }]}>
              <Ionicons name="happy" size={18} color={COLORS.indigo} />
            </View>
            <Text style={styles.menuText}>Çocuğumun Avatarı ve Rozetleri</Text>
            <Ionicons name="chevron-forward" size={18} color="#B8BEDB" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('SickMode')}
          >
            <View style={[styles.menuIcon, { backgroundColor: COLORS.amberSoft }]}>
              <Ionicons name="heart" size={18} color={COLORS.amber} />
            </View>
            <Text style={styles.menuText}>Hastalık / Mola Modu</Text>
            <Ionicons name="chevron-forward" size={18} color="#B8BEDB" />
          </TouchableOpacity>

          <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.skySoft }]}>
              <Ionicons name="notifications" size={18} color="#0284C7" />
            </View>
            <Text style={styles.menuText}>Bildirimler (18:30)</Text>
            <Switch
              value={reminder.enabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: '#CBD5E1', true: COLORS.indigo }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.menuRow}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.indigoSoft }]}>
              <Ionicons name="globe-outline" size={18} color={COLORS.indigo} />
            </View>
            <Text style={styles.menuText}>Dilimi Seçin</Text>
            <Text style={styles.langVal}>Türkçe ›</Text>
          </View>

          <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={logout}>
            <View style={[styles.menuIcon, { backgroundColor: COLORS.redSoft }]}>
              <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
            </View>
            <Text style={[styles.menuText, { color: COLORS.red }]}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Avatar Seçim Modalı */}
      <Modal
        visible={avatarModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Oyun Arkadaşını Seç</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((av) => {
                const selected = gamification.avatarId === av.id;
                return (
                  <TouchableOpacity
                    key={av.id}
                    style={[
                      styles.avatarChoice,
                      { backgroundColor: av.bg },
                      selected && { borderColor: COLORS.indigo },
                    ]}
                    onPress={async () => {
                      const updated = await gamificationStorage.setAvatar(patientCode, av.id);
                      setGamification(updated);
                      setAvatarModalVisible(false);
                    }}
                  >
                    <Text style={{ fontSize: 32 }}>{av.emoji}</Text>
                    <Text style={styles.avatarChoiceName}>{av.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setAvatarModalVisible(false)}
            >
              <Text style={{ fontWeight: '800', color: COLORS.indigoDark }}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: COLORS.indigoDark, textAlign: 'center' },

  profileHeader: { alignItems: 'center', marginVertical: 20 },
  bigCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.indigo,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bigCircleText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  codeText: { fontSize: 20, fontWeight: '900', color: COLORS.indigoDark },
  subCodeText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginTop: 3 },

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.indigoDark },
  langVal: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(43,45,85,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 34,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.indigoDark, marginBottom: 14 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  avatarChoice: {
    width: '31%',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarChoiceName: { fontSize: 11, fontWeight: '700', color: COLORS.text, marginTop: 4 },
  closeModalBtn: {
    backgroundColor: COLORS.indigoSoft,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
