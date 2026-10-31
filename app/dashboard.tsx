import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
  ImageStyle,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ProfileCard } from '../components/ProfileCard';
import { Badge } from '../components/Badge';
import { palette, radii, spacing, typography, shadows, layout } from '../constants/theme';
import { ALLOWED_DOMAIN } from '../utils/domainValidation';

function formatDate(dateString?: string | null): string {
  if (!dateString) return 'Not available';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function truncateUid(uid?: string | null): string {
  if (!uid) return 'N/A';
  if (uid.length <= 12) return uid;
  return `${uid.slice(0, 6)}...${uid.slice(-6)}`;
}

export default function DashboardScreen() {
  const { user, role, logout } = useAuth();
  const { width } = useWindowDimensions();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const isDesktop = width >= 900;
  const isCompact = width < 600;

  const firstName = user?.displayName
    ? user.displayName.trim().split(/\s+/)[0]
    : 'Team Member';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  };

  const showAvatar = user?.photoURL && !avatarError;

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.safeArea}>
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarContent}>
            {/* Brand left */}
            <View style={styles.brandGroup}>
              <View style={styles.topLogo}>
                <Text style={styles.topLogoText}>HB+</Text>
              </View>
              <View>
                <Text style={styles.appName}>HB Plus Workspace</Text>
                <Text style={styles.appTag}>Operations Portal</Text>
              </View>
            </View>

            {/* User info & logout right */}
            <View style={styles.userActions}>
              {/* User Avatar */}
              <View style={styles.avatarMini}>
                {showAvatar ? (
                  <Image
                    source={{ uri: user.photoURL! }}
                    style={styles.avatarMiniImage}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <View style={styles.avatarMiniFallback}>
                    <Text style={styles.avatarMiniText}>
                      {(firstName[0] || 'U').toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Name (hidden on small mobile) */}
              {!isCompact && (
                <View style={styles.userMeta}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.displayName || 'User'}
                  </Text>
                  <Text style={styles.userRoleTag}>
                    {role === 'admin' ? 'Administrator' : 'Member'}
                  </Text>
                </View>
              )}

              {/* Logout button */}
              <Pressable
                onPress={handleLogout}
                disabled={isLoggingOut}
                accessibilityRole="button"
                accessibilityLabel="Sign out of account"
                style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                  styles.logoutBtn,
                  hovered && styles.logoutBtnHovered,
                  pressed && styles.logoutBtnPressed,
                ]}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color={palette.dangerText} />
                ) : (
                  <View style={styles.logoutBtnContent}>
                    <Ionicons
                      name="log-out-outline"
                      size={18}
                      color={palette.dangerText}
                    />
                    {!isCompact && (
                      <Text style={styles.logoutBtnText}>Sign Out</Text>
                    )}
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Dashboard Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContainer}>
            {/* Welcome Header */}
            <View style={styles.welcomeBanner}>
              <View style={styles.welcomeLeft}>
                <Text style={styles.welcomeTitle}>
                  Welcome back, {firstName}
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  Here is an overview of your authenticated session and workspace credentials.
                </Text>
              </View>

              <View style={styles.welcomeBadgeGroup}>
                <Badge
                  label={role === 'admin' ? 'Admin Access' : 'Member Access'}
                  variant={role === 'admin' ? 'info' : 'neutral'}
                />
                <Badge label="Domain Verified" variant="success" />
              </View>
            </View>

            {/* Responsive Grid */}
            <View style={[styles.grid, isDesktop && styles.desktopGrid]}>
              {/* Profile Card */}
              <View style={[styles.gridCol, isDesktop && styles.gridColHalf]}>
                <ProfileCard
                  displayName={user?.displayName}
                  email={user?.email}
                  photoURL={user?.photoURL}
                />
              </View>

              {/* Authentication Status Card */}
              <View style={[styles.gridCol, isDesktop && styles.gridColHalf]}>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleGroup}>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={22}
                        color={palette.success}
                        style={styles.cardHeaderIcon}
                      />
                      <Text style={styles.cardTitle}>Authentication Status</Text>
                    </View>
                    <Badge label="Authenticated" variant="success" />
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Auth Provider</Text>
                    <View style={styles.valueRow}>
                      <Ionicons
                        name="logo-google"
                        size={15}
                        color="#EA4335"
                        style={styles.metaIcon}
                      />
                      <Text style={styles.metaValue}>Google Identity SSO</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Authorized Domain</Text>
                    <Text style={styles.metaValueHighlight}>@{ALLOWED_DOMAIN}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Last Sign-in</Text>
                    <Text style={styles.metaValue}>
                      {formatDate(user?.metadata.lastSignInTime)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Account Information Card */}
              <View style={[styles.gridCol, isDesktop && styles.gridColHalf]}>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleGroup}>
                      <Ionicons
                        name="person-circle-outline"
                        size={22}
                        color={palette.primary}
                        style={styles.cardHeaderIcon}
                      />
                      <Text style={styles.cardTitle}>Account Information</Text>
                    </View>
                    <Badge
                      label={role === 'admin' ? 'Admin' : 'Member'}
                      variant={role === 'admin' ? 'info' : 'neutral'}
                    />
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>User ID (UID)</Text>
                    <View style={styles.uidChip}>
                      <Text style={styles.uidText}>{truncateUid(user?.uid)}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Email Address</Text>
                    <Text style={styles.metaValue}>{user?.email || 'N/A'}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Email Verified</Text>
                    <View style={styles.valueRow}>
                      <Ionicons
                        name="checkmark-done"
                        size={16}
                        color={palette.success}
                        style={styles.metaIcon}
                      />
                      <Text style={[styles.metaValue, { color: palette.successText }]}>
                        Yes (Corporate SSO Verified)
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Created</Text>
                    <Text style={styles.metaValue}>
                      {formatDate(user?.metadata.creationTime)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Security & Compliance Card */}
              <View style={[styles.gridCol, isDesktop && styles.gridColHalf]}>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleGroup}>
                      <Ionicons
                        name="shield-outline"
                        size={22}
                        color={palette.slate[700]}
                        style={styles.cardHeaderIcon}
                      />
                      <Text style={styles.cardTitle}>Security & Access Policy</Text>
                    </View>
                    <Badge label="Strict" variant="neutral" />
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Access Scope</Text>
                    <Text style={styles.metaValue}>Internal Corporate Personnel</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Persistence</Text>
                    <Text style={styles.metaValue}>Encrypted Session Storage</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Session Security</Text>
                    <View style={styles.valueRow}>
                      <View style={styles.activeDot} />
                      <Text style={[styles.metaValue, { color: palette.successText }]}>
                        Protected & Monitored
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* BONUS: Admin Tools (Rendered ONLY if role === 'admin') */}
              {role === 'admin' && (
                <View style={[styles.gridCol, styles.gridColFull]}>
                  <View style={[styles.card, styles.adminCard]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleGroup}>
                        <Ionicons
                          name="build-outline"
                          size={22}
                          color={palette.primary}
                          style={styles.cardHeaderIcon}
                        />
                        <Text style={styles.cardTitle}>Admin Tools</Text>
                      </View>
                      <Badge label="Administrator Privilege" variant="info" />
                    </View>
                    <Text style={styles.adminDescription}>
                      Administrative workspace operations. Roles are managed securely via Firebase Console.
                    </Text>

                    <View style={styles.adminToolsList}>
                      <View style={styles.adminToolItem}>
                        <Ionicons
                          name="people-outline"
                          size={18}
                          color={palette.slate[600]}
                          style={styles.adminToolIcon}
                        />
                        <View style={styles.adminToolMeta}>
                          <Text style={styles.adminToolTitle}>
                            Manage Members
                          </Text>
                          <Text style={styles.adminToolSub}>
                            View and review authorized @{ALLOWED_DOMAIN} workspace accounts (coming soon)
                          </Text>
                        </View>
                        <Badge label="Coming Soon" variant="neutral" />
                      </View>

                      <View style={styles.adminToolItem}>
                        <Ionicons
                          name="newspaper-outline"
                          size={18}
                          color={palette.slate[600]}
                          style={styles.adminToolIcon}
                        />
                        <View style={styles.adminToolMeta}>
                          <Text style={styles.adminToolTitle}>
                            Audit Logs & Security Events
                          </Text>
                          <Text style={styles.adminToolSub}>
                            Review SSO sign-ins and unauthorized access blocks (coming soon)
                          </Text>
                        </View>
                        <Badge label="Coming Soon" variant="neutral" />
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  topBar: {
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    ...shadows.sm,
    zIndex: 10,
  },
  topBarContent: {
    maxWidth: layout.maxContentWidth,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topLogo: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  topLogoText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  appName: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: palette.text,
    fontFamily: typography.fontFamily,
    lineHeight: typography.lineHeights.sm,
  },
  appTag: {
    fontSize: typography.sizes.xs,
    color: palette.textSecondary,
    fontFamily: typography.fontFamily,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarMini: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  avatarMiniImage: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
  } as ImageStyle,
  avatarMiniFallback: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    backgroundColor: palette.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: palette.primary,
  },
  userMeta: {
    marginRight: spacing.xs,
  },
  userName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.text,
    maxWidth: 140,
  },
  userRoleTag: {
    fontSize: typography.sizes.xs,
    color: palette.textSecondary,
  },
  logoutBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: palette.dangerLight,
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'all 0.15s ease-in-out',
      },
    }),
  },
  logoutBtnHovered: {
    backgroundColor: '#FCA5A5',
    borderColor: '#F87171',
  },
  logoutBtnPressed: {
    opacity: 0.8,
  },
  logoutBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoutBtnText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: palette.dangerText,
    fontFamily: typography.fontFamily,
  },
  scrollContent: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  mainContainer: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
  },
  welcomeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  welcomeLeft: {
    flex: 1,
    minWidth: 260,
  },
  welcomeTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: palette.text,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: typography.sizes.sm,
    color: palette.textSecondary,
    fontFamily: typography.fontFamily,
    lineHeight: typography.lineHeights.base,
  },
  welcomeBadgeGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'column',
    gap: spacing.xl,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCol: {
    width: '100%',
  },
  gridColHalf: {
    width: '48.5%',
  },
  gridColFull: {
    width: '100%',
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    borderColor: palette.border,
    borderWidth: 1,
    padding: spacing.xl,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate[100],
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderIcon: {
    marginRight: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: palette.text,
    fontFamily: typography.fontFamily,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.slate[50],
  },
  metaLabel: {
    fontSize: typography.sizes.sm,
    color: palette.textSecondary,
    fontFamily: typography.fontFamily,
  },
  metaValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: palette.text,
    fontFamily: typography.fontFamily,
  },
  metaValueHighlight: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.primary,
    fontFamily: typography.fontFamily,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: spacing.xs,
  },
  uidChip: {
    backgroundColor: palette.slate[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  uidText: {
    fontSize: typography.sizes.xs,
    fontFamily: Platform.select({ web: 'monospace', default: 'System' }),
    color: palette.slate[700],
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: palette.success,
    marginRight: spacing.xs,
  },
  adminCard: {
    borderColor: '#C7D2FE',
    backgroundColor: '#FAF5FF',
  },
  adminDescription: {
    fontSize: typography.sizes.sm,
    color: palette.slate[600],
    fontFamily: typography.fontFamily,
    marginBottom: spacing.lg,
  },
  adminToolsList: {
    gap: spacing.md,
  },
  adminToolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  adminToolIcon: {
    marginRight: spacing.md,
  },
  adminToolMeta: {
    flex: 1,
  },
  adminToolTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: palette.text,
    marginBottom: 2,
  },
  adminToolSub: {
    fontSize: typography.sizes.xs,
    color: palette.textSecondary,
  },
});
