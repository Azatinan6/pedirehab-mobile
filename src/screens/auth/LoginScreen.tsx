import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HillsIllustration, PediLogoMark } from '../../components/PediIllustrations';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';

type SelectedPanel = 'THERAPIST' | 'PATIENT' | null;

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [selectedPanel, setSelectedPanel] = useState<SelectedPanel>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openPanel = (panel: 'THERAPIST' | 'PATIENT') => {
    setSelectedPanel(panel);
    setUsername('');
    setPassword('');
    setErrorMessage(null);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Lütfen tüm alanları doldurun.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await login({ username: username.trim(), password });
      setSelectedPanel(null);
    } catch {
      setErrorMessage('Giriş başarısız. Bilgilerinizi veya sunucu bağlantısını kontrol edin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Üst Logo ve Slogan */}
        <View style={styles.brandBox}>
          <PediLogoMark size={78} />
          <Text style={styles.brandTitle}>PediRehab</Text>
          <Text style={styles.brandSubtitle}>Daha aktif, daha güçlü yarınlar 💛</Text>
        </View>

        <View style={styles.welcomeBox}>
          <Text style={styles.welcomeTitle}>Hoş Geldiniz!</Text>
          <Text style={styles.welcomeSub}>Lütfen giriş yapmak istediğiniz paneli seçin.</Text>
        </View>

        {/* Kart 1: Fizyoterapist Paneli (Pastel Lila) */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.panelCard, styles.therapistCard]}
          onPress={() => openPanel('THERAPIST')}
        >
          <View style={styles.cardRow}>
            <View style={[styles.avatarCircle, { backgroundColor: '#DDE0FD' }]}>
              <Text style={styles.avatarEmoji}>👩‍⚕️</Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>Fizyoterapist Paneli</Text>
                <Ionicons name="settings-outline" size={18} color={COLORS.indigo} />
              </View>
              <Text style={styles.cardDesc}>
                Hasta yönetimi, program atama ve klinik takip için
              </Text>
            </View>
          </View>
          <View style={[styles.ctaButton, { backgroundColor: COLORS.indigo }]}>
            <Text style={styles.ctaText}>Giriş Yap →</Text>
          </View>
        </TouchableOpacity>

        {/* Kart 2: Aile Paneli (Pastel Nane Yeşili) */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.panelCard, styles.familyCard]}
          onPress={() => openPanel('PATIENT')}
        >
          <View style={styles.cardRow}>
            <View style={[styles.avatarCircle, { backgroundColor: '#CBEFD7' }]}>
              <Text style={styles.avatarEmoji}>👩‍👧</Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>Aile Paneli</Text>
                <Text style={{ fontSize: 16 }}>💛</Text>
              </View>
              <Text style={styles.cardDesc}>
                Egzersizlerinizi takip edin, çocuğunuzla birlikte yapın
              </Text>
            </View>
          </View>
          <View style={[styles.ctaButton, { backgroundColor: COLORS.green }]}>
            <Text style={styles.ctaText}>Giriş Yap →</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Alt Yeşil Tepeler İllüstrasyonu */}
      <View style={styles.hillsWrap} pointerEvents="none">
        <HillsIllustration />
      </View>

      {/* Seçilen Panele Özel Giriş Modalı */}
      <Modal
        visible={Boolean(selectedPanel)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPanel(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedPanel === 'THERAPIST' ? '👩‍⚕️ Fizyoterapist Girişi' : '👩‍👧 Aile Girişi'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedPanel(null)}>
                <Ionicons name="close-circle" size={26} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>
              {selectedPanel === 'THERAPIST' ? 'E-posta Adresi' : 'Anonim Hasta Kodu'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={
                selectedPanel === 'THERAPIST' ? 'zeynep@pedirehab.com' : 'Örn: SP-01'
              }
              placeholderTextColor="#9CA3AF"
              autoCapitalize={selectedPanel === 'PATIENT' ? 'characters' : 'none'}
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
            />

            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="Şifrenizi girin"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor:
                    selectedPanel === 'THERAPIST' ? COLORS.indigo : COLORS.green,
                },
                submitting && { opacity: 0.7 },
              ]}
              onPress={handleLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Giriş Yap →</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 110 },
  brandBox: { alignItems: 'center', marginBottom: 14 },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.indigoDark,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  brandSubtitle: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600', marginTop: 4 },

  welcomeBox: { alignItems: 'center', marginBottom: 18 },
  welcomeTitle: { fontSize: 22, fontWeight: '800', color: COLORS.indigoDark },
  welcomeSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },

  panelCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    shadowColor: '#363876',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  therapistCard: { backgroundColor: COLORS.indigoSoft, borderColor: COLORS.indigoBorder },
  familyCard: { backgroundColor: COLORS.greenSoft, borderColor: COLORS.greenBorder },

  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 36 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: COLORS.indigoDark },
  cardDesc: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, lineHeight: 18 },

  ctaButton: {
    borderRadius: 22,
    paddingVertical: 13,
    alignItems: 'center',
  },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  hillsWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(43, 45, 85, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 38,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 19, fontWeight: '800', color: COLORS.indigoDark },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
  },
  errorText: { color: COLORS.red, fontSize: 13, fontWeight: '600', marginTop: 10 },
  submitBtn: { borderRadius: 22, paddingVertical: 14, alignItems: 'center', marginTop: 18 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
