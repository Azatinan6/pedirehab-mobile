import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSessionTracker } from '../hooks/useSessionTracker';
import { TodayScreen } from '../screens/patient/TodayScreen';
import { PatientExercisesScreen } from '../screens/patient/PatientExercisesScreen';
import { PatientQuestionsScreen } from '../screens/patient/PatientQuestionsScreen';
import { PatientProfileScreen } from '../screens/patient/PatientProfileScreen';
import { ExerciseDetailScreen } from '../screens/patient/ExerciseDetailScreen';
import { SickModeScreen } from '../screens/patient/SickModeScreen';
import { ProgressStatsScreen } from '../screens/patient/ProgressStatsScreen';
import { COLORS } from '../theme/colors';
import { TodayExerciseItem } from '../types/patient';

export type PatientStackParamList = {
  PatientTabsRoot: undefined;
  ExerciseDetail: {
    exercise: TodayExerciseItem;
    isSickModeActive: boolean;
    patientCode: string;
  };
  SickMode: undefined;
  ProgressStats: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<PatientStackParamList>();

const PatientBottomTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.indigo,
        tabBarInactiveTintColor: '#9DA3C2',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: COLORS.border,
          height: 82,
          paddingTop: 6,
          paddingBottom: 22,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Ana Sayfa') iconName = 'home';
          else if (route.name === 'Egzersizler') iconName = 'play-circle-outline';
          else if (route.name === 'Soru Kutusu') iconName = 'chatbubble-ellipses-outline';
          else if (route.name === 'Profil') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Ana Sayfa" component={TodayScreen} />
      <Tab.Screen name="Egzersizler" component={PatientExercisesScreen} />
      <Tab.Screen name="Soru Kutusu" component={PatientQuestionsScreen} />
      <Tab.Screen name="Profil" component={PatientProfileScreen} />
    </Tab.Navigator>
  );
};

export const PatientNavigator: React.FC = () => {
  useSessionTracker();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PatientTabsRoot" component={PatientBottomTabs} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="SickMode" component={SickModeScreen} />
      <Stack.Screen name="ProgressStats" component={ProgressStatsScreen} />
    </Stack.Navigator>
  );
};
