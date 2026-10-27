import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text,
  TextInput, useColorScheme, View, type TextInputProps,
} from 'react-native';

export function useDraftColors() {
  return useColorScheme() === 'dark'
    ? { background: '#101b22', surface: '#1b2b35', text: '#f4f8fa', muted: '#c3d0d8', accent: '#9bd8ee', buttonText: '#09212c', border: '#859aa8', danger: '#ffb9b2' }
    : { background: '#f6f8fa', surface: '#ffffff', text: '#142b38', muted: '#455e6b', accent: '#135c76', buttonText: '#ffffff', border: '#6d8390', danger: '#a51e2c' };
}

export function Page({ children }: PropsWithChildren) {
  const colors = useDraftColors();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Copy({ children, heading = false }: PropsWithChildren<{ heading?: boolean }>) {
  const colors = useDraftColors();
  return <Text accessibilityRole={heading ? 'header' : undefined} style={[styles.copy, { color: colors.text }, heading && styles.heading]}>{children}</Text>;
}

export function Action({ children, onPress, disabled = false, secondary = false }: PropsWithChildren<{ onPress(): void; disabled?: boolean; secondary?: boolean }>) {
  const colors = useDraftColors();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.action, { backgroundColor: secondary ? colors.surface : colors.accent, borderColor: colors.border, opacity: disabled ? 0.5 : pressed ? 0.75 : 1 }]}>
      <Text style={[styles.actionText, { color: secondary ? colors.text : colors.buttonText }]}>{children}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const colors = useDraftColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.copy, { color: colors.text }]}>{label}</Text>
      <TextInput {...props} accessibilityLabel={label} placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }, props.multiline && { minHeight: 110, textAlignVertical: 'top' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 24, paddingBottom: 48, flexGrow: 1, alignItems: 'center' },
  content: { width: '100%', maxWidth: 640, gap: 20 },
  heading: { fontSize: 30, lineHeight: 40, fontWeight: '700' },
  copy: { fontSize: 18, lineHeight: 28 },
  field: { gap: 8 },
  input: { fontSize: 18, lineHeight: 28, padding: 14, minHeight: 56, borderWidth: 1, borderRadius: 10 },
  action: { minHeight: 52, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 18, lineHeight: 26, fontWeight: '600', textAlign: 'center' },
});
