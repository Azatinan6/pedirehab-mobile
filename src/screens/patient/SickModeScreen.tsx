import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { patientApi } from '../../api/patientApi';
import { COLORS } from '../../theme/colors';

const PACKAGE_ITEMS = [
  'Nazik pasif germeler',
  'Doğru pozisyonlama önerileri',
  'Solunum ve gevşeme oyunları',
];

export const SickModeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      patientApi
        .getTodayDashboard()
        .then((d) => setIsActive(d.isSickModeActive))
        .finally(() => setLoading(false));
    }, [])
  );

  const handleToggle = async () => {
    setToggling(true);
    try {
      const next = !isActive;
      await patientApi.toggleSickMode(next);
      setIsActive(next);
      Alert.alert(
        next ? 'Hastalık Modu Açıldı' : 'Normal Programa Dönüldü',
        next
          ? 'Bugün için sadece nazik bakım egzersizleri gösterilecek.'
          : 'Haftalık egzersiz programınız tekrar aktif.'
      );
    } catch {
      Alert.alert('Hata', 'Hastalık Modu güncellenemedi.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.indigoDark} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Hastalık / Mola Modu</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.indigo} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Dinlenme İllüstrasyon Kartı */}
          <View style={styles.heroBox}>
            <Text style={styles.heroEmoji}>🛌🧸🌡️</Text>
          </View>

          <Text style={styles.title}>Çocuğunuz bugün hasta veya yorgun mu?</Text>
          <Text style={styles.desc}>
            Bu mod ile zorlayıcı egzersizler yerine nazik bakım paketine geçebilirsiniz.
          </Text>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              isActive && { backgroundColor: COLORS.green },
            ]}
            onPress={handleToggle}
            disabled={toggling}
          >
            {toggling ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.toggleBtnText}>
                {isActive ? 'Normal Programa Dön ✓' : 'Hastalık Modunu Aç'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.packageCard}>
            <Text style={styles.packageTitle}>Paket İçeriği</Text>
            {PACKAGE_ITEMS.map((item) => (
              <View key={item} style={styles.checkRow}>
                <Ionicons name="checkmark" size={20} color={COLORS.green} />
                <Text style={styles.checkText}>{item}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
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
  content: { padding: 20, alignItems: 'center' },

  heroBox: {
    width: '100%',
    height: 150,
    borderRadius: 24,
    backgroundColor: COLORS.indigoSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroEmoji: { fontSize: 58 },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.indigoDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  toggleBtn: {
    width: '100%',
    backgroundColor: COLORS.indigo,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 22,
  },
  toggleBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },

  packageCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  packageTitle: { fontSize: 15, fontWeight: '800', color: COLORS.indigoDark, marginBottom: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
});
