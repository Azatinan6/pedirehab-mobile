import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/therapist/DashboardScreen';
import { PatientsScreen } from '../screens/therapist/PatientsScreen';
import { ExercisesScreen } from '../screens/therapist/ExercisesScreen';
import { TherapistQuestionsScreen } from '../screens/therapist/TherapistQuestionsScreen';
import { COLORS } from '../theme/colors';

export type TherapistTabParamList = {
  'Ana Sayfa': undefined;
  Hastalar: undefined;
  Kütüphane: undefined;
  'Soru Kutusu': undefined;
};

const Tab = createBottomTabNavigator<TherapistTabParamList>();

export const TherapistTabs: React.FC = () => {
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
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Ana Sayfa') iconName = 'home';
          else if (route.name === 'Hastalar') iconName = 'people';
          else if (route.name === 'Kütüphane') iconName = 'play-circle';
          else if (route.name === 'Soru Kutusu') iconName = 'chatbubbles';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Ana Sayfa" component={DashboardScreen} />
      <Tab.Screen name="Hastalar" component={PatientsScreen} />
      <Tab.Screen name="Kütüphane" component={ExercisesScreen} />
      <Tab.Screen name="Soru Kutusu" component={TherapistQuestionsScreen} />
    </Tab.Navigator>
  );
};
