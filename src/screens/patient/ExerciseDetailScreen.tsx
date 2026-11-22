import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { patientApi } from '../../api/patientApi';
import { ExerciseVideoPlayer } from '../../components/ExerciseVideoPlayer';
import { PatientStackParamList } from '../../navigation/PatientNavigator';
import { COLORS } from '../../theme/colors';
import { ExerciseLogStatus } from '../../types/patient';
import { gamificationStorage } from '../../utils/gamificationStorage';

const ORTHOSIS_CHOICES = ['AFO ile', 'Çıplak ayakla', 'Fark etmez'];
const SKIP_REASONS = [
  'Çocuk yorgun / uykulu',
  'Hastalık / ateş',
  'Zaman bulamadık',
  'Ağrı / huzursuzluk',
];

const DIFFICULTY_OPTIONS = [
  { value: 1, emoji: '😊', title: 'Kolaydı', sub: 'Keyifliydi', bg: '#E6F7EC', border: '#4BB567' },
  { value: 2, emoji: '😐', title: 'Normaldi', sub: 'Dengeliydi', bg: '#FFF6D6', border: '#F59E0B' },
  { value: 3, emoji: '😢', title: 'Çok zorlandı', sub: 'Ağladı', bg: '#FFE8E0', border: '#E5484D' },
];

