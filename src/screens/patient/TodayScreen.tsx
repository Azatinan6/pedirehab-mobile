import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { patientApi } from '../../api/patientApi';
import { StarTreeIllustration } from '../../components/PediIllustrations';
import { PatientStackParamList } from '../../navigation/PatientNavigator';
import { COLORS } from '../../theme/colors';
import { PatientTodayDashboard } from '../../types/patient';

const EXERCISE_THUMB_BG = ['#E6F2FF', '#FFF3DF', '#FFE8EE', '#E7F7EC'];
const EXERCISE_ICONS = ['🦸', '🎈', '⚖️', '🧘'];

export const TodayScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PatientStackParamList>>();
  const [dashboard, setDashboard] = useState<PatientTodayDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await patientApi.getTodayDashboard();
      setDashboard(data);
    } catch {
      Alert.alert('Bağlantı Hatası', 'Günlük program yüklenemedi. Sunucuyu kontrol edin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.indigo} />
      </View>
    );
  }

  const completed = dashboard?.completedCountToday ?? 0;
  const total = dashboard?.totalCountToday ?? 0;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchDashboard();
            }}
          />
        }
      >
        {/* Üst Çubuk: Merhaba 👋 SP-01 + Bildirim + SP Rozeti */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greetText}>Merhaba 👋</Text>
            <Text style={styles.codeTitle}>{dashboard?.patientCode ?? 'SP-01'} ⌄</Text>
          </View>
          <View style={styles.topRight}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => navigation.navigate('ProgressStats')}
            >
              <Ionicons name="stats-chart" size={18} color={COLORS.indigo} />
            </TouchableOpacity>
            <View style={styles.spAvatar}>
              <Text style={styles.spAvatarText}>SP</Text>
            </View>
          </View>
        </View>

        {/* Yıldızlı Ağaç İllüstrasyon Kartı */}
        <StarTreeIllustration completed={completed} total={total} />

        {/* Haftalık İlerleme Barı */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Bugünün ilerlemesi</Text>
            <Text style={styles.progressPct}>%{progressPct}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {/* Hastalık / Mola Modu Banner */}
        <TouchableOpacity
          style={[
            styles.sickBanner,
            dashboard?.isSickModeActive && styles.sickBannerActive,
          ]}
          onPress={() => navigation.navigate('SickMode')}
        >
          <View style={styles.sickIconWrap}>
            <Text style={{ fontSize: 22 }}>{dashboard?.isSickModeActive ? '🤒' : '🙂'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sickBannerTitle}>
              {dashboard?.isSickModeActive
                ? 'Hastalık / Mola Modu Aktif'
                : 'Çocuğum Bugün Hasta / Yorgun'}
            </Text>
            {dashboard?.isSickModeActive ? (
              <Text style={styles.sickBannerSub}>Nazik bakım egzersizleri devrede</Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.indigo} />
        </TouchableOpacity>

        {/* Bugünün Egzersizleri */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bugünün Egzersizleri</Text>
          <Text style={styles.sectionCount}>
            {completed}/{total} tamamlandı
          </Text>
        </View>

        {!dashboard?.exercises.length ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Bugün için atanmış egzersiz bulunmuyor.</Text>
          </View>
        ) : (
          dashboard.exercises.map((item, idx) => {
            const isDone =
              item.todayStatus === 'COMPLETED' || item.todayStatus === 'SICK_MODE_DONE';
            const doseLabel = item.targetReps
              ? `${item.targetReps} tekrar`
              : item.targetDurationSec
                ? `${item.targetDurationSec} saniye`
                : `${item.setsPerDay ?? 3} set`;

            return (
              <TouchableOpacity
                key={`${item.programItemId ?? 'sick'}-${item.exerciseId}`}
                style={styles.exerciseRowCard}
                onPress={() =>
                  navigation.navigate('ExerciseDetail', {
                    exercise: item,
                    isSickModeActive: Boolean(dashboard.isSickModeActive),
                    patientCode: dashboard.patientCode,
                  })
                }
              >
                <View
                  style={[
                    styles.thumbBox,
                    { backgroundColor: EXERCISE_THUMB_BG[idx % EXERCISE_THUMB_BG.length] },
                  ]}
                >
                  <Text style={{ fontSize: 26 }}>
                    {EXERCISE_ICONS[idx % EXERCISE_ICONS.length]}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.exTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.exSub}>
                    {doseLabel} {item.orthosisRequirement ? `• ${item.orthosisRequirement}` : ''}
                  </Text>
                </View>

                <View style={styles.exRight}>
                  {isDone ? (
                    <Ionicons name="checkmark-circle" size={26} color={COLORS.green} />
                  ) : (
                    <Ionicons name="play-circle-outline" size={26} color="#B8BEDB" />
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#C4C8DF" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 28 },

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  greetText: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  codeTitle: { fontSize: 21, fontWeight: '900', color: COLORS.indigoDark },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.indigoSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.indigo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spAvatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  progressSection: { marginBottom: 14 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  progressPct: { fontSize: 15, fontWeight: '900', color: COLORS.greenDark },
  progressTrack: {
    height: 9,
    backgroundColor: '#E3E7F5',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.green, borderRadius: 6 },

  sickBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.indigoSoft,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.indigoBorder,
  },
  sickBannerActive: { backgroundColor: COLORS.amberSoft, borderColor: '#FCD34D' },
  sickIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sickBannerTitle: { fontSize: 14, fontWeight: '800', color: COLORS.indigoDark },
  sickBannerSub: { fontSize: 11, color: '#92400E', fontWeight: '600', marginTop: 2 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.indigoDark },
  sectionCount: { fontSize: 12, fontWeight: '700', color: COLORS.indigo },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },

  exerciseRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbBox: {
    width: 54,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exTitle: { fontSize: 15, fontWeight: '800', color: COLORS.indigoDark },
  exSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  exRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
