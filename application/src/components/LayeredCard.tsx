import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';

interface LayeredCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const LayeredCard: React.FC<LayeredCardProps> = ({
  children,
  style,
}) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface_container_lowest,
    borderRadius: 24, // xl
    padding: 16,
    shadowColor: Colors.on_surface,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4, // for android
  },
});
