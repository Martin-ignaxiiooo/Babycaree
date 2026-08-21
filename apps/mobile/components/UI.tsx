import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors } from '../constants/colors';

/** Encabezado de pantalla: título grande + bajada opcional. */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  );
}

/** Tarjeta blanca estándar. */
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Chip de estadística (ej: "8 completas"). */
export function StatChip({
  value,
  label,
  tone = 'primary',
}: {
  value: number | string;
  label: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const tones = {
    primary: { bg: Colors.primaryLight, fg: Colors.primary },
    success: { bg: Colors.successLight, fg: '#3E8E6E' },
    warning: { bg: '#FFF4E0', fg: '#B27B16' },
    danger: { bg: Colors.errorLight, fg: Colors.errorText },
  }[tone];

  return (
    <View style={[styles.statChip, { backgroundColor: tones.bg }]}>
      <Text style={[styles.statValue, { color: tones.fg }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: tones.fg }]}>{label}</Text>
    </View>
  );
}

/** Etiqueta de estado pequeña. */
export function Badge({
  text,
  tone = 'primary',
}: {
  text: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
}) {
  const tones = {
    primary: { bg: Colors.primaryLight, fg: Colors.primary },
    success: { bg: Colors.successLight, fg: '#3E8E6E' },
    warning: { bg: '#FFF4E0', fg: '#B27B16' },
    danger: { bg: Colors.errorLight, fg: Colors.errorText },
    muted: { bg: '#F1EFF7', fg: Colors.muted },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: tones.bg }]}>
      <Text style={[styles.badgeText, { color: tones.fg }]}>{text}</Text>
    </View>
  );
}

/** Estado vacío, con acción opcional. */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      {!!icon && <View style={styles.emptyIcon}>{icon}</View>}
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!message && <Text style={styles.emptyMessage}>{message}</Text>}
      {!!actionLabel && !!onAction && (
        <TouchableOpacity style={styles.emptyAction} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/** Spinner centrado para la carga inicial. */
export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

/** Bloque de error con botón de reintento. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No pudimos cargar esto</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {!!onRetry && (
        <TouchableOpacity style={styles.emptyAction} onPress={onRetry} activeOpacity={0.85}>
          <Text style={styles.emptyActionText}>Reintentar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Contenedor de pantalla con pull-to-refresh.
 * Centraliza el padding y el respiro final para que no quede contenido
 * escondido detrás de la barra de tabs.
 */
export function Screen({
  children,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  screenContent: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    color: Colors.muted,
    marginTop: 4,
    lineHeight: 21,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#2D2640',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statChip: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontFamily: 'Nunito_800ExtraBold' },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Nunito_800ExtraBold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  emptyIcon: { marginBottom: 12, opacity: 0.5 },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 18,
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 100,
  },
  emptyActionText: { color: 'white', fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  loadingText: {
    marginTop: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.muted,
    fontSize: 14,
  },
});
