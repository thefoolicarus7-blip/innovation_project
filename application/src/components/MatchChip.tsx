import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

interface MatchChipProps {
  score: number;
  style?: ViewStyle;
}

export const MatchChip: React.FC<MatchChipProps> = ({ score, style }) => {
  let bgColor = Colors.secondary_container;
  let textColor = Colors.on_secondary_container;

  if (score < 50) {
    bgColor = Colors.error_container;
    textColor = Colors.on_error_container;
  } else if (score < 80) {
    bgColor = Colors.tertiary_container;
    textColor = Colors.on_tertiary_container;
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{score}% Match</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.labelMd,
    fontWeight: 'bold',
  },
});