export const ExerciseDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<PatientStackParamList, 'ExerciseDetail'>>();
  const { exercise, isSickModeActive, patientCode } = route.params;

  const [orthosisState, setOrthosisState] = useState(
    exercise.orthosisRequirement || ORTHOSIS_CHOICES[0]
  );
  const [celebrateVisible, setCelebrateVisible] = useState(false);
  const [skipModalVisible, setSkipModalVisible] = useState(false);
  const [difficultyEmoji, setDifficultyEmoji] = useState(1);
  const [parentNote, setParentNote] = useState('');
  const [skipReason, setSkipReason] = useState(SKIP_REASONS[0]);
  const [submitting, setSubmitting] = useState(false);

  const steps = exercise.instructions
    .split(/(?:\n|\.(?=\s|$))/)
    .map((s) => s.trim())
    .filter(Boolean);

  const speakGuide = () => {
    Speech.stop();
    Speech.speak(`${exercise.title}. ${exercise.instructions}`, {
      language: 'tr-TR',
      rate: 0.92,
    });
  };

  const openCelebration = () => {
    setCelebrateVisible(true);
    Speech.stop();
    Speech.speak('Harikasın! Görevi süper tamamladın, yeni bir yıldız kazandın!', {
      language: 'tr-TR',
      rate: 0.95,
      pitch: 1.08,
    });
  };

  const handleSaveCompleted = async () => {
    setSubmitting(true);
    try {
      const status: ExerciseLogStatus = isSickModeActive ? 'SICK_MODE_DONE' : 'COMPLETED';
      await patientApi.logExercise({
        programItemId: exercise.programItemId,
        exerciseId: exercise.exerciseId,
        status,
        appliedOrthosisState: orthosisState,
        difficultyEmoji,
        parentNote: parentNote.trim() || null,
      });
      await gamificationStorage.addStar(patientCode);
      setCelebrateVisible(false);
      navigation.goBack();
    } catch {
      Alert.alert('Hata', 'Kayıt gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSkipped = async () => {
    setSubmitting(true);
    try {
      await patientApi.logExercise({
        programItemId: exercise.programItemId,
        exerciseId: exercise.exerciseId,
        status: 'SKIPPED',
        skipReason,
        parentNote: parentNote.trim() || null,
      });
      setSkipModalVisible(false);
      navigation.goBack();
    } catch {
      Alert.alert('Hata', 'Kayıt gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const doseText = exercise.targetReps
    ? `${exercise.targetReps} Tekrar`
    : exercise.targetDurationSec
      ? `${exercise.targetDurationSec} Saniye`
      : `${exercise.setsPerDay ?? 3} Set`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Üst Geri Çubuğu */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.indigoDark} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Egzersiz Detayı</Text>
        <TouchableOpacity onPress={speakGuide} style={styles.audioCircle}>
          <Ionicons name="volume-high" size={20} color={COLORS.indigo} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Video Oynatıcı */}
        {exercise.mediaUrl ? (
          <ExerciseVideoPlayer uri={exercise.mediaUrl} />
        ) : (
          <View style={styles.noVideoBox}>
            <Text style={styles.noVideoText}>Video bulunamadı</Text>
          </View>
        )}

        {/* Egzersiz Başlığı + Sarı Yıldız */}
        <View style={styles.titleRow}>
          <Text style={styles.exTitle}>{exercise.title}</Text>
          <Text style={{ fontSize: 22 }}>⭐</Text>
        </View>

        {/* 3 Pastel Bilgi Kartı (Ortez / Dozaj / Malzeme) */}
        <View style={styles.infoGrid}>
          <View style={[styles.infoTile, { backgroundColor: COLORS.indigoSoft }]}>
            <Text style={styles.infoEmoji}>🦶</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {exercise.orthosisRequirement || 'Ortezsiz'}
            </Text>
          </View>

          <View style={[styles.infoTile, { backgroundColor: COLORS.amberSoft }]}>
            <Text style={styles.infoEmoji}>🔁</Text>
            <Text style={styles.infoValue}>{doseText}</Text>
          </View>

          <View style={[styles.infoTile, { backgroundColor: COLORS.pinkSoft }]}>
            <Text style={styles.infoEmoji}>🎈</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {exercise.requiredMaterial && exercise.requiredMaterial !== 'Yok'
                ? exercise.requiredMaterial
                : 'Malzemesiz'}
            </Text>
          </View>
        </View>

        {/* Nasıl Yapılır? */}
        <Text style={styles.sectionTitle}>Nasıl Yapılır?</Text>
        <View style={styles.stepsCard}>
          {steps.map((step, i) => (
            <Text key={i} style={styles.stepText}>
              <Text style={styles.stepNum}>{i + 1}. </Text>
              {step}
            </Text>
          ))}
        </View>

        {/* Dikkat! Uyarı Kutusu */}
        {exercise.warningText ? (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={26} color={COLORS.red} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Dikkat!</Text>
              <Text style={styles.warningText}>{exercise.warningText}</Text>
            </View>
          </View>
        ) : null}

        {/* Ortez / Ayakkabı Durumu */}
        <Text style={styles.sectionTitle}>Ortez / Ayakkabı Durumu</Text>
        <View style={styles.orthosisRow}>
          {ORTHOSIS_CHOICES.map((opt) => {
            const active = orthosisState === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.orthosisPill, active && styles.orthosisPillActive]}
                onPress={() => setOrthosisState(opt)}
              >
                <Text style={[styles.orthosisText, active && styles.orthosisTextActive]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Yeşil Tamamla Butonu */}
        <TouchableOpacity style={styles.completeBtn} onPress={openCelebration}>
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <Text style={styles.completeBtnText}>Tamamla</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipLink}
          onPress={() => setSkipModalVisible(true)}
        >
          <Text style={styles.skipLinkText}>Bugün yapamadık (Atla)</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* "Harikasın!" Tam Ekran Kutlama & Zorluk Değerlendirme Modalı */}
      <Modal visible={celebrateVisible} animationType="slide">
        <SafeAreaView style={styles.celebrateSafe}>
          <ScrollView contentContainerStyle={styles.celebrateContent}>
            <TouchableOpacity
              style={styles.closeCelebrate}
              onPress={() => {
                Speech.stop();
                setCelebrateVisible(false);
              }}
            >
              <Ionicons name="close" size={26} color={COLORS.textMuted} />
            </TouchableOpacity>

            <Text style={styles.confettiLine}>🎊 ✨ 🎉 ✨ 🎊</Text>
            <View style={styles.bigStarBubble}>
              <Text style={styles.bigStarEmoji}>⭐</Text>
            </View>

            <Text style={styles.celebrateTitle}>Harikasın!</Text>
            <Text style={styles.celebrateSub}>Görevi tamamladın 🎉</Text>

            <Text style={styles.questionPrompt}>Bugün bu egzersiz nasıl geçti?</Text>

            <View style={styles.emojiRow}>
              {DIFFICULTY_OPTIONS.map((opt) => {
                const selected = difficultyEmoji === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.emojiCard,
                      {
                        backgroundColor: selected ? opt.bg : '#FFFFFF',
                        borderColor: selected ? opt.border : COLORS.border,
                      },
                    ]}
                    onPress={() => setDifficultyEmoji(opt.value)}
                  >
                    <Text style={styles.emojiBig}>{opt.emoji}</Text>
                    <Text style={styles.emojiTitle}>{opt.title}</Text>
                    <Text style={styles.emojiSub}>{opt.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.noteLabel}>Veli Notu (isteğe bağlı)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Bugün notunuzu yazabilirsiniz..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={parentNote}
              onChangeText={setParentNote}
            />

            <TouchableOpacity
              style={styles.savePurpleBtn}
              onPress={handleSaveCompleted}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.savePurpleText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Atlama Nedeni Modalı */}
      <Modal visible={skipModalVisible} animationType="slide" transparent>
        <View style={styles.skipBackdrop}>
          <View style={styles.skipSheet}>
            <Text style={styles.skipSheetTitle}>Yapmama Nedeni</Text>
            <View style={styles.skipChipWrap}>
              {SKIP_REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.skipChip, skipReason === r && styles.skipChipActive]}
                  onPress={() => setSkipReason(r)}
                >
                  <Text style={[styles.skipChipText, skipReason === r && styles.skipChipTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.cancelSmallBtn}
                onPress={() => setSkipModalVisible(false)}
              >
                <Text style={{ fontWeight: '700', color: COLORS.text }}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmSkipBtn}
                onPress={handleSaveSkipped}
                disabled={submitting}
              >
                <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>Kaydet</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: { padding: 4 },
  topTitle: { fontSize: 18, fontWeight: '800', color: COLORS.indigoDark },
  audioCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.indigoSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: { paddingHorizontal: 18, paddingBottom: 34 },
  noVideoBox: {
    height: 180,
    borderRadius: 18,
    backgroundColor: COLORS.indigoSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  noVideoText: { color: COLORS.textMuted, fontWeight: '700' },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exTitle: { fontSize: 20, fontWeight: '900', color: COLORS.indigoDark, flex: 1, paddingRight: 8 },

  infoGrid: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  infoTile: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  infoEmoji: { fontSize: 20, marginBottom: 4 },
  infoValue: { fontSize: 12, fontWeight: '800', color: COLORS.indigoDark, textAlign: 'center' },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.indigoDark, marginBottom: 8 },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  stepText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  stepNum: { fontWeight: '900', color: COLORS.indigo },

  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.redSoft,
    borderWidth: 1,
    borderColor: COLORS.redBorder,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: { fontSize: 13, fontWeight: '900', color: COLORS.red, marginBottom: 2 },
  warningText: { fontSize: 12, color: '#991B1B', fontWeight: '600', lineHeight: 17 },

  orthosisRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  orthosisPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.indigoSoft,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  orthosisPillActive: { borderColor: COLORS.indigo, backgroundColor: '#DDE0FD' },
  orthosisText: { fontSize: 12, fontWeight: '700', color: COLORS.indigoDark },
  orthosisTextActive: { fontWeight: '900', color: COLORS.indigo },

  completeBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.green,
    borderRadius: 24,
    paddingVertical: 15,
  },
  completeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  skipLink: { alignItems: 'center', paddingVertical: 12 },
  skipLinkText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },

  celebrateSafe: { flex: 1, backgroundColor: COLORS.bg },
  celebrateContent: { padding: 22, alignItems: 'center' },
  closeCelebrate: { alignSelf: 'flex-end', padding: 6 },
  confettiLine: { fontSize: 24, marginBottom: 10 },
  bigStarBubble: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  bigStarEmoji: { fontSize: 64 },
  celebrateTitle: { fontSize: 30, fontWeight: '900', color: COLORS.indigoDark },
  celebrateSub: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted, marginTop: 4, marginBottom: 24 },
  questionPrompt: { fontSize: 16, fontWeight: '800', color: COLORS.indigoDark, marginBottom: 14 },

  emojiRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 20 },
  emojiCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 2,
  },
  emojiBig: { fontSize: 34, marginBottom: 6 },
  emojiTitle: { fontSize: 12, fontWeight: '800', color: COLORS.indigoDark, textAlign: 'center' },
  emojiSub: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', marginTop: 2 },

  noteLabel: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  noteInput: {
    width: '100%',
    minHeight: 84,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  savePurpleBtn: {
    width: '100%',
    backgroundColor: COLORS.indigo,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
  },
  savePurpleText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  skipBackdrop: { flex: 1, backgroundColor: 'rgba(43,45,85,0.45)', justifyContent: 'flex-end' },
  skipSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 34,
  },
  skipSheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.indigoDark, marginBottom: 12 },
  skipChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skipChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skipChipActive: { backgroundColor: COLORS.amberSoft, borderColor: COLORS.amber },
  skipChipText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  skipChipTextActive: { color: '#92400E', fontWeight: '800' },
  cancelSmallBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
  },
  confirmSkipBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: COLORS.amber,
    alignItems: 'center',
  },
});
