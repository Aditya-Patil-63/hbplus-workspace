import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  useWindowDimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { Badge } from '../components/Badge';
import { palette, radii, spacing, typography, shadows } from '../constants/theme';
import { ALLOWED_DOMAIN } from '../utils/domainValidation';
import { AUTH_ERRORS } from '../services/authTypes';

export default function LoginScreen() {
  const { status, error, isSigningIn, signInWithGoogle, clearError } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  if (status === 'authenticated') {
    return <Redirect href="/dashboard" />;
  }

  const isCancelledMessage =
    error === AUTH_ERRORS.SIGN_IN_CANCELLED ||
    error?.toLowerCase().includes('cancelled');

  const handleSignIn = async () => {
    clearError();
    await signInWithGoogle();
  };

  const renderBrandPanel = () => (
    <View style={styles.brandPanel}>
      {/* Subtle decorative circles */}
      <View style={[styles.decorativeCircle, styles.circleOne]} />
      <View style={[styles.decorativeCircle, styles.circleTwo]} />
      <View style={[styles.decorativeCircle, styles.circleThree]} />

      <View style={styles.brandContent}>
        <View style={styles.brandLogo}>
          <Text style={styles.brandLogoText}>HB+</Text>
        </View>
        <Text style={styles.brandTitle}>HB Plus Workspace</Text>
        <Text style={styles.brandTagline}>
          Secure, unified corporate portal & operations suite.
        </Text>
        <View style={styles.brandPillRow}>
          <Badge
            label="Internal Access Only"
            variant="info"
            style={styles.brandPill}
          />
          <Badge
            label={`@${ALLOWED_DOMAIN}`}
            variant="neutral"
            style={styles.brandPill}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.screenContainer, isDesktop && styles.desktopLayout]}>
        {/* Left Brand Panel (Desktop only) */}
        {isDesktop && renderBrandPanel()}

        {/* Right / Main Card Area */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop ? styles.desktopScroll : styles.mobileScroll,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.card}>
            {/* Header / Logo */}
            <View style={styles.headerContainer}>
              <View style={styles.mobileMonogram}>
                <Text style={styles.mobileMonogramText}>HB+</Text>
              </View>
              <Text style={styles.appName}>HB Plus Workspace</Text>
              <Text style={styles.welcomeHeading}>Welcome Back</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in with your official company account to continue.
              </Text>
            </View>

            {/* Error or Info Banner */}
            {error ? (
              <View
                accessibilityRole="alert"
                style={[
                  styles.bannerContainer,
                  isCancelledMessage ? styles.infoBanner : styles.errorBanner,
                ]}
              >
                <Ionicons
                  name={
                    isCancelledMessage
                      ? 'information-circle-outline'
                      : 'alert-circle-outline'
                  }
                  size={20}
                  color={
                    isCancelledMessage
                      ? palette.infoText
                      : palette.dangerText
                  }
                  style={styles.bannerIcon}
                />
                <Text
                  style={[
                    styles.bannerText,
                    isCancelledMessage
                      ? styles.infoBannerText
                      : styles.errorBannerText,
                  ]}
                >
                  {error}
                </Text>
                <Pressable
                  onPress={clearError}
                  hitSlop={8}
                  style={styles.dismissButton}
                  accessibilityLabel="Dismiss message"
                >
                  <Ionicons
                    name="close"
                    size={16}
                    color={
                      isCancelledMessage
                        ? palette.infoText
                        : palette.dangerText
                    }
                  />
                </Pressable>
              </View>
            ) : null}

            {/* Sign-in Action */}
            <View style={styles.actionContainer}>
              <GoogleLoginButton
                onPress={handleSignIn}
                isLoading={isSigningIn}
                disabled={isSigningIn}
              />
            </View>

            {/* Security Note */}
            <View style={styles.securityNote}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={palette.slate[500]}
                style={styles.securityIcon}
              />
              <Text style={styles.securityText}>
                Only authorized company accounts are permitted.
              </Text>
            </View>

            {/* Domain Info */}
            <View style={styles.footerInfo}>
              <Text style={styles.footerDomain}>
                Authorized corporate identity: <Text style={styles.boldText}>@{ALLOWED_DOMAIN}</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  screenContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  desktopLayout: {
    flexDirection: 'row',
  },
  brandPanel: {
    flex: 1,
    backgroundColor: palette.primary,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  circleOne: {
    width: 380,
    height: 380,
    top: -60,
    left: -80,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  circleTwo: {
    width: 520,
    height: 520,
    bottom: -120,
    right: -100,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  circleThree: {
    width: 240,
    height: 240,
    bottom: '20%',
    left: '10%',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandContent: {
    zIndex: 2,
    alignItems: 'center',
    maxWidth: 440,
  },
  brandLogo: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  brandLogoText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    letterSpacing: 0.5,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  brandTagline: {
    color: palette.slate[200],
    fontSize: typography.sizes.base,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
    lineHeight: typography.lineHeights.base,
    marginBottom: spacing.xl,
  },
  brandPillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  brandPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopScroll: {
    flex: 1,
    padding: spacing.xxl,
  },
  mobileScroll: {
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.xl,
    ...shadows.md,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  mobileMonogram: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  mobileMonogramText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  appName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: palette.primary,
    letterSpacing: 0.5,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
  },
  welcomeHeading: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: palette.text,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.sm,
    color: palette.textSecondary,
    textAlign: 'center',
    fontFamily: typography.fontFamily,
    lineHeight: typography.lineHeights.sm,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBanner: {
    backgroundColor: palette.dangerLight,
    borderColor: '#FECACA',
  },
  infoBanner: {
    backgroundColor: palette.infoLight,
    borderColor: '#BAE6FD',
  },
  bannerIcon: {
    marginRight: spacing.sm,
  },
  bannerText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily,
    lineHeight: typography.lineHeights.sm,
  },
  errorBannerText: {
    color: palette.dangerText,
    fontWeight: typography.weights.medium,
  },
  infoBannerText: {
    color: palette.infoText,
  },
  dismissButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  actionContainer: {
    marginBottom: spacing.lg,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  securityIcon: {
    marginRight: spacing.xs,
  },
  securityText: {
    fontSize: typography.sizes.xs,
    color: palette.slate[600],
    fontFamily: typography.fontFamily,
  },
  footerInfo: {
    borderTopWidth: 1,
    borderTopColor: palette.slate[100],
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  footerDomain: {
    fontSize: typography.sizes.xs,
    color: palette.textMuted,
    fontFamily: typography.fontFamily,
  },
  boldText: {
    fontWeight: typography.weights.semibold,
    color: palette.textSecondary,
  },
});
