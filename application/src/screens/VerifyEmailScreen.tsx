import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { useAuth } from '../auth/AuthContext';

export const VerifyEmailScreen = ({ navigation }: any) => {
  const { user, verifyEmail, resendVerification } = useAuth();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code we sent to your email.');
      return;
    }

    setVerifying(true);
    try {
      await verifyEmail(trimmed);
      Alert.alert(
        'Email Verified!',
        'Your account is now active.',
        [{ text: 'Continue', onPress: () => navigation.replace('Main') }],
      );
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        'Invalid or expired code. Please try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        'Failed to resend code. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Icon name="email-check-outline" size={56} color={Colors.primary} />
          </View>

          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.emailBold}>{user?.email ?? 'your email'}</Text>
            {'\n'}Enter it below to activate your account.
          </Text>

          {/* Code input */}
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.codeInput}
              placeholder="123456"
              placeholderTextColor={Colors.outline}
              keyboardType="numeric"
              maxLength={6}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
          </View>

          {/* Verify button */}
          <TouchableOpacity
            style={[styles.btn, (verifying || resending) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={verifying || resending}
          >
            {verifying ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.btnText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive the code? </Text>
            <TouchableOpacity onPress={handleResend} disabled={resending || verifying}>
              {resending ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.resendLink}>Resend code</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Skip for now (optional) */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Main')}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAF9FB',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.on_surface,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.on_surface_variant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  emailBold: {
    fontWeight: '700',
    color: Colors.on_surface,
  },
  inputWrap: {
    width: '100%',
    marginBottom: 24,
  },
  codeInput: {
    backgroundColor: '#EBEBEF',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 12,
    textAlign: 'center',
    color: Colors.on_surface,
  },
  btn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendLabel: {
    fontSize: 14,
    color: Colors.on_surface_variant,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  skipBtn: {
    marginTop: 8,
  },
  skipText: {
    fontSize: 14,
    color: Colors.outline,
    textDecorationLine: 'underline',
  },
});
