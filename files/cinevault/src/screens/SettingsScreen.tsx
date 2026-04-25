import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { LockSettingsScreen, getLockSettings } from '../components/AppLock';
import { getStats, getAllMovies } from '../services/database';

export default function SettingsScreen() {
  const [showLock, setShowLock]     = useState(false);
  const [lockActive, setLockActive] = useState(false);
  const [stats, setStats]           = useState<any>(null);

  useEffect(() => {
    getLockSettings().then((s) => setLockActive(s.lockEnabled));
    setStats(getStats());
  }, [showLock]);

  const exportData = () => {
    const movies = getAllMovies();
    const json   = JSON.stringify(movies, null, 2);
    Alert.alert(
      'Export Library',
      `Your library has ${movies.length} films. Share or copy the data?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy JSON', onPress: () => Alert.alert('Copied!', 'Library data copied to clipboard (implement with Clipboard API)') },
      ]
    );
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Library Summary */}
      {stats && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Library Summary</Text>
          <View style={styles.summaryRow}>
            <SummaryStat value={stats.total}     label="Total"     color={COLORS.textPrimary} />
            <SummaryStat value={stats.watched}   label="Watched"   color={COLORS.green} />
            <SummaryStat value={stats.watchlist} label="Queued"    color={COLORS.blue} />
            <SummaryStat value={stats.totalHours} label="Hours"   color={COLORS.accent} />
          </View>
        </View>
      )}

      {/* Security */}
      <SectionLabel text="Security" />
      <View style={styles.card}>
        <SettingsRow
          icon="lock-closed"
          iconColor={COLORS.accent}
          title="App Lock"
          subtitle={lockActive ? 'PIN / Biometric active' : 'Set PIN or fingerprint lock'}
          value={lockActive ? 'ON' : 'OFF'}
          valueColor={lockActive ? COLORS.green : COLORS.textMuted}
          onPress={() => setShowLock(true)}
        />
      </View>

      {/* Display */}
      <SectionLabel text="Display" />
      <View style={styles.card}>
        <SettingsRow
          icon="phone-landscape"
          iconColor={COLORS.blue}
          title="Orientation"
          subtitle="Portrait & landscape supported"
          value="Auto"
          onPress={() => {}}
          chevron={false}
        />
        <SettingsRow
          icon="contrast"
          iconColor={COLORS.purple}
          title="Theme"
          subtitle="Dark mode (AMOLED optimized)"
          value="Dark"
          onPress={() => {}}
          chevron={false}
        />
      </View>

      {/* Data */}
      <SectionLabel text="Data" />
      <View style={styles.card}>
        <SettingsRow
          icon="download-outline"
          iconColor={COLORS.green}
          title="Export Library"
          subtitle="Save your movie data as JSON"
          onPress={exportData}
        />
        <SettingsRow
          icon="cloud-offline-outline"
          iconColor={COLORS.textSec}
          title="Storage"
          subtitle="All data stored on-device (SQLite)"
          chevron={false}
          onPress={() => {}}
        />
      </View>

      {/* Widget info */}
      <SectionLabel text="Home Screen Widget" />
      <View style={styles.card}>
        <View style={styles.widgetInfo}>
          <Ionicons name="grid-outline" size={22} color={COLORS.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.widgetTitle}>Add CineVault Widget</Text>
            <Text style={styles.widgetSub}>Long-press your home screen → Widgets → CineVault. Shows your watchlist count and last watched film.</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.widgetBtn}
          onPress={() => Alert.alert('Widget', 'Build the APK first, then add the widget from your home screen after installation. The widget shows your watchlist count, recently watched, and quick stats.')}
        >
          <Text style={styles.widgetBtnText}>How to Add Widget</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <SectionLabel text="About" />
      <View style={styles.card}>
        <SettingsRow
          icon="information-circle-outline"
          iconColor={COLORS.textSec}
          title="CineVault"
          subtitle="Version 1.0.0 · Built for Xiaomi Pad 7"
          chevron={false}
          onPress={() => {}}
        />
        <SettingsRow
          icon="film-outline"
          iconColor={COLORS.textSec}
          title="Data Source"
          subtitle="TMDb — The Movie Database"
          onPress={() => Linking.openURL('https://www.themoviedb.org')}
        />
        <SettingsRow
          icon="sparkles-outline"
          iconColor={COLORS.accent}
          title="AI Recommendations"
          subtitle="Powered by Claude (Anthropic)"
          onPress={() => Linking.openURL('https://anthropic.com')}
          chevron={false}
        />
      </View>

      <View style={{ height: 100 }} />

      {/* Lock settings modal */}
      <Modal visible={showLock} animationType="slide" statusBarTranslucent>
        <LockSettingsScreen onClose={() => setShowLock(false)} />
      </Modal>
    </ScrollView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function SummaryStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

interface RowProps {
  icon: any;
  iconColor: string;
  title: string;
  subtitle?: string;
  value?: string;
  valueColor?: string;
  onPress: () => void;
  chevron?: boolean;
}

function SettingsRow({ icon, iconColor, title, subtitle, value, valueColor, onPress, chevron = true }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      {value && <Text style={[styles.rowValue, valueColor && { color: valueColor }]}>{value}</Text>}
      {chevron && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.bg },
  header:      { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, paddingHorizontal: 16, marginTop: 20, marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' },

  card: { backgroundColor: COLORS.surface, borderRadius: 14, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },

  summaryRow:   { flexDirection: 'row', padding: 16 },
  cardTitle:    { fontSize: 13, fontWeight: '700', color: COLORS.textSec, padding: 16, paddingBottom: 4 },
  summaryStat:  { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  iconWrap:   { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowTitle:   { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  rowSub:     { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  rowValue:   { fontSize: 13, color: COLORS.textSec, fontWeight: '600', marginRight: 4 },

  widgetInfo: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  widgetTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  widgetSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 3, lineHeight: 18 },
  widgetBtn:   { margin: 12, backgroundColor: COLORS.accentDim, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.accent + '60' },
  widgetBtnText: { color: COLORS.accent, fontWeight: '700', fontSize: 13 },
});
