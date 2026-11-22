import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TodayScreen } from '../screens/patient/TodayScreen';
import { PatientQuestionsScreen } from '../screens/patient/PatientQuestionsScreen';
import { PatientProfileScreen } from '../screens/patient/PatientProfileScreen';
import { useSessionTracker } from '../hooks/useSessionTracker';

const Tab = createBottomTabNavigator();

export const PatientTabs: React.FC = () => {
  // Aile uygulamayı açtığı sürece oturum süresini otomatik ölçer ve kaydeder
  useSessionTracker();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'today-outline';
          if (route.name === 'Bugün') iconName = 'fitness-outline';
          else if (route.name === 'Sorular') iconName = 'chatbubble-ellipses-outline';
          else if (route.name === 'Profil') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Bugün" component={TodayScreen} />
      <Tab.Screen name="Sorular" component={PatientQuestionsScreen} />
      <Tab.Screen name="Profil" component={PatientProfileScreen} />
    </Tab.Navigator>
  );
};
