import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Vibration, Animated, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../utils/constants';

// ── Storage keys ──────────────────────────────────────────────
const PIN_KEY      = 'cinevault_pin';
const LOCK_KEY     = 'cinevault_lock_enabled';
const BIOM_KEY     = 'cinevault_biometric_enabled';

export type LockMode = 'none' | 'pin' | 'biometric' | 'both';

// ── Helper: read/write settings ───────────────────────────────
export const getLockSettings = async () => {
  const [pin, lockEnabled, biomEnabled] = await Promise.all([
    AsyncStorage.getItem(PIN_KEY),
    AsyncStorage.getItem(LOCK_KEY),
    AsyncStorage.getItem(BIOM_KEY),
  ]);
  return {
    pin,
    lockEnabled: lockEnabled === 'true',
    biomEnabled: biomEnabled === 'true',
  };
};

export const savePIN = async (pin: string) => {
  await AsyncStorage.setItem(PIN_KEY, pin);
  await AsyncStorage.setItem(LOCK_KEY, 'true');
};

export const clearLock = async () => {
  await AsyncStorage.multiRemove([PIN_KEY, LOCK_KEY, BIOM_KEY]);
};

export const setBiometric = async (val: boolean) => {
  await AsyncStorage.setItem(BIOM_KEY, val ? 'true' : 'false');
};

// ═══════════════════════════════════════════════════════════════
// PIN Pad component
// ═══════════════════════════════════════════════════════════════
interface PinPadProps {
  title: string;
  subtitle?: string;
  onSuccess: (pin: string) => void;
  onCancel?: () => void;
  confirmPin?: string;   // if set, verify against this
  showBiometric?: boolean;
  onBiometric?: () => void;
}

