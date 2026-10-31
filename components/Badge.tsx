import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { palette, radii, spacing, typography } from '../constants/theme';

export type BadgeVariant = 'success' | 'info' | 'neutral' | 'danger';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<
  BadgeVariant,
  { container: ViewStyle; text: TextStyle }
> = {
  success: {
    container: {
      backgroundColor: palette.successLight,
      borderColor: '#86EFAC',
    },
    text: {
      color: palette.successText,
    },
  },
  info: {
    container: {
      backgroundColor: palette.infoLight,
      borderColor: '#BAE6FD',
    },
    text: {
      color: palette.infoText,
    },
  },
  neutral: {
    container: {
      backgroundColor: palette.slate[100],
      borderColor: palette.slate[300],
    },
    text: {
      color: palette.slate[700],
    },
  },
  danger: {
    container: {
      backgroundColor: palette.dangerLight,
      borderColor: '#FECACA',
    },
    text: {
      color: palette.dangerText,
    },
  },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  textStyle,
}) => {
  const currentVariant = variantStyles[variant] ?? variantStyles.neutral;

  return (
    <View style={[styles.badge, currentVariant.container, style]}>
      <Text style={[styles.label, currentVariant.text, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.xs,
    fontFamily: typography.fontFamily,
  },
});

export default Badge;

