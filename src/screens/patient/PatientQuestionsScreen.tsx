import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { mediaApi } from '../../api/mediaApi';
import { patientApi } from '../../api/patientApi';
import { COLORS } from '../../theme/colors';
import { QuestionResponse } from '../../types/patient';

export const PatientQuestionsScreen: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const data = await patientApi.getQuestions();
      setQuestions(data);
    } catch {
      Alert.alert('Hata', 'Sorular yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAttachPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Fotoğraf eklemek için galeri izni vermelisiniz.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      const uploaded = await mediaApi.uploadMedia(
        asset.uri,
        asset.mimeType ?? 'image/jpeg',
        asset.fileName ?? `q_${Date.now()}.jpg`
      );
      setPhotoUrl(uploaded);
    } catch {
      Alert.alert('Hata', 'Fotoğraf yüklenemedi.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAsk = async () => {
    if (!questionText.trim()) {
      Alert.alert('Uyarı', 'Lütfen sorunuzu yazın.');
      return;
    }
    setSubmitting(true);
    try {
      await patientApi.askQuestion({ questionText: questionText.trim(), photoUrl });
      setQuestionText('');
      setPhotoUrl(null);
      await fetchQuestions();
    } catch {
      Alert.alert('Hata', 'Soru gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
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
          <Text style={styles.pageTitle}>Soru Kutusu</Text>

          {/* Pastel Üst Banner */}
          <View style={styles.bannerCard}>
            <View style={styles.bubbleIcons}>
              <View style={[styles.chatIcon, { backgroundColor: '#60A5FA' }]}>
                <Text style={styles.chatIconText}>?</Text>
              </View>
              <View style={[styles.chatIcon, { backgroundColor: COLORS.green }]}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.bannerText}>
              Bu hafta takıldığınız bir konu var mı? Bize yazın, size yardımcı olalım!
            </Text>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Sorunuzu yazın..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={questionText}
            onChangeText={setQuestionText}
          />

          {photoUrl ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: photoUrl }} style={styles.previewImg} />
              <TouchableOpacity onPress={() => setPhotoUrl(null)}>
                <Text style={styles.removePhoto}>Fotoğrafı Kaldır</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.photoBtn}
            onPress={handleAttachPhoto}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <ActivityIndicator color={COLORS.indigo} />
            ) : (
              <>
                <Ionicons name="camera" size={18} color={COLORS.indigo} />
                <Text style={styles.photoBtnText}>Fotoğraf Ekle</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendBtn, submitting && { opacity: 0.7 }]}
            onPress={handleAsk}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.sendBtnText}>Gönder</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Geçmiş Sorularım</Text>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.indigo} style={{ marginTop: 20 }} />
          ) : !questions.length ? (
            <Text style={styles.emptyText}>Henüz gönderilmiş sorunuz yok.</Text>
          ) : (
            questions.map((q) => (
              <View key={q.id} style={styles.qCard}>
                <Text style={styles.qText}>{q.questionText}</Text>

                {q.photoUrl ? (
                  <Image source={{ uri: q.photoUrl }} style={styles.attachedImg} />
                ) : null}

                <View style={styles.qFooter}>
                  <Text style={styles.qDate}>
                    {new Date(q.askedAt).toLocaleDateString('tr-TR')}
                  </Text>
                  <Text style={q.isAnswered ? styles.badgeAnswered : styles.badgePending}>
                    {q.isAnswered ? '✓ Yanıtlandı' : 'Bekliyor'}
                  </Text>
                </View>

                {q.therapistReply ? (
                  <View style={styles.replyBox}>
                    <Text style={styles.replyLabel}>Fizyoterapist Yanıtı</Text>
                    <Text style={styles.replyText}>{q.therapistReply}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 32 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: COLORS.indigoDark, marginBottom: 14 },

  bannerCard: {
    backgroundColor: COLORS.skySoft,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  bubbleIcons: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  chatIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIconText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  bannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.indigoDark,
    textAlign: 'center',
    lineHeight: 19,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    minHeight: 84,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  previewWrap: { marginBottom: 10, alignItems: 'flex-start' },
  previewImg: { width: 100, height: 100, borderRadius: 14, marginBottom: 4 },
  removePhoto: { fontSize: 12, fontWeight: '700', color: COLORS.red },

  photoBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.indigoSoft,
    borderRadius: 18,
    paddingVertical: 12,
    marginBottom: 10,
  },
  photoBtnText: { color: COLORS.indigoDark, fontWeight: '800', fontSize: 14 },

  sendBtn: {
    backgroundColor: COLORS.indigo,
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 22,
  },
  sendBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.indigoDark, marginBottom: 10 },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 12 },

  qCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qText: { fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: 10 },
  attachedImg: { width: '100%', height: 170, borderRadius: 12, marginBottom: 10 },
  qFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qDate: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  badgeAnswered: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.greenDark,
    backgroundColor: COLORS.greenSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  badgePending: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    backgroundColor: COLORS.amberSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  replyBox: { marginTop: 10, backgroundColor: COLORS.indigoSoft, borderRadius: 12, padding: 12 },
  replyLabel: { fontSize: 11, fontWeight: '800', color: COLORS.indigo, marginBottom: 3 },
  replyText: { fontSize: 13, color: COLORS.text, lineHeight: 18 },
});