export function PinPad({ title, subtitle, onSuccess, onCancel, confirmPin, showBiometric, onBiometric }: PinPadProps) {
  const [entered, setEntered] = useState('');
  const [error, setError]     = useState('');
  const shakeAnim = useState(new Animated.Value(0))[0];

  const PIN_LENGTH = 4;

  const shake = () => {
    Vibration.vibrate(300);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const onPress = useCallback((digit: string) => {
    if (entered.length >= PIN_LENGTH) return;
    const next = entered + digit;
    setEntered(next);
    setError('');

    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        if (confirmPin !== undefined) {
          // verify mode
          if (next === confirmPin) {
            onSuccess(next);
          } else {
            shake();
            setError('Incorrect PIN. Try again.');
            setEntered('');
          }
        } else {
          // create/capture mode
          onSuccess(next);
        }
      }, 150);
    }
  }, [entered, confirmPin]);

  const onDelete = () => {
    setEntered((prev) => prev.slice(0, -1));
    setError('');
  };

  const DIGITS = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['','0','⌫'],
  ];

  return (
    <View style={pp.root}>
      <Text style={pp.title}>{title}</Text>
      {subtitle ? <Text style={pp.subtitle}>{subtitle}</Text> : null}

      {/* Dots */}
      <Animated.View style={[pp.dots, { transform: [{ translateX: shakeAnim }] }]}>
        {Array(PIN_LENGTH).fill(0).map((_, i) => (
          <View
            key={i}
            style={[pp.dot, i < entered.length && pp.dotFilled]}
          />
        ))}
      </Animated.View>

      {error ? <Text style={pp.error}>{error}</Text> : null}

      {/* Keypad */}
      <View style={pp.keypad}>
        {DIGITS.map((row, ri) => (
          <View key={ri} style={pp.row}>
            {row.map((d, di) => {
              if (d === '') return <View key={di} style={pp.keyEmpty} />;
              if (d === '⌫') return (
                <TouchableOpacity key={di} style={pp.keyEmpty} onPress={onDelete}>
                  <Ionicons name="backspace-outline" size={22} color={COLORS.textSec} />
                </TouchableOpacity>
              );
              return (
                <TouchableOpacity key={di} style={pp.key} onPress={() => onPress(d)} activeOpacity={0.6}>
                  <Text style={pp.keyText}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Biometric button */}
      {showBiometric && onBiometric && (
        <TouchableOpacity style={pp.biomBtn} onPress={onBiometric}>
          <Ionicons name="finger-print" size={28} color={COLORS.accent} />
          <Text style={pp.biomText}>Use Fingerprint / Face ID</Text>
        </TouchableOpacity>
      )}

      {onCancel && (
        <TouchableOpacity style={pp.cancelBtn} onPress={onCancel}>
          <Text style={pp.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// App Lock Gate — wraps the whole app
// ═══════════════════════════════════════════════════════════════
interface AppLockGateProps {
  children: React.ReactNode;
}

export function AppLockGate({ children }: AppLockGateProps) {
  const [locked, setLocked]   = useState(false);
  const [pin, setPin]         = useState<string | null>(null);
  const [biomAvail, setBiomAvail] = useState(false);
  const [biomEnabled, setBiomEnabled] = useState(false);
  const [checking, setChecking]   = useState(true);

  useEffect(() => {
    (async () => {
      const settings = await getLockSettings();
      const hardwareAvail = await LocalAuthentication.hasHardwareAsync();
      const enrolled      = await LocalAuthentication.isEnrolledAsync();

      setBiomAvail(hardwareAvail && enrolled);
      setBiomEnabled(settings.biomEnabled);

      if (settings.lockEnabled && settings.pin) {
        setPin(settings.pin);
        setLocked(true);
        // Auto-trigger biometric if enabled
        if (settings.biomEnabled && hardwareAvail && enrolled) {
          tryBiometric(settings.pin);
        }
      }
      setChecking(false);
    })();
  }, []);

  const tryBiometric = async (savedPin?: string) => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock CineVault',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
    });
    if (result.success) setLocked(false);
  };

  const onPinSuccess = (entered: string) => {
    if (entered === pin) setLocked(false);
  };

  if (checking) return null;

  return (
    <>
      {children}
      <Modal visible={locked} animationType="fade" statusBarTranslucent>
        <View style={gate.root}>
          <View style={gate.logo}>
            <Ionicons name="lock-closed" size={36} color={COLORS.accent} />
            <Text style={gate.appName}>CineVault</Text>
          </View>
          <PinPad
            title="Enter PIN"
            subtitle="Unlock your vault"
            confirmPin={pin ?? ''}
            onSuccess={() => setLocked(false)}
            showBiometric={biomAvail && biomEnabled}
            onBiometric={() => tryBiometric()}
          />
        </View>
      </Modal>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Lock Settings Screen
// ═══════════════════════════════════════════════════════════════
export function LockSettingsScreen({ onClose }: { onClose: () => void }) {
  const [step, setStep]           = useState<'menu' | 'create' | 'confirm' | 'disable'>('menu');
  const [newPin, setNewPin]       = useState('');
  const [currentPin, setCurrentPin] = useState<string | null>(null);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [biomAvail, setBiomAvail] = useState(false);
  const [biomEnabled, setBiomEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getLockSettings();
      setCurrentPin(s.pin);
      setLockEnabled(s.lockEnabled);
      setBiomEnabled(s.biomEnabled);
      const hw = await LocalAuthentication.hasHardwareAsync();
      const en = await LocalAuthentication.isEnrolledAsync();
      setBiomAvail(hw && en);
    })();
  }, []);

  const handleCreatePin = (pin: string) => {
    setNewPin(pin);
    setStep('confirm');
  };

  const handleConfirmPin = async (pin: string) => {
    await savePIN(pin);
    setCurrentPin(pin);
    setLockEnabled(true);
    Alert.alert('✅ PIN Set', 'Your app is now protected.');
    setStep('menu');
  };

  const handleDisable = async () => {
    await clearLock();
    setLockEnabled(false);
    setCurrentPin(null);
    setStep('menu');
    Alert.alert('🔓 Lock Removed', 'App lock has been disabled.');
  };

  const toggleBiometric = async () => {
    const next = !biomEnabled;
    await setBiometric(next);
    setBiomEnabled(next);
  };

  if (step === 'create') {
    return (
      <View style={ls.root}>
        <PinPad
          title="Create PIN"
          subtitle="Choose a 4-digit PIN"
          onSuccess={handleCreatePin}
          onCancel={() => setStep('menu')}
        />
      </View>
    );
  }

  if (step === 'confirm') {
    return (
      <View style={ls.root}>
        <PinPad
          title="Confirm PIN"
          subtitle="Enter your PIN again"
          confirmPin={newPin}
          onSuccess={handleConfirmPin}
          onCancel={() => setStep('menu')}
        />
      </View>
    );
  }

  if (step === 'disable') {
    return (
      <View style={ls.root}>
        <PinPad
          title="Enter Current PIN"
          subtitle="Verify to disable lock"
          confirmPin={currentPin ?? ''}
          onSuccess={handleDisable}
          onCancel={() => setStep('menu')}
        />
      </View>
    );
  }

  return (
    <View style={ls.root}>
      <View style={ls.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={ls.title}>Security & Lock</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={ls.section}>
        <View style={ls.row}>
          <View>
            <Text style={ls.rowTitle}>App PIN Lock</Text>
            <Text style={ls.rowSub}>{lockEnabled ? '4-digit PIN is active' : 'Protect app with PIN'}</Text>
          </View>
          <View style={ls.rowRight}>
            {lockEnabled ? (
              <TouchableOpacity style={ls.dangerBtn} onPress={() => setStep('disable')}>
                <Text style={ls.dangerText}>Disable</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={ls.accentBtn} onPress={() => setStep('create')}>
                <Text style={ls.accentText}>Set PIN</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {lockEnabled && (
          <TouchableOpacity style={ls.row} onPress={() => setStep('create')}>
            <View>
              <Text style={ls.rowTitle}>Change PIN</Text>
              <Text style={ls.rowSub}>Update your 4-digit PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}

        {biomAvail && lockEnabled && (
          <TouchableOpacity style={ls.row} onPress={toggleBiometric}>
            <View>
              <Text style={ls.rowTitle}>Fingerprint / Face Unlock</Text>
              <Text style={ls.rowSub}>{biomEnabled ? 'Biometric active' : 'Use biometric as alternative'}</Text>
            </View>
            <View style={[ls.toggle, biomEnabled && ls.toggleOn]}>
              <View style={[ls.toggleDot, biomEnabled && ls.toggleDotOn]} />
            </View>
          </TouchableOpacity>
        )}

        {!biomAvail && lockEnabled && (
          <View style={ls.infoBanner}>
            <Ionicons name="information-circle" size={16} color={COLORS.textMuted} />
            <Text style={ls.infoText}>No biometric hardware detected on this device</Text>
          </View>
        )}
      </View>

      <View style={ls.notice}>
        <Ionicons name="shield-checkmark" size={20} color={COLORS.accent} />
        <Text style={ls.noticeText}>Your PIN is stored securely on-device only. CineVault never sends it anywhere.</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const pp = StyleSheet.create({
  root:       { alignItems: 'center', paddingTop: 20, paddingHorizontal: 20 },
  title:      { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
  subtitle:   { fontSize: 14, color: COLORS.textMuted, marginBottom: 30 },
  dots:       { flexDirection: 'row', gap: 16, marginBottom: 10 },
  dot:        { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: COLORS.border },
  dotFilled:  { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  error:      { color: COLORS.red, fontSize: 13, marginBottom: 10, marginTop: 4 },
  keypad:     { gap: 12, marginTop: 20 },
  row:        { flexDirection: 'row', gap: 20 },
  key:        { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  keyEmpty:   { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  keyText:    { fontSize: 24, fontWeight: '600', color: COLORS.textPrimary },
  biomBtn:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 32, padding: 12 },
  biomText:   { color: COLORS.accent, fontWeight: '600', fontSize: 14 },
  cancelBtn:  { marginTop: 16, padding: 12 },
  cancelText: { color: COLORS.textMuted, fontSize: 14 },
});

const gate = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  logo:    { alignItems: 'center', marginBottom: 40, gap: 10 },
  appName: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 2 },
});

const ls = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 20 },
  title:   { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  section: { backgroundColor: COLORS.surface, borderRadius: 14, marginHorizontal: 16, overflow: 'hidden' },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowTitle: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
  rowSub:   { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  rowRight: {},
  accentBtn:  { backgroundColor: COLORS.accent, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  accentText: { color: COLORS.bg, fontWeight: '700', fontSize: 13 },
  dangerBtn:  { backgroundColor: COLORS.red + '20', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: COLORS.red + '50' },
  dangerText: { color: COLORS.red, fontWeight: '700', fontSize: 13 },
  toggle:    { width: 44, height: 24, borderRadius: 12, backgroundColor: COLORS.border, justifyContent: 'center', padding: 2 },
  toggleOn:  { backgroundColor: COLORS.green },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.white },
  toggleDotOn: { alignSelf: 'flex-end' },
  infoBanner: { flexDirection: 'row', gap: 8, padding: 14, alignItems: 'center' },
  infoText:   { flex: 1, fontSize: 12, color: COLORS.textMuted },
  notice:     { flexDirection: 'row', gap: 10, margin: 16, padding: 14, backgroundColor: COLORS.accentSoft, borderRadius: 12, borderWidth: 1, borderColor: COLORS.accentDim },
  noticeText: { flex: 1, fontSize: 13, color: COLORS.textSec, lineHeight: 19 },
});
