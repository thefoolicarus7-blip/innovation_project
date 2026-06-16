import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { useAuth } from '../auth/AuthContext';

import { StatusBar } from 'react-native';

interface StrengthChecks {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  digit: boolean;
  special: boolean;
}

function getPasswordStrength(password: string): {
  level: number;
  color: string;
  label: string;
  checks: StrengthChecks;
} {
  const checks: StrengthChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const level = Math.min(passed, 4);
  const colors = ['#e5e7eb', '#ef4444', '#f97316', '#eab308', '#22c55e'];
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong'];
  return { level, color: colors[level], label: labels[level], checks };
}

export const SignUpScreen = ({ navigation }: any) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();

  const strength = getPasswordStrength(password);

  const handleSignUp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (strength.level < 4) {
      Alert.alert('Weak Password', 'Please meet all password requirements before continuing');
      return;
    }

    setLoading(true);
    try {
      await register({ firstName, lastName, email: email.trim(), password });
      Alert.alert(
        'Registration Success',
        'Verification code has been sent to your email.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('VerifyEmail', { email: email.trim() }),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconContainer}>
                <Icon name="gesture-swipe" size={16} color="#FFF" />
              </View>
              <Text style={styles.brandText}>Swipe2Work</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.headerLoginText}>Log In</Text>
            </TouchableOpacity>
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.largeIconContainer}>
              <Icon name="gesture-swipe" size={32} color="#FFF" />
            </View>
            <Text style={styles.brandTitleText}>Swipe2Work</Text>
          </View>

          {/* Titles */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Create an account</Text>
            <Text style={styles.subtitle}>
              Start your curated career journey today.
            </Text>
          </View>

          {/* Social Logins */}
          <View style={styles.socialSection}>
            <TouchableOpacity style={styles.socialButton}>
              <Icon
                name="google"
                size={20}
                color={Colors.on_surface}
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Icon
                name="linkedin"
                size={20}
                color="#0A66C2"
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>
                Continue with LinkedIn
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR EMAIL</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form Elements */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.inputField}
                placeholder="John"
                placeholderTextColor={Colors.outline}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Doe"
                placeholderTextColor={Colors.outline}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

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
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.inputField, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.outline}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.outline}
                  />
                </TouchableOpacity>
              </View>

              {/* Strength bar & checklist */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    {[1, 2, 3, 4].map((seg) => (
                      <View
                        key={seg}
                        style={[
                          styles.strengthSegment,
                          {
                            backgroundColor:
                              strength.level >= seg ? strength.color : '#e5e7eb',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  {strength.label ? (
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  ) : null}
                  <View style={styles.checkList}>
                    {[
                      ['length', 'At least 8 characters'],
                      ['uppercase', 'One uppercase letter'],
                      ['lowercase', 'One lowercase letter'],
                      ['digit', 'One number'],
                      ['special', 'One special character'],
                    ].map(([key, label]: any) => (
                      <View key={key} style={styles.checkItem}>
                        <Icon
                          name={strength.checks[key as keyof StrengthChecks] ? 'check-circle' : 'circle-outline'}
                          size={14}
                          color={strength.checks[key as keyof StrengthChecks] ? '#16a34a' : '#9ca3af'}
                        />
                        <Text
                          style={[
                            styles.checkLabel,
                            { color: strength.checks[key as keyof StrengthChecks] ? '#16a34a' : '#9ca3af' },
                          ]}
                        >
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[
                    styles.inputField,
                    styles.passwordInput,
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? styles.inputError
                      : null,
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.outline}
                  value={confirmPassword}
                  onChangeText={confirmPassword => setConfirmPassword(confirmPassword)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword((v) => !v)}
                >
                  <Icon
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={Colors.outline}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={styles.footerLinkBold}
                onPress={() => navigation.navigate('Login')}
              >
                Log in
              </Text>
            </Text>
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.footerLink}>Terms of Service</Text> and{'\n'}
              <Text style={styles.footerLink}>Privacy Policy</Text>.
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
    marginBottom: 24,
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
  socialSection: {
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingVertical: 14,
    borderRadius: 24,
    marginBottom: 12,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    color: Colors.on_surface,
    fontWeight: '600',
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
  footerSection: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.on_surface_variant,
    marginBottom: 16,
  },
  footerLinkBold: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: Colors.outline,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  checkList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '45%',
  },
  checkLabel: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ef4444',
  },
});
