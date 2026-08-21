import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Scale, Ruler, Star, ChevronRight, Sparkles, Baby } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { api, errorMessage } from '../../constants/client';
import { useBaby } from '../../constants/BabyContext';
import { Card, EmptyState, ErrorState, Loading, Screen } from '../../components/UI';

/** Edad legible del bebé a partir de la fecha de nacimiento. */
function edadBebe(fechaNacimiento?: string | null): string {
  if (!fechaNacimiento) return '';
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  const dias = Math.floor((hoy.getTime() - nacimiento.getTime()) / 86400000);
  if (dias < 0) return '';
  if (dias < 31) return `${dias} ${dias === 1 ? 'día' : 'días'}`;
  const meses =
    (hoy.getFullYear() - nacimiento.getFullYear()) * 12 + (hoy.getMonth() - nacimiento.getMonth());
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  const años = Math.floor(meses / 12);
  const resto = meses % 12;
  return resto > 0 ? `${años} año${años > 1 ? 's' : ''} y ${resto} m` : `${años} año${años > 1 ? 's' : ''}`;
}

export default function InicioScreen() {
  const router = useRouter();
  const { user, bebes, activeBaby, activeBabyId, setActiveBabyId, loading: ctxLoading } = useBaby();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(
    async (esRefresh = false) => {
      if (!activeBabyId) {
        setLoading(false);
        return;
      }
      esRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/v1/home/${activeBabyId}`);
        setData(res.data);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeBabyId]
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (ctxLoading || (loading && !data)) {
    return (
      <SafeAreaView style={styles.safe}>
        <Loading />
      </SafeAreaView>
    );
  }

  if (!activeBabyId) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon={<Baby size={44} color={Colors.primary} />}
          title="Aún no tienes un perfil"
          message="Crea el perfil de tu bebé o de tu embarazo para empezar a llevar el seguimiento."
        />
      </SafeAreaView>
    );
  }

  const hero = data?.hero ?? {};
  const perfil = data?.perfil ?? {};
  const notificaciones: any[] = data?.notificaciones ?? [];
  const esEmbarazo = perfil?.estado === 'embarazo';
  const nombre = user?.nombre ? user.nombre.split(' ')[0] : '';

  return (
    <SafeAreaView style={styles.safe}>
      <Screen refreshing={refreshing} onRefresh={() => cargar(true)}>
        {/* Saludo */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hola}>¡Hola{nombre ? `, ${nombre}` : ''}!</Text>
            <Text style={styles.holaSub}>
              {esEmbarazo
                ? `Semana ${perfil.semanas_embarazo ?? '—'} de 40`
                : activeBaby?.nombre
                  ? `${activeBaby.nombre} · ${edadBebe(activeBaby.fecha_nacimiento)}`
                  : 'Tu seguimiento de hoy'}
            </Text>
          </View>
          {notificaciones.length > 0 && (
            <View style={styles.bellWrap}>
              <Bell size={22} color={Colors.primary} />
              <View style={styles.bellDot} />
            </View>
          )}
        </View>

        {error && <ErrorState message={error} onRetry={() => cargar()} />}

        {/* Hero */}
        {!error && (
          <LinearGradient
            colors={esEmbarazo ? ['#4A3770', '#B85C7E'] : [Colors.primary, '#A07ADF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {esEmbarazo ? (
              <>
                <View style={styles.heroBadge}>
                  <Sparkles size={13} color="white" />
                  <Text style={styles.heroBadgeText}>
                    Semana {perfil.semanas_embarazo ?? '—'} de 40
                  </Text>
                </View>
                <Text style={styles.heroTitle}>Seguimiento de tu embarazo</Text>
                <Text style={styles.heroSub}>
                  Mes {perfil.mes_embarazo ?? '—'}
                  {perfil.etiqueta_mes_embarazo ? ` · ${perfil.etiqueta_mes_embarazo}` : ''}
                </Text>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          Math.round(((perfil.semanas_embarazo ?? 0) / 40) * 100),
                          100
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {Math.min(Math.round(((perfil.semanas_embarazo ?? 0) / 40) * 100), 100)}% del camino
                </Text>
              </>
            ) : (
              <>
                <View style={styles.heroTop}>
                  {hero.foto ? (
                    <Image source={{ uri: hero.foto }} style={styles.heroFoto} />
                  ) : (
                    <View style={[styles.heroFoto, styles.heroFotoVacia]}>
                      <Baby size={30} color={Colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.heroNombre}>{hero.nombre ?? activeBaby?.nombre ?? 'Tu bebé'}</Text>
                    <Text style={styles.heroEdad}>
                      {hero.edad ?? edadBebe(activeBaby?.fecha_nacimiento)}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Scale size={18} color="white" />
                    <Text style={styles.statBoxValue}>
                      {hero.peso_kg && hero.peso_kg !== '-' ? `${hero.peso_kg}kg` : '—'}
                    </Text>
                    <Text style={styles.statBoxLabel}>Peso</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ruler size={18} color="white" />
                    <Text style={styles.statBoxValue}>
                      {hero.talla_cm && hero.talla_cm !== '-' ? `${hero.talla_cm}cm` : '—'}
                    </Text>
                    <Text style={styles.statBoxLabel}>Altura</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Star size={18} color="white" />
                    <Text style={styles.statBoxValue}>
                      {hero.percentil != null ? `P${hero.percentil}` : '—'}
                    </Text>
                    <Text style={styles.statBoxLabel}>Percentil</Text>
                  </View>
                </View>
              </>
            )}
          </LinearGradient>
        )}

        {/* Hito de la semana (solo embarazo) */}
        {!error && esEmbarazo && !!perfil.hito_embarazo && (
          <Card style={{ marginTop: 16 }}>
            <View style={styles.cardHeaderRow}>
              <Sparkles size={17} color={Colors.primary} />
              <Text style={styles.cardTitle}>Tu semana {perfil.semanas_embarazo}</Text>
            </View>
            <Text style={styles.hitoTexto}>{perfil.hito_embarazo}</Text>
          </Card>
        )}

        {/* Notificaciones */}
        {!error && notificaciones.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>Pendientes</Text>
            {notificaciones.map((n, i) => (
              <Card key={i} style={{ marginBottom: 10 }}>
                <Text style={styles.notiTitulo}>{n.titulo ?? n.tipo ?? 'Recordatorio'}</Text>
                {!!n.mensaje && <Text style={styles.notiMensaje}>{n.mensaje}</Text>}
              </Card>
            ))}
          </View>
        )}

        {/* Accesos rápidos */}
        {!error && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/salud')}
              style={styles.quickRow}
            >
              <View style={[styles.quickIcon, { backgroundColor: Colors.successLight }]}>
                <Text style={styles.quickEmoji}>💉</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>Vacunas y controles</Text>
                <Text style={styles.quickSub}>Revisa el esquema al día</Text>
              </View>
              <ChevronRight size={20} color={Colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/consejos')}
              style={styles.quickRow}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#FFF4E0' }]}>
                <Text style={styles.quickEmoji}>💡</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>Consejos para ti</Text>
                <Text style={styles.quickSub}>Contenido según la etapa</Text>
              </View>
              <ChevronRight size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Selector de bebé, solo si hay más de uno */}
        {bebes.length > 1 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Cambiar de perfil</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {bebes.map((b) => {
                const activo = b.id === activeBabyId;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setActiveBabyId(b.id)}
                    activeOpacity={0.8}
                    style={[styles.babyPill, activo && styles.babyPillActive]}
                  >
                    <Text style={[styles.babyPillText, activo && styles.babyPillTextActive]}>
                      {b.nombre ?? 'Sin nombre'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  hola: { fontSize: 26, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  holaSub: { fontSize: 14, fontFamily: 'Nunito_500Medium', color: Colors.muted, marginTop: 2 },
  bellWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  hero: { borderRadius: 24, padding: 20 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  heroFoto: { width: 62, height: 62, borderRadius: 18, backgroundColor: 'white' },
  heroFotoVacia: { alignItems: 'center', justifyContent: 'center' },
  heroNombre: { fontSize: 21, fontFamily: 'Nunito_800ExtraBold', color: 'white' },
  heroEdad: { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statBoxValue: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: 'white', marginTop: 6 },
  statBoxLabel: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: 'rgba(255,255,255,0.8)' },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: 'Nunito_800ExtraBold',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroTitle: { fontSize: 21, fontFamily: 'Nunito_800ExtraBold', color: 'white', marginTop: 10 },
  heroSub: { fontSize: 14, fontFamily: 'Nunito_500Medium', color: 'rgba(255,255,255,0.82)', marginTop: 3 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: 'white' },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  hitoTexto: { fontSize: 14, fontFamily: 'Nunito_500Medium', color: Colors.muted, lineHeight: 22 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
    marginBottom: 10,
  },
  notiTitulo: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: Colors.text },
  notiMensaje: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: Colors.muted,
    marginTop: 3,
    lineHeight: 19,
  },
  quickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickEmoji: { fontSize: 20 },
  quickTitle: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: Colors.text },
  quickSub: { fontSize: 12.5, fontFamily: 'Nunito_500Medium', color: Colors.muted, marginTop: 1 },
  babyPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: Colors.card,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  babyPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  babyPillText: { fontFamily: 'Nunito_700Bold', color: Colors.muted, fontSize: 13.5 },
  babyPillTextActive: { color: 'white' },
});
