import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { therapistApi } from '../../api/therapistApi';
import { DonutChart, WeeklyBarChart } from '../../components/PediIllustrations';
import { useAuth } from '../../context/AuthContext';
import { TherapistTabParamList } from '../../navigation/TherapistTabs';
import { COLORS } from '../../theme/colors';
import { QuestionResponse } from '../../types/patient';
import { PatientSummary, TherapistDashboardSummary } from '../../types/therapist';

const PATIENT_AVATARS = [
  { emoji: '🦒', bg: '#FEF3C7' },
  { emoji: '🐻', bg: '#FDE8D8' },
  { emoji: '🐰', bg: '#FCE7F3' },
  { emoji: '🐸', bg: '#DCFCE7' },
  { emoji: '🦁', bg: '#E0F2FE' },
];

interface ParsedSpssMetrics {
  complianceByCode: Record<string, number>;
  avgCompliance: number;
  totalCompleted: number;
  totalSkipped: number;
  totalMinutes: number;
}

const parseSpssCsv = (csv: string): ParsedSpssMetrics => {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return {
      complianceByCode: {},
      avgCompliance: 0,
      totalCompleted: 0,
      totalSkipped: 0,
      totalMinutes: 0,
    };
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const codeIdx = headers.indexOf('patient_code');
  const compIdx = headers.indexOf('completed_logs');
  const skipIdx = headers.indexOf('skipped_logs');
  const sickDoneIdx = headers.indexOf('sick_mode_done_logs');
  const rateIdx = headers.indexOf('compliance_rate_pct');
  const minIdx = headers.indexOf('total_app_minutes');

  const complianceByCode: Record<string, number> = {};
  let totalCompleted = 0;
  let totalSkipped = 0;
  let totalMinutes = 0;
  let rateSum = 0;
  let rateCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const code = codeIdx >= 0 ? cols[codeIdx]?.trim() : '';
    const completed =
      (compIdx >= 0 ? Number(cols[compIdx]) || 0 : 0) +
      (sickDoneIdx >= 0 ? Number(cols[sickDoneIdx]) || 0 : 0);
    const skipped = skipIdx >= 0 ? Number(cols[skipIdx]) || 0 : 0;
    const rate = rateIdx >= 0 ? Math.round(Number(cols[rateIdx]) || 0) : 0;
    const mins = minIdx >= 0 ? Number(cols[minIdx]) || 0 : 0;

    if (code) {
      complianceByCode[code] = rate;
      rateSum += rate;
      rateCount += 1;
    }
    totalCompleted += completed;
    totalSkipped += skipped;
    totalMinutes += mins;
  }

  return {
    complianceByCode,
    avgCompliance: rateCount > 0 ? Math.round(rateSum / rateCount) : 0,
    totalCompleted,
    totalSkipped,
    totalMinutes: Math.round(totalMinutes),
  };
};

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TherapistTabParamList>>();
  const { user, logout } = useAuth();

  const [summary, setSummary] = useState<TherapistDashboardSummary | null>(null);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [metrics, setMetrics] = useState<ParsedSpssMetrics>({
    complianceByCode: {},
    avgCompliance: 0,
    totalCompleted: 0,
    totalSkipped: 0,
    totalMinutes: 0,
  });
  const [rawCsv, setRawCsv] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [csvModalVisible, setCsvModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [sumData, patData, qData, csvData] = await Promise.all([
        therapistApi.getDashboardSummary(),
        therapistApi.getPatients(false),
        therapistApi.getQuestions(false),
        therapistApi.exportSpssCsv().catch(() => ''),
      ]);

      setSummary(sumData);
      setPatients(patData);
      setQuestions(qData);
      setRawCsv(csvData);
      setMetrics(parseSpssCsv(csvData));
    } catch {
      Alert.alert('Hata', 'Panel verileri yüklenemedi. Sunucuyu kontrol edin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const handleShareCsv = async () => {
    if (!rawCsv) return;
    try {
      await Share.share({
        title: 'pedirehab_spss_export.csv',
        message: rawCsv,
      });
    } catch {
      Alert.alert('Hata', 'Paylaşım penceresi açılamadı.');
    }
  };

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.indigo} />
      </View>
    );
  }

  const firstName = user?.fullName?.replace(/^Fzt\.\s*/i, '').split(' ')[0] ?? 'Zeynep';
  const atRiskList = patients.filter((p) => p.isAtRisk);
  const latestQuestion = questions[0] ?? null;
  const durationLabel =
    metrics.totalMinutes >= 60
      ? `${(metrics.totalMinutes / 60).toFixed(1)} saat`
      : `${metrics.totalMinutes} dk`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Sabit Üst Karşılama & Çıkış Çubuğu (ScrollView dışında) */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.greeting} numberOfLines={1}>
            Merhaba {firstName} Hanım 👋
          </Text>
          <Text style={styles.subGreeting}>PediRehab'a hoş geldiniz!</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.bellBtn}
            onPress={() => navigation.navigate('Soru Kutusu')}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.indigoDark} />
            {(summary?.unansweredQuestions ?? 0) > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{summary?.unansweredQuestions}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.logoutIconBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={() => setLogoutModalVisible(true)}
          >
            <Ionicons name="log-out-outline" size={21} color={COLORS.red} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAll();
            }}
          />
        }
      >
        {/* 4 Pastel İstatistik Kartı */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: COLORS.indigoSoft }]}>
            <View style={[styles.kpiIcon, { backgroundColor: '#DCE0FD' }]}>
              <Ionicons name="people" size={18} color={COLORS.indigo} />
            </View>
            <Text style={styles.kpiLabel}>Toplam Hasta</Text>
            <Text style={styles.kpiValue}>{summary?.totalPatients ?? 0}</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: COLORS.greenSoft }]}>
            <View style={[styles.kpiIcon, { backgroundColor: '#C9EED6' }]}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
            </View>
            <Text style={styles.kpiLabel}>Tamamlanma Oranı</Text>
            <Text style={styles.kpiValue}>%{metrics.avgCompliance}</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: COLORS.amberSoft }]}>
            <View style={[styles.kpiIcon, { backgroundColor: '#FDE6B0' }]}>
              <Ionicons name="star" size={18} color={COLORS.amber} />
            </View>
            <Text style={styles.kpiLabel}>Tamamlanan Görev</Text>
            <Text style={styles.kpiValue}>{metrics.totalCompleted} ⭐</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: '#E9EDFE' }]}>
            <View style={[styles.kpiIcon, { backgroundColor: '#D6DDFC' }]}>
              <Ionicons name="time" size={18} color={COLORS.indigo} />
            </View>
            <Text style={styles.kpiLabel}>Uygulamada Süre</Text>
            <Text style={styles.kpiValue}>{durationLabel}</Text>
          </View>
        </View>

        {/* Hasta Takip Özeti (Hayvan Avatarlı İlerleme Çubukları) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Hasta Takip Özeti</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Hastalar')}>
              <Text style={styles.linkText}>Tüm Hastaları Gör →</Text>
            </TouchableOpacity>
          </View>

          {!patients.length ? (
            <Text style={styles.emptyText}>Henüz kayıtlı hasta bulunmuyor.</Text>
          ) : (
            patients.slice(0, 4).map((p, idx) => {
              const av = PATIENT_AVATARS[idx % PATIENT_AVATARS.length];
              const pct = metrics.complianceByCode[p.patientCode] ?? 0;
              const barColor =
                p.isAtRisk || pct < 45
                  ? COLORS.red
                  : pct < 75
                    ? COLORS.amber
                    : COLORS.green;

              return (
                <TouchableOpacity
                  key={p.patientCode}
                  style={styles.patientRow}
                  onPress={() => navigation.navigate('Hastalar')}
                >
                  <View style={[styles.animalAvatar, { backgroundColor: av.bg }]}>
                    <Text style={{ fontSize: 22 }}>{av.emoji}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.patientTopLine}>
                      <Text style={styles.patientCode}>{p.patientCode}</Text>
                      <Text style={styles.patientPct}>%{pct}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${Math.max(pct, 6)}%`, backgroundColor: barColor },
                        ]}
                      />
                    </View>
                  </View>

                  {p.isAtRisk ? (
                    <Ionicons name="warning" size={22} color={COLORS.red} />
                  ) : pct >= 75 ? (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
                  ) : (
                    <Ionicons name="alert-circle" size={22} color={COLORS.amber} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Riskli Hastalar Kartı */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Riskli Hastalar</Text>
            <View
              style={[
                styles.riskPill,
                atRiskList.length === 0 && { backgroundColor: COLORS.greenSoft },
              ]}
            >
              <Text
                style={[
                  styles.riskPillText,
                  atRiskList.length === 0 && { color: COLORS.greenDark },
                ]}
              >
                {atRiskList.length > 0
                  ? `▲ ${atRiskList.length} Hasta Risk Altında`
                  : '✓ Tüm Hastalar Stabil'}
              </Text>
            </View>
          </View>

          {atRiskList.length === 0 ? (
            <Text style={styles.emptyText}>Şu an acil müdahale gerektiren hasta yok.</Text>
          ) : (
            atRiskList.slice(0, 2).map((rp, i) => (
              <View key={rp.patientCode} style={styles.riskBox}>
                <View style={[styles.animalAvatar, { backgroundColor: '#FDE8D8' }]}>
                  <Text style={{ fontSize: 22 }}>
                    {PATIENT_AVATARS[(i + 1) % PATIENT_AVATARS.length].emoji}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientCode}>{rp.patientCode}</Text>
                  <Text style={styles.riskDesc} numberOfLines={2}>
                    {rp.riskReason || 'Üst üste atlama veya zorlanma tespit edildi.'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.inspectBtn}
                  onPress={() => navigation.navigate('Hastalar')}
                >
                  <Text style={styles.inspectBtnText}>İncele →</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Hızlı İşlemler */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { marginBottom: 12 }]}>Hızlı İşlemler</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: COLORS.indigoSoft }]}
              onPress={() => navigation.navigate('Hastalar')}
            >
              <Ionicons name="person-add" size={18} color={COLORS.indigo} />
              <Text style={styles.quickBtnText}>Yeni Hasta Ekle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: '#E9EDFE' }]}
              onPress={() => navigation.navigate('Kütüphane')}
            >
              <Ionicons name="play-circle" size={18} color={COLORS.indigo} />
              <Text style={styles.quickBtnText}>Egzersiz Ekle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: COLORS.indigoSoft }]}
              onPress={() => navigation.navigate('Hastalar')}
            >
              <Ionicons name="calendar" size={18} color={COLORS.indigo} />
              <Text style={styles.quickBtnText}>Program Ata</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: COLORS.greenSoft }]}
              onPress={() => setCsvModalVisible(true)}
            >
              <Ionicons name="download" size={18} color={COLORS.greenDark} />
              <Text style={[styles.quickBtnText, { color: COLORS.greenDark }]}>
                Rapor Al (SPSS)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Haftalık Genel Bakış (Donut + Çubuk Grafik) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Haftalık Genel Bakış</Text>
            <Text style={styles.periodTag}>Bu Hafta</Text>
          </View>

          <View style={styles.donutWrap}>
            <DonutChart percent={metrics.avgCompliance} subtitle="Uyum" size={114} />
            <View style={styles.legendCol}>
              <Text style={styles.legendLine}>
                <Text style={{ color: COLORS.green }}>● </Text>
                Tamamlanan: <Text style={styles.legendVal}>{metrics.totalCompleted}</Text>
              </Text>
              <Text style={styles.legendLine}>
                <Text style={{ color: COLORS.red }}>● </Text>
                Atlanan: <Text style={styles.legendVal}>{metrics.totalSkipped}</Text>
              </Text>
              <Text style={styles.legendLine}>
                <Text style={{ color: COLORS.amber }}>● </Text>
                Hastalık Modu:{' '}
                <Text style={styles.legendVal}>{summary?.sickModePatients ?? 0}</Text>
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <WeeklyBarChart
              values={[
                Math.max(1, metrics.totalCompleted),
                Math.max(2, metrics.totalCompleted + 1),
                Math.max(1, metrics.totalCompleted),
                Math.max(2, metrics.totalCompleted + 2),
                Math.max(1, metrics.totalCompleted),
                Math.max(1, metrics.totalCompleted),
                Math.max(1, metrics.totalCompleted + 1),
              ]}
            />
          </View>
        </View>

        {/* Soru Kutusu (Son Mesaj) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Soru Kutusu (Son Mesajlar)</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Soru Kutusu')}>
              <Text style={styles.linkText}>Tümünü Gör →</Text>
            </TouchableOpacity>
          </View>

          {!latestQuestion ? (
            <Text style={styles.emptyText}>Henüz ailelerden gelen soru bulunmuyor.</Text>
          ) : (
            <TouchableOpacity
              style={styles.msgCard}
              onPress={() => navigation.navigate('Soru Kutusu')}
            >
              <View style={styles.msgAvatar}>
                <Text style={{ fontSize: 20 }}>😊</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientCode}>{latestQuestion.patientCode}</Text>
                <Text style={styles.msgText} numberOfLines={2}>
                  {latestQuestion.questionText}
                </Text>
                <Text style={styles.msgDate}>
                  {new Date(latestQuestion.askedAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              {latestQuestion.photoUrl ? (
                <Image source={{ uri: latestQuestion.photoUrl }} style={styles.msgThumb} />
              ) : null}
            </TouchableOpacity>
          )}
        </View>

        {/* Alt Güvenli Çıkış Butonu */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.bottomLogoutBtn}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Ionicons name="log-out-outline" size={19} color={COLORS.red} />
          <Text style={styles.bottomLogoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Çıkış Onay Modalı */}
      <Modal
        visible={logoutModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <Ionicons name="log-out-outline" size={28} color={COLORS.red} />
            </View>
            <Text style={styles.confirmTitle}>Çıkış Yap</Text>
            <Text style={styles.confirmDesc}>
              Fizyoterapist hesabınızdan çıkış yapmak istiyor musunuz?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dangerBtn}
                onPress={handleConfirmLogout}
              >
                <Text style={styles.dangerBtnText}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SPSS CSV Önizleme ve Paylaşım Modalı */}
      <Modal
        visible={csvModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCsvModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>pedirehab_spss_export.csv</Text>
            <ScrollView style={styles.csvBox} horizontal>
              <ScrollView>
                <Text style={styles.csvText}>{rawCsv || 'Henüz veri bulunmuyor.'}</Text>
              </ScrollView>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCsvModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Kapat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShareCsv}>
                <Text style={styles.shareBtnText}>Paylaş / Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 32 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: COLORS.bg,
  },
  greeting: { fontSize: 21, fontWeight: '900', color: COLORS.indigoDark },
  subGreeting: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.red,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  logoutIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.redSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.redBorder,
  },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  kpiCard: {
    width: '48.3%',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  kpiValue: { fontSize: 21, fontWeight: '900', color: COLORS.indigoDark, marginTop: 2 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.indigoDark },
  linkText: { fontSize: 12, fontWeight: '800', color: COLORS.indigo },
  emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 8 },

  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },
  animalAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  patientCode: { fontSize: 14, fontWeight: '800', color: COLORS.indigoDark },
  patientPct: { fontSize: 13, fontWeight: '900', color: COLORS.indigoDark },
  barTrack: {
    height: 8,
    backgroundColor: '#E2E6F5',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5 },

  riskPill: {
    backgroundColor: COLORS.redSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  riskPillText: { fontSize: 11, fontWeight: '800', color: COLORS.red },
  riskBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
    marginBottom: 8,
  },
  riskDesc: { fontSize: 12, color: '#991B1B', marginTop: 2, lineHeight: 16 },
  inspectBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inspectBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.indigo },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: {
    width: '48.3%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  quickBtnText: { fontSize: 13, fontWeight: '800', color: COLORS.indigoDark },

  periodTag: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.indigo,
    backgroundColor: COLORS.indigoSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  donutWrap: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  legendCol: { flex: 1, gap: 8 },
  legendLine: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  legendVal: { fontWeight: '900', color: COLORS.indigoDark },

  msgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 12,
  },
  msgAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  msgText: { fontSize: 13, color: COLORS.text, marginTop: 2, lineHeight: 18 },
  msgDate: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '600' },
  msgThumb: { width: 52, height: 52, borderRadius: 12 },

  bottomLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 4,
  },
  bottomLogoutText: { color: COLORS.red, fontWeight: '800', fontSize: 15 },

  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43,45,85,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.redSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmTitle: { fontSize: 19, fontWeight: '900', color: COLORS.indigoDark, marginBottom: 6 },
  confirmDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  dangerBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: COLORS.red,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(43,45,85,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 34,
    maxHeight: '75%',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.indigoDark, marginBottom: 12 },
  csvBox: {
    backgroundColor: '#1E213D',
    borderRadius: 14,
    padding: 12,
    maxHeight: 260,
    marginBottom: 16,
  },
  csvText: { color: '#E2E8F0', fontSize: 12, fontFamily: 'Courier' },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.text, fontWeight: '700' },
  shareBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: COLORS.green,
    alignItems: 'center',
  },
  shareBtnText: { color: '#FFFFFF', fontWeight: '800' },
});
