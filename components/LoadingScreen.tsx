import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
} from 'react-native';
import { palette, radii, spacing, typography, shadows } from '../constants/theme';

export interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Authenticating...',
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Brand Mark */}
        <View style={styles.brandContainer}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>HB+</Text>
          </View>
          <Text style={styles.brandTitle}>HB Plus Workspace</Text>
          <Text style={styles.brandSubtitle}>Enterprise Access Portal</Text>
        </View>

        {/* Spinner & status */}
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
          {message ? <Text style={styles.messageText}>{message}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: palette.text,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
  },
  brandSubtitle: {
    fontSize: typography.sizes.sm,
    color: palette.textSecondary,
    fontFamily: typography.fontFamily,
  },
  spinnerContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  messageText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: palette.textSecondary,
    fontFamily: typography.fontFamily,
  },
});

export default LoadingScreen;

