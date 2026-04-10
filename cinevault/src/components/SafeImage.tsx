import React, { useState } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator, ImageStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';

interface SafeImageProps {
  uri?: string | null;
  style?: ImageStyle | ImageStyle[];
  containerStyle?: ViewStyle | ViewStyle[];
  icon?: keyof typeof Ionicons.glyphMap;
  placeholderTitle?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export const SafeImage: React.FC<SafeImageProps> = ({
  uri,
  style,
  containerStyle,
  icon = 'image-outline',
  placeholderTitle,
  resizeMode = 'cover',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!uri || error) {
    return (
      <View style={[styles.placeholder, containerStyle, style]}>
        <LinearGradient
          colors={[COLORS.surface, COLORS.card]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.placeholderContent}>
          <Ionicons name={icon} size={32} color={COLORS.textMuted} />
          {placeholderTitle && (
            <Text style={styles.placeholderText} numberOfLines={2}>
              {placeholderTitle}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle, style]}>
      <Image
        source={{ uri }}
        style={[StyleSheet.absoluteFillObject, style]}
        resizeMode={resizeMode}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => setError(true)}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={COLORS.accent} size="small" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholderContent: {
    alignItems: 'center',
    padding: 10,
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
