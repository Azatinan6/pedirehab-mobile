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
import { therapistApi } from '../../api/therapistApi';
import { COLORS } from '../../theme/colors';
import { ExerciseItem, PatientCreatedResponse, PatientSummary } from '../../types/therapist';

const PATIENT_AVATARS = [
  { emoji: '🦒', bg: '#FEF3C7' },
  { emoji: '🐻', bg: '#FDE8D8' },
  { emoji: '🐰', bg: '#FCE7F3' },
  { emoji: '🐸', bg: '#DCFCE7' },
  { emoji: '🦁', bg: '#E0F2FE' },
];

const GMFCS_LEVELS = ['Seviye I', 'Seviye II', 'Seviye III', 'Seviye IV', 'Seviye V'];
const CP_TYPES = ['Spastik', 'Diskinetik', 'Ataksik', 'Mikst'];
const INVOLVEMENTS = ['Hemiparezi', 'Diparezi', 'Kuadriparezi'];
const ASSISTIVE_OPTIONS = ['AFO', 'DAFO', 'Walker', 'Tekerlekli Sandalye', 'Ayakta Durma Sehpası'];
const GAME_INTEREST_OPTIONS = ['Yüksek', 'Orta', 'Düşük'];
const CAREGIVER_OPTIONS = ['Anne', 'Baba', 'Diğer Yakın'];
const EDUCATION_OPTIONS = ['İlköğretim', 'Lise', 'Üniversite', 'Lisansüstü'];
const INCOME_OPTIONS = ['Gelir Giderden Az', 'Gelir Gidere Denk', 'Gelir Giderden Fazla'];
const TECH_DEVICE_OPTIONS = ['Akıllı Telefon', 'Tablet', 'Bilgisayar'];
const COMPETENCY_OPTIONS = ['İyi', 'Orta', 'Destek Gerekli'];

const STEP_TITLES: Record<number, string> = {
  1: '1/5 • Temel Bilgiler',
  2: '2/5 • Klinik ve Doğum Öyküsü',
  3: '3/5 • Günlük Yaşam ve Cihazlar',
  4: '4/5 • Aile ve Sosyoekonomik Durum',
  5: '5/5 • Teknoloji Erişimi',
};

const resolvePatientId = (p: PatientSummary): number => p.patientProfileId ?? p.id ?? 0;

