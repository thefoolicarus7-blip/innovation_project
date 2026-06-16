import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { AuthProvider } from './src/auth/AuthContext';
import { Colors } from './src/theme/colors';

import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { VerifyEmailScreen } from './src/screens/VerifyEmailScreen';
import { JobDiscoveryScreen } from './src/screens/JobDiscoveryScreen';
import { AppliedScreen } from './src/screens/AppliedScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ChangePasswordScreen } from './src/screens/ChangePasswordScreen';
import { DocumentUploadScreen } from './src/screens/DocumentUploadScreen';

// ─── Stack param lists ────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  VerifyEmail: undefined;
  ChangePassword: undefined;
  DocumentUpload: undefined;
};

export type MainTabParamList = {
  Jobs: undefined;
  Applied: undefined;
  Profile: undefined;
};

// ─── Navigators ──────────────────────────────────────────────────────────────

const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.outline,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 4,
          height: 58,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Jobs: 'briefcase-search',
            Applied: 'check-circle-outline',
            Profile: 'account-circle-outline',
          };
          return (
            <Icon name={icons[route.name] ?? 'circle'} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Jobs" component={JobDiscoveryScreen} options={{ title: 'Discover' }} />
      <Tab.Screen name="Applied" component={AppliedScreen} options={{ title: 'Applied' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Splash" component={SplashScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <AuthStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <AuthStack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
      {/* 'Main' is a nested stack screen that renders the tab navigator */}
      <AuthStack.Screen name={'Main' as any} component={MainTabs} />
    </AuthStack.Navigator>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <AuthNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
