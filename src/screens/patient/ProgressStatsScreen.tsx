import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { patientApi } from '../../api/patientApi';
import { DonutChart, WeeklyBarChart } from '../../components/PediIllustrations';
import { COLORS } from '../../theme/colors';
import { PatientTodayDashboard } from '../../types/patient';
import { gamificationStorage } from '../../utils/gamificationStorage';

export const ProgressStatsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [period, setPeriod] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [dashboard, setDashboard] = useState<PatientTodayDashboard | null>(null);
  const [stars, setStars] = useState(0);

  useFocusEffect(
    useCallback(() => {
      patientApi.getTodayDashboard().then(async (d) => {
        setDashboard(d);
        const g = await gamificationStorage.get(d.patientCode);
        setStars(g.totalStars);
      });
    }, [])
  );

  const completed = dashboard?.completedCountToday ?? 0;
  const total = Math.max(dashboard?.totalCountToday ?? 1, 1);
  const pct = Math.round((completed / total) * 100);

  const easyCount =
    dashboard?.exercises.filter((e) => e.todayDifficultyEmoji === 1).length ?? 0;
  const normalCount =
    dashboard?.exercises.filter((e) => e.todayDifficultyEmoji === 2).length ?? 0;
  const hardCount =
    dashboard?.exercises.filter((e) => e.todayDifficultyEmoji === 3).length ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.indigoDark} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>İlerlemem</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Haftalık / Aylık Sekme */}
        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[styles.segmentBtn, period === 'WEEKLY' && styles.segmentActive]}
            onPress={() => setPeriod('WEEKLY')}
          >
            <Text style={[styles.segmentText, period === 'WEEKLY' && styles.segmentTextActive]}>
              Haftalık
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, period === 'MONTHLY' && styles.segmentActive]}
            onPress={() => setPeriod('MONTHLY')}
          >
            <Text style={[styles.segmentText, period === 'MONTHLY' && styles.segmentTextActive]}>
              Aylık
            </Text>
          </TouchableOpacity>
        </View>

        {/* Donut & Özet Kart */}
        <View style={styles.card}>
          <View style={styles.donutRow}>
            <DonutChart percent={pct} subtitle="Tamamlama" size={120} />
            <View style={styles.statList}>
              <Text style={styles.statLine}>
                <Text style={{ color: COLORS.indigo }}>● </Text>
                Bugünkü Hedef: <Text style={styles.statBold}>{total}</Text>
              </Text>
              <Text style={styles.statLine}>
                <Text style={{ color: COLORS.green }}>● </Text>
                Tamamlanan: <Text style={styles.statBold}>{completed}</Text>
              </Text>
              <Text style={styles.statLine}>
                <Text style={{ color: COLORS.amber }}>● </Text>
                Toplam Yıldız: <Text style={styles.statBold}>⭐ {stars}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Gün Bazlı Tamamlanma */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gün Bazlı Tamamlanma</Text>
          <WeeklyBarChart values={[2, 3, 2, 4, 3, 2, Math.max(completed, 1)]} />
        </View>

        {/* Zorluk Emojileri */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Zorluk Emojileri</Text>
          <View style={styles.emojiSummaryRow}>
            <View style={styles.emojiItem}>
              <Text style={styles.emojiIcon}>😊</Text>
              <Text style={styles.emojiNum}>{easyCount}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.emojiItem}>
              <Text style={styles.emojiIcon}>😐</Text>
              <Text style={styles.emojiNum}>{normalCount}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.emojiItem}>
              <Text style={styles.emojiIcon}>😢</Text>
              <Text style={styles.emojiNum}>{hardCount}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topTitle: { fontSize: 18, fontWeight: '800', color: COLORS.indigoDark },
  content: { paddingHorizontal: 18, paddingBottom: 32 },

  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: COLORS.indigoSoft,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 13, alignItems: 'center' },
  segmentActive: { backgroundColor: COLORS.indigo },
  segmentText: { fontWeight: '700', color: COLORS.indigoDark },
  segmentTextActive: { color: '#FFFFFF' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.indigoDark, marginBottom: 10 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  statList: { flex: 1, gap: 10 },
  statLine: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  statBold: { fontWeight: '900', color: COLORS.indigoDark },

  emojiSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  emojiItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emojiIcon: { fontSize: 28 },
  emojiNum: { fontSize: 18, fontWeight: '900', color: COLORS.indigoDark },
  divider: { width: 1, height: 28, backgroundColor: COLORS.border },
});
