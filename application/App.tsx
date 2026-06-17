import React from 'react';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from './src/theme/colors';

import { SplashScreen } from './src/screens/SplashScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { SwipeGuideScreen } from './src/screens/SwipeGuideScreen';
import { JobDiscoveryScreen } from './src/screens/JobDiscoveryScreen';
import { AppliedScreen } from './src/screens/AppliedScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { DocumentUploadScreen } from './src/screens/DocumentUploadScreen';
import { VerificationStatusScreen } from './src/screens/VerificationStatusScreen';
import { EditProfilePictureScreen } from './src/screens/EditProfilePictureScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { VerifyEmailScreen } from './src/screens/VerifyEmailScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { Dock } from './src/components/Dock';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { NotificationProvider } from './src/notifications/NotificationContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// The main app with persistent bottom dock
const MainTabs = () => {
  return (
    <Tab.Navigator
      id="main-tabs"
      screenOptions={{ headerShown: false }}
      tabBar={props => (
        <Dock
          activeScreen={props.state.routeNames[props.state.index] as any}
          navigation={props.navigation}
        />
      )}
    >
      <Tab.Screen name="JobDiscovery" component={JobDiscoveryScreen} />
      <Tab.Screen name="Applied" component={AppliedScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator id="root-stack" screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            {user.isVerified === 'false' && (
              <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            )}
            <Stack.Screen name="Main" component={MainTabs} />
            {user.isVerified !== 'false' && (
              <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            )}
            <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
            <Stack.Screen name="VerificationStatus" component={VerificationStatusScreen} />
            <Stack.Screen name="EditProfilePicture" component={EditProfilePictureScreen} />
            <Stack.Screen name="SwipeGuide" component={SwipeGuideScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
            <Navigation />
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
