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

export const ResetPasswordScreen = ({ navigation, route }: any) => {
  // Token may be pre-filled when navigating from ForgotPasswordScreen (dev mode)
  const [token, setToken] = useState<string>(route?.params?.token ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { resetPassword } = useAuth();
  const strength = getPasswordStrength(newPassword);

  const handleReset = async () => {
    if (!token.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (strength.level < 4) {
      Alert.alert('Weak Password', 'Please meet all password requirements before continuing');
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword(token.trim(), newPassword, confirmPassword);
      Alert.alert('Success', data.message ?? 'Password reset successfully!', [
        { text: 'Log In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Reset Failed',
        error.response?.data?.message || error.message || 'Invalid or expired reset token',
      );
    } finally {
      setLoading(false);
    }
  };

  const checks: Array<[keyof StrengthChecks, string]> = [
    ['length', '8+ characters'],
    ['uppercase', 'Uppercase letter'],
    ['lowercase', 'Lowercase letter'],
    ['digit', 'Number'],
    ['special', 'Special character'],
  ];

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: Colors.primary }}
    >
      <View style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset Password</Text>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Create new password</Text>
            <Text style={styles.subtitle}>
              Paste your reset token and choose a strong new password.
            </Text>
          </View>

          <View style={styles.formSection}>
            {/* Reset token field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reset Token</Text>
              <TextInput
                style={[styles.inputField, styles.monoInput]}
                placeholder="Paste your reset token"
                placeholderTextColor={Colors.outline}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* New password field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.inputField, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.outline}
                  value={newPassword}
                  onChangeText={setNewPassword}
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

              {/* Strength bar */}
              {newPassword.length > 0 && (
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
                    {checks.map(([key, label]) => (
                      <View key={key} style={styles.checkItem}>
                        <Icon
                          name={strength.checks[key] ? 'check-circle' : 'circle-outline'}
                          size={14}
                          color={strength.checks[key] ? '#16a34a' : '#9ca3af'}
                        />
                        <Text
                          style={[
                            styles.checkLabel,
                            { color: strength.checks[key] ? '#16a34a' : '#9ca3af' },
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

            {/* Confirm password field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={[
                  styles.inputField,
                  confirmPassword.length > 0 && newPassword !== confirmPassword
                    ? styles.inputError
                    : null,
                ]}
                placeholder="••••••••"
                placeholderTextColor={Colors.outline}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleReset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Reset Password</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              Need a new token?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                Request again
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
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.on_surface,
  },
  titleSection: {
    marginBottom: 28,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.on_surface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.on_surface_variant,
    lineHeight: 22,
  },
  formSection: {
    marginBottom: 24,
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
    fontSize: 15,
    color: Colors.on_surface,
  },
  monoInput: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ef4444',
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
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24,
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
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
