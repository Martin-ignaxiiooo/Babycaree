import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { LogOut, Baby, Mail, Check, User as UserIcon } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useBaby } from '../../constants/BabyContext';
import { Card, Loading, Screen, ScreenHeader } from '../../components/UI';

function edadOEstado(b: any): string {
  if (b?.estado === 'embarazo') return 'En embarazo';
  if (!b?.fecha_nacimiento) return 'Sin fecha de nacimiento';
  const nac = new Date(b.fecha_nacimiento);
  const hoy = new Date();
  const meses = (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
  if (meses < 1) return 'Recién nacido';
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  const años = Math.floor(meses / 12);
  return `${años} año${años > 1 ? 's' : ''}`;
}

export default function PerfilScreen() {
  const { user, bebes, activeBabyId, setActiveBabyId, logout, loading } = useBaby();

  const confirmarSalir = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Loading />
      </SafeAreaView>
    );
  }

  const iniciales = (user?.nombre ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((p: string) => p[0])
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <ScreenHeader title="Tu perfil" />

        <Card>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{iniciales}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>
                {user?.nombre ?? 'Usuario'} {user?.apellidos ?? ''}
              </Text>
              <View style={styles.mailRow}>
                <Mail size={13} color={Colors.muted} />
                <Text style={styles.userMail} numberOfLines={1}>
                  {user?.email ?? ''}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Perfiles</Text>
        {bebes.length === 0 ? (
          <Card>
            <View style={styles.emptyRow}>
              <Baby size={20} color={Colors.muted} />
              <Text style={styles.emptyText}>
                Todavía no tienes perfiles creados. Puedes crearlos desde la web.
              </Text>
            </View>
          </Card>
        ) : (
          bebes.map((b) => {
            const activo = b.id === activeBabyId;
            return (
              <TouchableOpacity
                key={b.id}
                onPress={() => setActiveBabyId(b.id)}
                activeOpacity={0.85}
                style={[styles.bebeRow, activo && styles.bebeRowActivo]}
              >
                <View style={[styles.bebeIcon, activo && styles.bebeIconActivo]}>
                  <Baby size={19} color={activo ? 'white' : Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bebeNombre}>{b.nombre ?? 'Sin nombre'}</Text>
                  <Text style={styles.bebeEdad}>{edadOEstado(b)}</Text>
                </View>
                {activo && (
                  <View style={styles.checkCircle}>
                    <Check size={14} color="white" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <TouchableOpacity onPress={confirmarSalir} activeOpacity={0.85} style={styles.logoutBtn}>
          <LogOut size={18} color={Colors.errorText} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Baby Care · versión 1.0.0</Text>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: 'white', fontFamily: 'Nunito_800ExtraBold', fontSize: 19 },
  userName: { fontSize: 17, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  mailRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  userMail: { flex: 1, fontSize: 13, fontFamily: 'Nunito_500Medium', color: Colors.muted },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
    marginTop: 26,
    marginBottom: 10,
  },
  bebeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bebeRowActivo: { borderColor: Colors.primary },
  bebeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bebeIconActivo: { backgroundColor: Colors.primary },
  bebeNombre: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: Colors.text },
  bebeEdad: { fontSize: 12.5, fontFamily: 'Nunito_500Medium', color: Colors.muted, marginTop: 1 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emptyText: { flex: 1, fontSize: 13.5, fontFamily: 'Nunito_500Medium', color: Colors.muted, lineHeight: 20 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderRadius: 100,
    paddingVertical: 14,
    marginTop: 28,
  },
  logoutText: { color: Colors.errorText, fontFamily: 'Nunito_800ExtraBold', fontSize: 14.5 },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: Colors.muted,
    marginTop: 20,
  },
});
