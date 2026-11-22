import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { PatientStackParamList } from '../../navigation/PatientNavigator';
import { COLORS } from '../../theme/colors';
import { PatientTodayDashboard } from '../../types/patient';

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const THUMB_BG = ['#E6F2FF', '#FFF3DF', '#FFE8EE', '#E7F7EC'];
const THUMB_ICON = ['🦸', '🎈', '⚖️', '🧘'];

export const PatientExercisesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PatientStackParamList>>();
  const [dashboard, setDashboard] = useState<PatientTodayDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const weekDays = useMemo(() => {
    const today = new Date();
    const jsDay = today.getDay(); // 0=Paz, 1=Pzt...
    const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    return DAY_NAMES.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === today.toDateString();
      return { label, dateNum: d.getDate(), isToday };
    });
  }, []);

  const [selectedDayIdx, setSelectedDayIdx] = useState(() =>
    Math.max(0, weekDays.findIndex((d) => d.isToday))
  );

  useFocusEffect(
    useCallback(() => {
      patientApi
        .getTodayDashboard()
        .then(setDashboard)
        .finally(() => setLoading(false));
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Egzersizlerim</Text>
      </View>

      {/* Haftalık Takvim Şeridi */}
      <View style={styles.calendarRow}>
        {weekDays.map((d, idx) => {
          const active = idx === selectedDayIdx;
          return (
            <TouchableOpacity
              key={d.label}
              style={[styles.dayPill, active && styles.dayPillActive]}
              onPress={() => setSelectedDayIdx(idx)}
            >
              <Text style={[styles.dayLabel, active && styles.dayTextActive]}>{d.label}</Text>
              <Text style={[styles.dayNum, active && styles.dayTextActive]}>{d.dateNum}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.indigo} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bugünün Egzersizleri</Text>
            <Text style={styles.sectionCount}>
              {dashboard?.completedCountToday ?? 0}/{dashboard?.totalCountToday ?? 0} tamamlandı
            </Text>
          </View>

          {dashboard?.exercises.map((item, idx) => {
            const isDone =
              item.todayStatus === 'COMPLETED' || item.todayStatus === 'SICK_MODE_DONE';
            return (
              <TouchableOpacity
                key={`${item.programItemId ?? 'sick'}-${item.exerciseId}`}
                style={styles.card}
                onPress={() =>
                  navigation.navigate('ExerciseDetail', {
                    exercise: item,
                    isSickModeActive: Boolean(dashboard.isSickModeActive),
                    patientCode: dashboard.patientCode,
                  })
                }
              >
                <View style={[styles.thumb, { backgroundColor: THUMB_BG[idx % THUMB_BG.length] }]}>
                  <Text style={{ fontSize: 26 }}>{THUMB_ICON[idx % THUMB_ICON.length]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.sub}>
                    {item.targetReps
                      ? `${item.targetReps} tekrar`
                      : item.targetDurationSec
                        ? `${item.targetDurationSec} saniye`
                        : `${item.setsPerDay ?? 3} set`}
                  </Text>
                </View>
                {isDone ? (
                  <Ionicons name="checkmark-circle" size={26} color={COLORS.green} />
                ) : (
                  <Ionicons name="play-circle-outline" size={26} color="#B8BEDB" />
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.allBtn}
            onPress={() => navigation.navigate('ProgressStats')}
          >
            <Text style={styles.allBtnText}>İlerlememi ve İstatistikleri Gör</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.indigoDark },

  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  dayPill: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  dayPillActive: { backgroundColor: COLORS.indigo },
  dayLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 },
  dayNum: { fontSize: 14, fontWeight: '800', color: COLORS.indigoDark },
  dayTextActive: { color: '#FFFFFF' },

  content: { paddingHorizontal: 18, paddingBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.indigoDark },
  sectionCount: { fontSize: 12, fontWeight: '700', color: COLORS.indigo },

  card: {
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
  thumb: {
    width: 56,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 15, fontWeight: '800', color: COLORS.indigoDark },
  sub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },

  allBtn: {
    backgroundColor: COLORS.indigoSoft,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  allBtnText: { color: COLORS.indigo, fontWeight: '800', fontSize: 14 },
});
