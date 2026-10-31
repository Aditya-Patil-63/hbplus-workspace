import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radii, spacing, typography, shadows } from '../constants/theme';

export interface GoogleLoginButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onPress,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isButtonDisabled = disabled || isLoading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isButtonDisabled}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.button,
        hovered && styles.buttonHovered,
        pressed && styles.buttonPressed,
        isButtonDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={[styles.text, styles.loadingText, textStyle]}>
            Connecting...
          </Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.iconWrapper}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
          </View>
          <Text style={[styles.text, textStyle]}>Continue with Google</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadows.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'all 0.15s ease-in-out',
      },
    }),
  },
  buttonHovered: {
    backgroundColor: palette.surfaceSubtle,
    borderColor: palette.slate[400],
    ...shadows.md,
  },
  buttonPressed: {
    backgroundColor: palette.slate[200],
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.65,
    ...Platform.select({
      web: {
        cursor: 'default' as any,
      },
    }),
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: palette.text,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.fontFamily,
    letterSpacing: -0.1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: spacing.md,
    color: palette.textSecondary,
  },
});

export default GoogleLoginButton;
