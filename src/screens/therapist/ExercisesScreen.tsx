import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { mediaApi } from '../../api/mediaApi';
import { therapistApi } from '../../api/therapistApi';
import { COLORS } from '../../theme/colors';
import { ExerciseItem } from '../../types/therapist';

export const ExercisesScreen: React.FC = () => {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [onlySickMode, setOnlySickMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Denge ve Gövde Kontrolü');
  const [mediaUrl, setMediaUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [requiredMaterial, setRequiredMaterial] = useState('Yok');
  const [warningText, setWarningText] = useState('');
  const [orthosisRequirement, setOrthosisRequirement] = useState('AFO ile');
  const [isSickModeCare, setIsSickModeCare] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchExercises = useCallback(async () => {
    try {
      const data = await therapistApi.getExercises(onlySickMode);
      setExercises(data);
    } catch {
      Alert.alert('Hata', 'Egzersiz kütüphanesi yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onlySickMode]);

  useEffect(() => {
    setLoading(true);
    fetchExercises();
  }, [fetchExercises]);

  const handlePickAndUploadVideo = async () => {
    Keyboard.dismiss();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin Gerekli', 'Video seçmek için galeri izni vermelisiniz.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingVideo(true);
    try {
      const uploadedUrl = await mediaApi.uploadMedia(
        asset.uri,
        asset.mimeType ?? 'video/mp4',
        asset.fileName ?? `exercise_${Date.now()}.mp4`
      );
      setMediaUrl(uploadedUrl);
      Alert.alert('Yüklendi ✓', 'Egzersiz videosu sunucuya başarıyla yüklendi.');
    } catch {
      Alert.alert('Hata', 'Video yüklenemedi. Dosya boyutunu ve sunucuyu kontrol edin.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !instructions.trim() || !mediaUrl.trim()) {
      Alert.alert('Uyarı', 'Başlık, video ve yönergeler zorunludur.');
      return;
    }
    Keyboard.dismiss();
    setSaving(true);
    try {
      await therapistApi.createExercise({
        title: title.trim(),
        category: category.trim() || 'Genel',
        difficultyLevel: 2,
        mediaUrl: mediaUrl.trim(),
        instructions: instructions.trim(),
        requiredMaterial: requiredMaterial.trim() || null,
        warningText: warningText.trim() || null,
        orthosisRequirement: orthosisRequirement.trim() || null,
        isSickModeCare,
      });
      setModalVisible(false);
      setTitle('');
      setMediaUrl('');
      setInstructions('');
      setWarningText('');
      setIsSickModeCare(false);
      await fetchExercises();
    } catch {
      Alert.alert('Hata', 'Egzersiz kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = (ex: ExerciseItem) => {
    Alert.alert('Egzersizi Arşivle', `"${ex.title}" kütüphaneden kaldırılsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Arşivle',
        style: 'destructive',
        onPress: async () => {
          try {
            await therapistApi.archiveExercise(ex.id);
            await fetchExercises();
          } catch {
            Alert.alert('Hata', 'İşlem başarısız.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Egzersiz Kütüphanesi</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Egzersiz</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !onlySickMode && styles.filterChipActive]}
          onPress={() => setOnlySickMode(false)}
        >
          <Text style={[styles.filterText, !onlySickMode && styles.filterTextActive]}>Tümü</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, onlySickMode && styles.filterChipSick]}
          onPress={() => setOnlySickMode(true)}
        >
          <Text style={[styles.filterText, onlySickMode && styles.filterTextActive]}>
            Hastalık Modu Bakım
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.indigo} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchExercises();
              }}
            />
          }
        >
          {!exercises.length ? (
            <Text style={styles.emptyText}>Henüz egzersiz eklenmemiş.</Text>
          ) : (
            exercises.map((ex) => (
              <View key={ex.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.category}>{ex.category}</Text>
                  {ex.isSickModeCare ? (
                    <Text style={styles.sickBadge}>Hastalık Modu</Text>
                  ) : (
                    <Text style={styles.normalBadge}>Normal Program</Text>
                  )}
                </View>

                <Text style={styles.title}>{ex.title}</Text>
                <Text style={styles.instructions}>{ex.instructions}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.meta}>
                    Ortez: {ex.orthosisRequirement ?? 'Belirtilmedi'}
                  </Text>
                  <TouchableOpacity onPress={() => handleArchive(ex)}>
                    <Text style={styles.archiveText}>Arşivle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} />
          <View style={styles.modalSheet}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Yeni Egzersiz Ekle</Text>
                <TouchableOpacity onPress={Keyboard.dismiss}>
                  <Text style={styles.hideKbText}>Klavyeyi Kapat</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Oyun Temelli Başlık</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Süper Kahraman Uçuşu"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Kategori</Text>
              <TextInput style={styles.input} value={category} onChangeText={setCategory} />

              <Text style={styles.label}>Egzersiz Videosu (15-30 sn)</Text>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={handlePickAndUploadVideo}
                disabled={uploadingVideo}
              >
                {uploadingVideo ? (
                  <ActivityIndicator color={COLORS.indigo} />
                ) : (
                  <Text style={styles.uploadBtnText}>
                    {mediaUrl ? '✓ Video Yüklendi (Değiştirmek için dokun)' : '📹 Galeriden Video Seç & Yükle'}
                  </Text>
                )}
              </TouchableOpacity>

              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="veya doğrudan .mp4 URL yapıştırın"
                autoCapitalize="none"
                value={mediaUrl}
                onChangeText={setMediaUrl}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Ortez Durumu</Text>
                  <TextInput style={styles.input} value={orthosisRequirement} onChangeText={setOrthosisRequirement} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Gerekli Malzeme</Text>
                  <TextInput style={styles.input} value={requiredMaterial} onChangeText={setRequiredMaterial} />
                </View>
              </View>

              <Text style={styles.label}>Dikkat Edilecek Nokta</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Çocuğunuz W oturuşa geçmesin!"
                value={warningText}
                onChangeText={setWarningText}
              />

              <Text style={styles.label}>Uygulama Yönergesi</Text>
              <TextInput
                style={[styles.input, { minHeight: 74, textAlignVertical: 'top' }]}
                multiline
                placeholder="Adım adım talimat..."
                value={instructions}
                onChangeText={setInstructions}
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Hastalık Modu Bakım Egzersizi mi?</Text>
                <Switch
                  value={isSickModeCare}
                  onValueChange={setIsSickModeCare}
                  trackColor={{ true: COLORS.amber }}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    Keyboard.dismiss();
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={saving}>
                  {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
  },
  pageTitle: { fontSize: 21, fontWeight: '900', color: COLORS.indigoDark },
  addBtn: { backgroundColor: COLORS.indigo, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16 },
  addBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: COLORS.indigoSoft },
  filterChipActive: { backgroundColor: COLORS.indigo },
  filterChipSick: { backgroundColor: COLORS.amber },
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  category: { fontSize: 12, fontWeight: '800', color: COLORS.indigo },
  sickBadge: { fontSize: 11, fontWeight: '800', color: '#92400E', backgroundColor: COLORS.amberSoft, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  normalBadge: { fontSize: 11, fontWeight: '800', color: COLORS.indigo, backgroundColor: COLORS.indigoSoft, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  title: { fontSize: 16, fontWeight: '900', color: COLORS.indigoDark, marginBottom: 6 },
  instructions: { fontSize: 13, color: COLORS.text, lineHeight: 19, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  archiveText: { fontSize: 12, fontWeight: '800', color: COLORS.red },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(43,45,85,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 34, maxHeight: '88%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.indigoDark },
  hideKbText: { fontSize: 12, fontWeight: '700', color: COLORS.indigo },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 8 },
  twoCol: { flexDirection: 'row', gap: 10 },
  uploadBtn: { backgroundColor: COLORS.indigoSoft, borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.indigo, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  uploadBtnText: { color: COLORS.indigo, fontWeight: '800', fontSize: 13 },
  input: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 16, backgroundColor: COLORS.bg, alignItems: 'center' },
  cancelBtnText: { color: COLORS.text, fontWeight: '700' },
  saveBtn: { flex: 2, paddingVertical: 13, borderRadius: 16, backgroundColor: COLORS.indigo, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800' },
});
