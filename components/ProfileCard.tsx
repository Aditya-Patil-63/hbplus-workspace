import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from './Badge';
import { palette, radii, spacing, typography, shadows } from '../constants/theme';

export interface ProfileCardProps {
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  style?: ViewStyle;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return 'HB';
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  displayName,
  email,
  photoURL,
  style,
}) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(displayName, email);
  const showPhoto = photoURL && !imageError;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View style={styles.avatarContainer}>
          {showPhoto ? (
            <Image
              source={{ uri: photoURL }}
              style={styles.avatarImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.initialsAvatar}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName || 'Authorized Member'}
          </Text>
          <View style={styles.emailRow}>
            <Text style={styles.email} numberOfLines={1}>
              {email || 'No email registered'}
            </Text>
            <Badge label="Verified" variant="success" style={styles.verifiedBadge} />
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="shield-checkmark" size={16} color={palette.success} />
          <Text style={styles.footerItemText}>Company Identity Verified</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.xl,
    borderColor: palette.border,
    borderWidth: 1,
    padding: spacing.xl,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.lg,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: palette.border,
  },
  initialsAvatar: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: palette.primaryLight,
    borderWidth: 2,
    borderColor: '#C7D2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: palette.primary,
    fontFamily: typography.fontFamily,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: palette.text,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.xs,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  email: {
    fontSize: typography.sizes.sm,
    color: palette.textSecondary,
    fontFamily: typography.fontFamily,
  },
  verifiedBadge: {
    marginLeft: spacing.xs,
  },
  cardFooter: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.slate[100],
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItemText: {
    marginLeft: spacing.xs,
    fontSize: typography.sizes.xs,
    color: palette.slate[600],
    fontWeight: typography.weights.medium,
    fontFamily: typography.fontFamily,
  },
});

export default ProfileCard;