export const PatientsScreen: React.FC = () => {
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [onlyAtRisk, setOnlyAtRisk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 5 Adımlı Yeni Hasta Sihirbazı
  const [createVisible, setCreateVisible] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [birthDate, setBirthDate] = useState('2021-06-15');
  const [gender, setGender] = useState<'ERKEK' | 'KIZ'>('ERKEK');
  const [heightCm, setHeightCm] = useState('100');
  const [weightKg, setWeightKg] = useState('16');
  const [gestationalWeek, setGestationalWeek] = useState('36');
  const [birthWeightGram, setBirthWeightGram] = useState('2400');
  const [hasNicuHistory, setHasNicuHistory] = useState(false);
  const [hasEpilepsy, setHasEpilepsy] = useState(false);
  const [hasBotoxHistory, setHasBotoxHistory] = useState(false);
  const [gmfcsLevel, setGmfcsLevel] = useState('Seviye II');
  const [cpType, setCpType] = useState('Spastik');
  const [bodyInvolvement, setBodyInvolvement] = useState('Diparezi');
  const [assistiveDevices, setAssistiveDevices] = useState<string[]>(['AFO']);
  const [childGameInterest, setChildGameInterest] = useState('Yüksek');
  const [caregiverRelation, setCaregiverRelation] = useState('Anne');
  const [parentEducationLevel, setParentEducationLevel] = useState('Üniversite');
  const [familyIncomeLevel, setFamilyIncomeLevel] = useState('Gelir Gidere Denk');
  const [accessibleDevices, setAccessibleDevices] = useState<string[]>(['Akıllı Telefon']);
  const [hasInternet, setHasInternet] = useState(true);
  const [appUsageCompetency, setAppUsageCompetency] = useState('İyi');
  const [savingPatient, setSavingPatient] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<PatientCreatedResponse | null>(null);

  // Program Atama Modalı
  const [programTarget, setProgramTarget] = useState<PatientSummary | null>(null);
  const [normalExercises, setNormalExercises] = useState<ExerciseItem[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [programName, setProgramName] = useState('Yeni Haftalık Program');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10)
  );
  const [daysPerWeek, setDaysPerWeek] = useState('5');
  const [setsPerDay, setSetsPerDay] = useState('3');
  const [targetDurationSec, setTargetDurationSec] = useState('30');
  const [therapistNote, setTherapistNote] = useState('');
  const [savingProgram, setSavingProgram] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      const data = await therapistApi.getPatients(onlyAtRisk);
      setPatients(data);
    } catch {
      Alert.alert('Hata', 'Hasta listesi yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onlyAtRisk]);

  useEffect(() => {
    setLoading(true);
    fetchPatients();
  }, [fetchPatients]);

  const toggleMultiItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  };

  const handleCreatePatient = async () => {
    Keyboard.dismiss();
    setSavingPatient(true);
    try {
      const res = await therapistApi.createPatient({
        birthDate: birthDate.trim(),
        gender,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        gestationalWeek: gestationalWeek ? Number(gestationalWeek) : null,
        birthWeightGram: birthWeightGram ? Number(birthWeightGram) : null,
        hasNicuHistory,
        hasEpilepsy,
        hasBotoxHistory,
        gmfcsLevel,
        cpType,
        bodyInvolvement,
        assistiveDevices,
        childGameInterest,
        caregiverRelation,
        parentEducationLevel,
        familyIncomeLevel,
        accessibleDevices,
        hasInternet,
        appUsageCompetency,
      });
      setCreatedCredentials(res);
      await fetchPatients();
    } catch {
      Alert.alert('Hata', 'Hasta oluşturulamadı. Tarih (YYYY-AA-GG) ve sayısal alanları kontrol edin.');
    } finally {
      setSavingPatient(false);
    }
  };

  const openProgramModal = async (patient: PatientSummary) => {
    setProgramTarget(patient);
    setTherapistNote('');
    try {
      const allEx = await therapistApi.getExercises(false);
      const regulars = allEx.filter((e) => !e.isSickModeCare);
      setNormalExercises(regulars);
      setSelectedExerciseId(regulars[0]?.id ?? null);
    } catch {
      Alert.alert('Hata', 'Egzersiz kütüphanesi yüklenemedi.');
    }
  };

  const handleAssignProgram = async () => {
    if (!programTarget || !selectedExerciseId) {
      Alert.alert('Uyarı', 'Önce kütüphaneden bir egzersiz seçmelisiniz.');
      return;
    }
    Keyboard.dismiss();
    setSavingProgram(true);
    try {
      await therapistApi.assignProgram(resolvePatientId(programTarget), {
        programName: programName.trim() || 'Haftalık Program',
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        therapistNote: therapistNote.trim() || null,
        items: [
          {
            exerciseId: selectedExerciseId,
            daysPerWeek: Number(daysPerWeek) || 5,
            setsPerDay: Number(setsPerDay) || 3,
            targetDurationSec: Number(targetDurationSec) || 30,
            displayOrder: 1,
          },
        ],
      });
      setProgramTarget(null);
      Alert.alert('Başarılı', `${programTarget.patientCode} için yeni haftalık program atandı.`);
    } catch {
      Alert.alert('Hata', 'Program atanamadı.');
    } finally {
      setSavingProgram(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Hasta Yönetimi</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setWizardStep(1);
            setCreatedCredentials(null);
            setCreateVisible(true);
          }}
        >
          <Text style={styles.addBtnText}>+ Yeni Hasta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !onlyAtRisk && styles.filterChipActive]}
          onPress={() => setOnlyAtRisk(false)}
        >
          <Text style={[styles.filterText, !onlyAtRisk && styles.filterTextActive]}>
            Tüm Hastalar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, onlyAtRisk && styles.filterChipRisk]}
          onPress={() => setOnlyAtRisk(true)}
        >
          <Text style={[styles.filterText, onlyAtRisk && styles.filterTextActive]}>
            Risk Altındakiler
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.indigo} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPatients();
              }}
            />
          }
        >
          {!patients.length ? (
            <Text style={styles.emptyText}>Listelenecek hasta bulunamadı.</Text>
          ) : (
            patients.map((p, idx) => {
              const av = PATIENT_AVATARS[idx % PATIENT_AVATARS.length];
              return (
                <View
                  key={resolvePatientId(p) || p.patientCode}
                  style={[styles.card, p.isAtRisk && styles.cardRisk]}
                >
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={[styles.avatar, { backgroundColor: av.bg }]}>
                        <Text style={{ fontSize: 22 }}>{av.emoji}</Text>
                      </View>
                      <View>
                        <Text style={styles.patientCode}>{p.patientCode}</Text>
                        <Text style={styles.metaText}>
                          {p.gmfcsLevel ?? '-'} • {p.cpType ?? '-'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.badgeRow}>
                      {p.isSickModeActive ? (
                        <Text style={styles.sickBadge}>Mola</Text>
                      ) : null}
                      {p.isAtRisk ? (
                        <Text style={styles.riskBadge}>Riskli</Text>
                      ) : (
                        <Text style={styles.okBadge}>Stabil</Text>
                      )}
                    </View>
                  </View>

                  {p.riskReason ? (
                    <Text style={styles.riskReasonText}>Uyarı: {p.riskReason}</Text>
                  ) : null}

                  <TouchableOpacity style={styles.programBtn} onPress={() => openProgramModal(p)}>
                    <Text style={styles.programBtnText}>Haftalık Program Ata →</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* 5 Adımlı Kayıt Sihirbazı Modalı */}
      <Modal
        visible={createVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} />
          <View style={styles.modalSheet}>
            {createdCredentials ? (
              <View>
                <Text style={styles.modalTitle}>Anonim Hasta Oluşturuldu ✓</Text>
                <Text style={styles.credHint}>
                  Bu giriş bilgilerini aileye iletin. Güvenlik gereği şifre sadece şimdi gösterilir:
                </Text>
                <View style={styles.credBox}>
                  <Text style={styles.credLabel}>Hasta Kodu</Text>
                  <Text style={styles.credValue}>{createdCredentials.patientCode}</Text>
                  <Text style={[styles.credLabel, { marginTop: 10 }]}>İlk Giriş Şifresi</Text>
                  <Text style={styles.credValue}>{createdCredentials.initialPassword}</Text>
                </View>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => setCreateVisible(false)}
                >
                  <Text style={styles.primaryBtnText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>{STEP_TITLES[wizardStep]}</Text>
                  <TouchableOpacity onPress={Keyboard.dismiss}>
                    <Text style={styles.hideKbText}>Klavyeyi Kapat</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.stepBarTrack}>
                  <View style={[styles.stepBarFill, { width: `${(wizardStep / 5) * 100}%` }]} />
                </View>

                {wizardStep === 1 && (
                  <>
                    <Text style={styles.label}>Doğum Tarihi (YYYY-AA-GG)</Text>
                    <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate} />
                    <Text style={styles.label}>Cinsiyet</Text>
                    <View style={styles.chipWrap}>
                      {(['ERKEK', 'KIZ'] as const).map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.choiceChip, gender === g && styles.choiceChipSelected]}
                          onPress={() => setGender(g)}
                        >
                          <Text style={[styles.choiceText, gender === g && styles.choiceTextSelected]}>
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.twoCol}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Boy (cm)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={heightCm} onChangeText={setHeightCm} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Kilo (kg)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={weightKg} onChangeText={setWeightKg} />
                      </View>
                    </View>
                  </>
                )}

                {wizardStep === 2 && (
                  <>
                    <View style={styles.twoCol}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Gebelik Haftası</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={gestationalWeek} onChangeText={setGestationalWeek} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>Doğum Kilosu (gr)</Text>
                        <TextInput style={styles.input} keyboardType="numeric" value={birthWeightGram} onChangeText={setBirthWeightGram} />
                      </View>
                    </View>
                    <Text style={styles.label}>GMFCS Seviyesi</Text>
                    <View style={styles.chipWrap}>
                      {GMFCS_LEVELS.map((lvl) => (
                        <TouchableOpacity
                          key={lvl}
                          style={[styles.choiceChip, gmfcsLevel === lvl && styles.choiceChipSelected]}
                          onPress={() => setGmfcsLevel(lvl)}
                        >
                          <Text style={[styles.choiceText, gmfcsLevel === lvl && styles.choiceTextSelected]}>{lvl}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.label}>SP Tipi</Text>
                    <View style={styles.chipWrap}>
                      {CP_TYPES.map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.choiceChip, cpType === t && styles.choiceChipSelected]}
                          onPress={() => setCpType(t)}
                        >
                          <Text style={[styles.choiceText, cpType === t && styles.choiceTextSelected]}>{t}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.label}>Vücut Tutulumu</Text>
                    <View style={styles.chipWrap}>
                      {INVOLVEMENTS.map((inv) => (
                        <TouchableOpacity
                          key={inv}
                          style={[styles.choiceChip, bodyInvolvement === inv && styles.choiceChipSelected]}
                          onPress={() => setBodyInvolvement(inv)}
                        >
                          <Text style={[styles.choiceText, bodyInvolvement === inv && styles.choiceTextSelected]}>{inv}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Yenidoğan Yoğun Bakım (NICU)</Text>
                      <Switch value={hasNicuHistory} onValueChange={setHasNicuHistory} trackColor={{ true: COLORS.indigo }} />
                    </View>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Epilepsi Öyküsü</Text>
                      <Switch value={hasEpilepsy} onValueChange={setHasEpilepsy} trackColor={{ true: COLORS.indigo }} />
                    </View>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Botoks Öyküsü</Text>
                      <Switch value={hasBotoxHistory} onValueChange={setHasBotoxHistory} trackColor={{ true: COLORS.indigo }} />
                    </View>
                  </>
                )}

                {wizardStep === 3 && (
                  <>
                    <Text style={styles.label}>Yardımcı Cihaz / Ortezler</Text>
                    <View style={styles.chipWrap}>
                      {ASSISTIVE_OPTIONS.map((dev) => {
                        const sel = assistiveDevices.includes(dev);
                        return (
                          <TouchableOpacity
                            key={dev}
                            style={[styles.choiceChip, sel && styles.choiceChipSelected]}
                            onPress={() => toggleMultiItem(assistiveDevices, dev, setAssistiveDevices)}
                          >
                            <Text style={[styles.choiceText, sel && styles.choiceTextSelected]}>{dev}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Text style={styles.label}>Çocuğun Oyun İlgisi</Text>
                    <View style={styles.chipWrap}>
                      {GAME_INTEREST_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.choiceChip, childGameInterest === opt && styles.choiceChipSelected]}
                          onPress={() => setChildGameInterest(opt)}
                        >
                          <Text style={[styles.choiceText, childGameInterest === opt && styles.choiceTextSelected]}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {wizardStep === 4 && (
                  <>
                    <Text style={styles.label}>Birincil Bakım Veren</Text>
                    <View style={styles.chipWrap}>
                      {CAREGIVER_OPTIONS.map((c) => (
                        <TouchableOpacity
                          key={c}
                          style={[styles.choiceChip, caregiverRelation === c && styles.choiceChipSelected]}
                          onPress={() => setCaregiverRelation(c)}
                        >
                          <Text style={[styles.choiceText, caregiverRelation === c && styles.choiceTextSelected]}>{c}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.label}>Ebeveyn Eğitim Düzeyi</Text>
                    <View style={styles.chipWrap}>
                      {EDUCATION_OPTIONS.map((edu) => (
                        <TouchableOpacity
                          key={edu}
                          style={[styles.choiceChip, parentEducationLevel === edu && styles.choiceChipSelected]}
                          onPress={() => setParentEducationLevel(edu)}
                        >
                          <Text style={[styles.choiceText, parentEducationLevel === edu && styles.choiceTextSelected]}>{edu}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.label}>Aile Gelir Düzeyi</Text>
                    <View style={styles.chipWrap}>
                      {INCOME_OPTIONS.map((inc) => (
                        <TouchableOpacity
                          key={inc}
                          style={[styles.choiceChip, familyIncomeLevel === inc && styles.choiceChipSelected]}
                          onPress={() => setFamilyIncomeLevel(inc)}
                        >
                          <Text style={[styles.choiceText, familyIncomeLevel === inc && styles.choiceTextSelected]}>{inc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {wizardStep === 5 && (
                  <>
                    <Text style={styles.label}>Evde Erişilebilir Cihazlar</Text>
                    <View style={styles.chipWrap}>
                      {TECH_DEVICE_OPTIONS.map((dev) => {
                        const sel = accessibleDevices.includes(dev);
                        return (
                          <TouchableOpacity
                            key={dev}
                            style={[styles.choiceChip, sel && styles.choiceChipSelected]}
                            onPress={() => toggleMultiItem(accessibleDevices, dev, setAccessibleDevices)}
                          >
                            <Text style={[styles.choiceText, sel && styles.choiceTextSelected]}>{dev}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Text style={styles.label}>Uygulama Kullanım Yeterliliği</Text>
                    <View style={styles.chipWrap}>
                      {COMPETENCY_OPTIONS.map((comp) => (
                        <TouchableOpacity
                          key={comp}
                          style={[styles.choiceChip, appUsageCompetency === comp && styles.choiceChipSelected]}
                          onPress={() => setAppUsageCompetency(comp)}
                        >
                          <Text style={[styles.choiceText, appUsageCompetency === comp && styles.choiceTextSelected]}>{comp}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Evde Düzenli İnternet Var</Text>
                      <Switch value={hasInternet} onValueChange={setHasInternet} trackColor={{ true: COLORS.indigo }} />
                    </View>
                  </>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      Keyboard.dismiss();
                      wizardStep === 1
                        ? setCreateVisible(false)
                        : setWizardStep((wizardStep - 1) as 1 | 2 | 3 | 4);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>{wizardStep === 1 ? 'İptal' : 'Geri'}</Text>
                  </TouchableOpacity>
                  {wizardStep < 5 ? (
                    <TouchableOpacity
                      style={styles.primaryBtnFlex}
                      onPress={() => {
                        Keyboard.dismiss();
                        setWizardStep((wizardStep + 1) as 2 | 3 | 4 | 5);
                      }}
                    >
                      <Text style={styles.primaryBtnText}>Sonraki Adım</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.primaryBtnFlex}
                      onPress={handleCreatePatient}
                      disabled={savingPatient}
                    >
                      {savingPatient ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Kaydet ve Kod Üret</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Haftalık Program Atama Modalı */}
      <Modal
        visible={Boolean(programTarget)}
        animationType="slide"
        transparent
        onRequestClose={() => setProgramTarget(null)}
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
                <Text style={styles.modalTitle}>Program Ata: {programTarget?.patientCode}</Text>
                <TouchableOpacity onPress={Keyboard.dismiss}>
                  <Text style={styles.hideKbText}>Klavyeyi Kapat</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Program Adı</Text>
              <TextInput style={styles.input} value={programName} onChangeText={setProgramName} />
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Başlangıç</Text>
                  <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Bitiş</Text>
                  <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} />
                </View>
              </View>
              <Text style={styles.label}>Egzersiz Seçin</Text>
              <View style={styles.chipWrap}>
                {normalExercises.map((ex) => (
                  <TouchableOpacity
                    key={ex.id}
                    style={[styles.choiceChip, selectedExerciseId === ex.id && styles.choiceChipSelected]}
                    onPress={() => setSelectedExerciseId(ex.id)}
                  >
                    <Text style={[styles.choiceText, selectedExerciseId === ex.id && styles.choiceTextSelected]}>
                      {ex.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.threeCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Gün/Hft</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={daysPerWeek} onChangeText={setDaysPerWeek} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Set/Gün</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={setsPerDay} onChangeText={setSetsPerDay} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Süre (sn)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={targetDurationSec} onChangeText={setTargetDurationSec} />
                </View>
              </View>
              <Text style={styles.label}>Aileye Not</Text>
              <TextInput style={styles.input} placeholder="Örn: Oyun eşliğinde yapalım..." value={therapistNote} onChangeText={setTherapistNote} />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    Keyboard.dismiss();
                    setProgramTarget(null);
                  }}
                >
                  <Text style={styles.cancelBtnText}>Vazgeç</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtnFlex} onPress={handleAssignProgram} disabled={savingProgram}>
                  {savingProgram ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Programı Ata</Text>}
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
  pageTitle: { fontSize: 22, fontWeight: '900', color: COLORS.indigoDark },
  addBtn: { backgroundColor: COLORS.indigo, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16 },
  addBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },

  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: COLORS.indigoSoft },
  filterChipActive: { backgroundColor: COLORS.indigo },
  filterChipRisk: { backgroundColor: COLORS.red },
  filterText: { fontSize: 13, fontWeight: '700', color: COLORS.indigoDark },
  filterTextActive: { color: '#FFFFFF' },

  listContent: { paddingHorizontal: 18, paddingBottom: 32 },
  emptyText: { textAlign: 'center', color: COLORS.textMuted, marginTop: 32 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRisk: { borderColor: COLORS.redBorder, backgroundColor: '#FFF7F7' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  patientCode: { fontSize: 16, fontWeight: '900', color: COLORS.indigoDark },
  metaText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  sickBadge: { fontSize: 11, fontWeight: '800', color: '#92400E', backgroundColor: COLORS.amberSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  riskBadge: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', backgroundColor: COLORS.red, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  okBadge: { fontSize: 11, fontWeight: '800', color: COLORS.greenDark, backgroundColor: COLORS.greenSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  riskReasonText: { fontSize: 12, color: COLORS.red, fontWeight: '600', marginBottom: 10 },
  programBtn: { backgroundColor: COLORS.indigoSoft, borderRadius: 14, paddingVertical: 11, alignItems: 'center' },
  programBtnText: { color: COLORS.indigo, fontWeight: '800', fontSize: 13 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(43,45,85,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 34, maxHeight: '88%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 17, fontWeight: '900', color: COLORS.indigoDark },
  hideKbText: { fontSize: 12, fontWeight: '700', color: COLORS.indigo },
  stepBarTrack: { height: 7, backgroundColor: COLORS.indigoSoft, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  stepBarFill: { height: '100%', backgroundColor: COLORS.indigo, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 8 },
  switchLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1, paddingRight: 10 },
  input: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  twoCol: { flexDirection: 'row', gap: 10 },
  threeCol: { flexDirection: 'row', gap: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  choiceChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
  choiceChipSelected: { backgroundColor: COLORS.indigoSoft, borderColor: COLORS.indigo },
  choiceText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  choiceTextSelected: { color: COLORS.indigo, fontWeight: '800' },

  credHint: { fontSize: 13, color: COLORS.textMuted, marginBottom: 14, lineHeight: 19 },
  credBox: { backgroundColor: COLORS.greenSoft, borderWidth: 1, borderColor: COLORS.greenBorder, borderRadius: 18, padding: 16, marginBottom: 18 },
  credLabel: { fontSize: 12, color: COLORS.greenDark, fontWeight: '700' },
  credValue: { fontSize: 24, fontWeight: '900', color: COLORS.greenDark },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 16, backgroundColor: COLORS.bg, alignItems: 'center' },
  cancelBtnText: { color: COLORS.text, fontWeight: '700' },
  primaryBtn: { backgroundColor: COLORS.indigo, borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  primaryBtnFlex: { flex: 2, backgroundColor: COLORS.indigo, borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
