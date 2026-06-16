import React, { useState } from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  TextInputProps,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
        onFocus={(e: any) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e: any) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor={Colors.on_surface_variant}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    ...Typography.labelMd,
    color: Colors.on_surface,
    marginBottom: 8,
  },
  input: {
    ...Typography.bodyMd,
    color: Colors.on_surface,
    backgroundColor: Colors.surface_container_high,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: Colors.primary + '66', // 40% opacity
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.labelSm,
    color: Colors.error,
    marginTop: 4,
  },
});
