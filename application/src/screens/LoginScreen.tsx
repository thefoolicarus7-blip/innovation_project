import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { useAuth } from '../auth/AuthContext';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: Colors.primary }}
    >
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <View style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* ... (Header and Logo sections) */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <Icon name="gesture-swipe" size={16} color="#FFF" />
              </View>
              <Text style={styles.brandText}>Swipe2Work</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.headerLoginText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logoSection}>
            <View style={styles.largeIconContainer}>
              <Icon name="gesture-swipe" size={32} color="#FFF" />
            </View>
            <Text style={styles.brandTitleText}>Swipe2Work</Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Continue your curated career journey.
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.inputField}
                placeholder="name@company.com"
                placeholderTextColor={Colors.outline}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.inputField}
                placeholder="••••••••"
                placeholderTextColor={Colors.outline}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Log In</Text>
            )}
          </TouchableOpacity>
          {/* ... (Social and Footer) */}

          {/* Social Logins */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialSection}>
            <TouchableOpacity style={styles.socialButton}>
              <Icon
                name="google"
                size={20}
                color="#000"
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Icon
                name="linkedin"
                size={20}
                color="#0A66C2"
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>LinkedIn</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Links */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text
                style={styles.footerLinkBold}
                onPress={() => navigation.navigate('SignUp')}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9FB',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: '#FAF9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  headerLoginText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '700',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  largeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitleText: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  titleSection: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 32,
    color: Colors.on_surface,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.on_surface_variant,
  },
  formSection: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.on_surface,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  inputField: {
    backgroundColor: '#EBEBEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.outline,
  },
  secureTextDots: {
    fontSize: 24,
    color: Colors.outline,
    lineHeight: 24,
    letterSpacing: 2,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    fontSize: 12,
    color: Colors.outline,
    paddingHorizontal: 16,
    letterSpacing: 1,
    fontWeight: '600',
  },
  socialSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingVertical: 14,
    borderRadius: 24,
    marginHorizontal: 6,
  },
  socialIcon: {
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 14,
    color: Colors.on_surface,
    fontWeight: '600',
  },
  footerSection: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.on_surface_variant,
  },
  footerLinkBold: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
