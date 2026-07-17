// mobile/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import SavedScreen from './src/screens/SavedScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#0f172a',
  secondary: '#1e293b',
  accent: '#10b981',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
};

function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.primary },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function AnalysisStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.primary },
      }}
    >
      <Stack.Screen name="AnalysisMain" component={AnalysisScreen} />
    </Stack.Navigator>
  );
}

function ResultsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.primary },
      }}
    >
      <Stack.Screen name="ResultsMain" component={ResultsScreen} />
    </Stack.Navigator>
  );
}

function SavedStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.primary },
      }}
    >
      <Stack.Screen name="SavedMain" component={SavedScreen} />
    </Stack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.primary },
      }}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AnalysisTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'ResultsTab') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'SavedTab') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: COLORS.secondary,
          borderTopColor: '#334155',
          borderTopWidth: 1,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="AnalysisTab"
        component={AnalysisStackNavigator}
        options={{ title: 'Analyze' }}
      />
      <Tab.Screen
        name="ResultsTab"
        component={ResultsStackNavigator}
        options={{ title: 'Results' }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedStackNavigator}
        options={{ title: 'Saved' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </>
  );
}
