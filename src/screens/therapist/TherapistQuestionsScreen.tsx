import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { therapistApi } from '../../api/therapistApi';
import { COLORS } from '../../theme/colors';
import { QuestionResponse } from '../../types/patient';

export const TherapistQuestionsScreen: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [onlyUnanswered, setOnlyUnanswered] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedQuestion, setSelectedQuestion] = useState<QuestionResponse | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const data = await therapistApi.getQuestions(onlyUnanswered);
      setQuestions(data);
    } catch {
      Alert.alert('Hata', 'Sorular yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onlyUnanswered]);

  useEffect(() => {
    setLoading(true);
    fetchQuestions();
  }, [fetchQuestions]);

  const handleReply = async () => {
    if (!selectedQuestion || !replyText.trim()) {
      Alert.alert('Uyarı', 'Lütfen yanıt metnini yazın.');
      return;
    }
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      await therapistApi.replyQuestion(selectedQuestion.id, {
        therapistReply: replyText.trim(),
      });
      setSelectedQuestion(null);
      setReplyText('');
      await fetchQuestions();
    } catch {
      Alert.alert('Hata', 'Yanıt gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Soru Kutusu</Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, onlyUnanswered && styles.filterChipActive]}
          onPress={() => setOnlyUnanswered(true)}
        >
          <Text style={[styles.filterText, onlyUnanswered && styles.filterTextActive]}>
            Bekleyenler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, !onlyUnanswered && styles.filterChipActive]}
          onPress={() => setOnlyUnanswered(false)}
        >
          <Text style={[styles.filterText, !onlyUnanswered && styles.filterTextActive]}>
            Tüm Sorular
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.indigo} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchQuestions();
              }}
            />
          }
        >
          {!questions.length ? (
            <Text style={styles.emptyText}>
              {onlyUnanswered ? 'Yanıt bekleyen soru kalmadı.' : 'Henüz soru sorulmamış.'}
            </Text>
          ) : (
            questions.map((q) => (
              <View key={q.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.code}>{q.patientCode}</Text>
                  <Text style={q.isAnswered ? styles.badgeAnswered : styles.badgePending}>
                    {q.isAnswered ? '✓ Yanıtlandı' : 'Bekliyor'}
                  </Text>
                </View>

                <Text style={styles.qText}>{q.questionText}</Text>

                {q.photoUrl ? (
                  <Image source={{ uri: q.photoUrl }} style={styles.attachedImg} />
                ) : null}

                {q.therapistReply ? (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyLabel}>Yanıtınız</Text>
                    <Text style={styles.replyText}>{q.therapistReply}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={styles.replyBtn}
                  onPress={() => {
                    setSelectedQuestion(q);
                    setReplyText(q.therapistReply ?? '');
                  }}
                >
                  <Text style={styles.replyBtnText}>
                    {q.isAnswered ? 'Yanıtı Güncelle' : 'Yanıtla'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={Boolean(selectedQuestion)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedQuestion(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Gri boş alana dokununca klavyeyi indirir */}
          <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} />

          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yanıtla ({selectedQuestion?.patientCode})</Text>
              <TouchableOpacity onPress={Keyboard.dismiss}>
                <Text style={styles.hideKbText}>Klavyeyi Kapat</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.quotedQ}>{selectedQuestion?.questionText}</Text>

            <TextInput
              style={styles.input}
              placeholder="Aileye yönlendirmenizi yazın..."
              placeholderTextColor="#9CA3AF"
              multiline
              autoFocus
              value={replyText}
              onChangeText={setReplyText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  Keyboard.dismiss();
                  setSelectedQuestion(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleReply}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Yanıtı Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: COLORS.indigoDark },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginBottom: 10 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.indigoSoft,
  },
  filterChipActive: { backgroundColor: COLORS.indigo },
  filterText: { fontSize: 13, fontWeight: '700', color: COLORS.indigoDark },
  filterTextActive: { color: '#FFFFFF' },

  content: { paddingHorizontal: 18, paddingBottom: 32 },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 32 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  code: { fontSize: 15, fontWeight: '900', color: COLORS.indigoDark },
  badgeAnswered: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.greenDark,
    backgroundColor: COLORS.greenSoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  badgePending: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    backgroundColor: COLORS.amberSoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  qText: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: 10 },
  attachedImg: { width: '100%', height: 180, borderRadius: 14, marginBottom: 10 },
  replyBox: { backgroundColor: COLORS.indigoSoft, borderRadius: 12, padding: 12, marginBottom: 10 },
  replyLabel: { fontSize: 11, fontWeight: '800', color: COLORS.indigo, marginBottom: 3 },
  replyText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
  replyBtn: { backgroundColor: COLORS.indigo, borderRadius: 16, paddingVertical: 11, alignItems: 'center' },
  replyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43,45,85,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '900', color: COLORS.indigoDark },
  hideKbText: { fontSize: 12, fontWeight: '700', color: COLORS.indigo },
  quotedQ: {
    fontSize: 13,
    color: COLORS.textMuted,
    backgroundColor: COLORS.bg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    minHeight: 84,
    textAlignVertical: 'top',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 14,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.text, fontWeight: '700' },
  saveBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: COLORS.indigo,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800' },
});
