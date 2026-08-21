import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Syringe,
  CalendarCheck,
  Stethoscope,
  Plus,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { api, errorMessage } from '../../constants/client';
import { useBaby } from '../../constants/BabyContext';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Loading,
  Screen,
  ScreenHeader,
  StatChip,
} from '../../components/UI';

type EstadoVacuna = 'completa' | 'retrasada' | 'proxima';

interface Vacuna {
  vacuna_id: number;
  nombre: string;
  enfermedades_previene?: string;
  meses_edad_recomendada: number;
  fecha_aplicacion?: string | null;
  aplicada?: boolean | null;
  lugar_aplicacion?: string | null;
}

/** Meses de vida del bebé; null si aún no nació o no hay fecha. */
function mesesDeVida(fechaNacimiento?: string | null): number | null {
  if (!fechaNacimiento) return null;
  const nac = new Date(fechaNacimiento);
  const hoy = new Date();
  if (nac > hoy) return null;
  return (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
}

function formatearFecha(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

export default function SaludScreen() {
  const router = useRouter();
  const { activeBabyId, activeBaby, loading: ctxLoading } = useBaby();

  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [verTodas, setVerTodas] = useState(false);

  const cargar = useCallback(
    async (esRefresh = false) => {
      if (!activeBabyId) {
        setLoading(false);
        return;
      }
      esRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        // Las citas son secundarias: si ese endpoint falla, igual mostramos vacunas.
        const [vacRes, citasRes] = await Promise.allSettled([
          api.get(`/v1/salud/${activeBabyId}/vacunas`),
          api.get(`/v1/salud/${activeBabyId}/citas`),
        ]);
        if (vacRes.status === 'fulfilled') {
          setVacunas(Array.isArray(vacRes.value.data) ? vacRes.value.data : []);
        } else {
          throw vacRes.reason;
        }
        setCitas(
          citasRes.status === 'fulfilled' && Array.isArray(citasRes.value.data)
            ? citasRes.value.data
            : []
        );
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

  // Al volver de la pantalla de agendar, recargamos para que la cita recién
  // creada aparezca sin que el usuario tenga que tirar para refrescar.
  useFocusEffect(
    useCallback(() => {
      cargar(true);
    }, [cargar])
  );

  const meses = mesesDeVida(activeBaby?.fecha_nacimiento);

  /**
   * Clasifica cada vacuna. Una vacuna está retrasada solo si ya pasó la edad
   * recomendada y no fue aplicada; si el bebé todavía no llega a esa edad,
   * es simplemente una próxima.
   */
  const { clasificadas, totales } = useMemo(() => {
    const lista = vacunas.map((v) => {
      let estado: EstadoVacuna;
      if (v.aplicada) estado = 'completa';
      else if (meses != null && meses > v.meses_edad_recomendada) estado = 'retrasada';
      else estado = 'proxima';
      return { ...v, estado };
    });

    return {
      clasificadas: lista,
      totales: {
        completas: lista.filter((v) => v.estado === 'completa').length,
        proximas: lista.filter((v) => v.estado === 'proxima').length,
        retrasadas: lista.filter((v) => v.estado === 'retrasada').length,
      },
    };
  }, [vacunas, meses]);

  // Primero lo urgente: retrasadas, luego próximas, y al final lo ya hecho.
  const ordenadas = useMemo(() => {
    const peso = { retrasada: 0, proxima: 1, completa: 2 } as const;
    return [...clasificadas].sort(
      (a, b) => peso[a.estado] - peso[b.estado] || a.meses_edad_recomendada - b.meses_edad_recomendada
    );
  }, [clasificadas]);

  const visibles = verTodas ? ordenadas : ordenadas.slice(0, 6);

  if (ctxLoading || (loading && vacunas.length === 0 && !error)) {
    return (
      <SafeAreaView style={styles.safe}>
        <Loading />
      </SafeAreaView>
    );
  }

  if (!activeBabyId) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState title="Sin perfil activo" message="Crea el perfil de tu bebé para ver su esquema de vacunas." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Screen refreshing={refreshing} onRefresh={() => cargar(true)}>
        <ScreenHeader
          title="Salud y Vacunas"
          subtitle="Mantén el esquema de vacunación al día para proteger a tu bebé."
        />

        {error ? (
          <ErrorState message={error} onRetry={() => cargar()} />
        ) : (
          <>
            <View style={styles.chipsRow}>
              <StatChip value={totales.completas} label="Completas" tone="success" />
              <StatChip value={totales.proximas} label="Próximas" tone="primary" />
              <StatChip value={totales.retrasadas} label="Retrasada" tone="danger" />
            </View>

            <TouchableOpacity
              onPress={() => router.push('/agendar')}
              activeOpacity={0.85}
              style={styles.agendarBtn}
            >
              <Plus size={18} color="white" />
              <Text style={styles.agendarText}>Agendar control o cita</Text>
            </TouchableOpacity>

            {citas.length > 0 && (
              <View style={{ marginTop: 22 }}>
                <Text style={styles.sectionTitle}>Próximas citas</Text>
                {citas.slice(0, 5).map((c: any, i: number) => {
                  const esControl = c.tipo === 'control';
                  return (
                    <Card key={c.id ?? i} style={{ marginBottom: 10 }}>
                      <View style={styles.row}>
                        <View
                          style={[
                            styles.iconCircle,
                            { backgroundColor: esControl ? Colors.successLight : Colors.primaryLight },
                          ]}
                        >
                          {esControl ? (
                            <CalendarCheck size={19} color="#3E8E6E" />
                          ) : (
                            <Stethoscope size={19} color={Colors.primary} />
                          )}
                        </View>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.itemTitle}>
                            {c.especialidad ??
                              c.motivo ??
                              (esControl ? 'Control sano' : 'Cita médica')}
                          </Text>
                          <Text style={styles.itemSub}>
                            {formatearFecha(c.fecha_cita ?? c.fecha)}
                            {c.medico ? ` · ${c.medico}` : ''}
                            {c.lugar ? ` · ${c.lugar}` : ''}
                          </Text>
                        </View>
                        <Badge
                          text={esControl ? 'Control' : 'Cita'}
                          tone={esControl ? 'success' : 'primary'}
                        />
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}

            <View style={{ marginTop: 22 }}>
              <Text style={styles.sectionTitle}>Esquema de vacunación</Text>

              {ordenadas.length === 0 ? (
                <EmptyState
                  icon={<Syringe size={38} color={Colors.primary} />}
                  title="Sin vacunas registradas"
                  message="Cuando el esquema esté disponible aparecerá acá."
                />
              ) : (
                <>
                  {visibles.map((v) => (
                    <Card key={v.vacuna_id} style={{ marginBottom: 10 }}>
                      <View style={styles.row}>
                        <View
                          style={[
                            styles.iconCircle,
                            {
                              backgroundColor:
                                v.estado === 'completa'
                                  ? Colors.successLight
                                  : v.estado === 'retrasada'
                                    ? Colors.errorLight
                                    : Colors.primaryLight,
                            },
                          ]}
                        >
                          {v.estado === 'completa' ? (
                            <CheckCircle2 size={19} color="#3E8E6E" />
                          ) : v.estado === 'retrasada' ? (
                            <AlertTriangle size={19} color={Colors.errorText} />
                          ) : (
                            <CalendarDays size={19} color={Colors.primary} />
                          )}
                        </View>

                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.itemTitle} numberOfLines={2}>
                            {v.nombre}
                          </Text>
                          <Text style={styles.itemSub}>
                            {v.estado === 'completa'
                              ? `Aplicada ${formatearFecha(v.fecha_aplicacion)}`
                              : v.meses_edad_recomendada === 0
                                ? 'Al nacer'
                                : `A los ${v.meses_edad_recomendada} meses`}
                          </Text>
                        </View>

                        <Badge
                          text={
                            v.estado === 'completa'
                              ? 'Completa'
                              : v.estado === 'retrasada'
                                ? 'Retrasada'
                                : 'Próxima'
                          }
                          tone={
                            v.estado === 'completa'
                              ? 'success'
                              : v.estado === 'retrasada'
                                ? 'danger'
                                : 'primary'
                          }
                        />
                      </View>
                    </Card>
                  ))}

                  {ordenadas.length > 6 && (
                    <TouchableOpacity
                      onPress={() => setVerTodas((v) => !v)}
                      activeOpacity={0.8}
                      style={styles.verMas}
                    >
                      <Text style={styles.verMasText}>
                        {verTodas ? 'Ver menos' : `Ver las ${ordenadas.length} vacunas`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </>
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  chipsRow: { flexDirection: 'row', gap: 10 },
  agendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 100,
    paddingVertical: 14,
    marginTop: 18,
  },
  agendarText: { color: 'white', fontFamily: 'Nunito_800ExtraBold', fontSize: 14.5 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTitle: { fontSize: 14.5, fontFamily: 'Nunito_700Bold', color: Colors.text, lineHeight: 20 },
  itemSub: { fontSize: 12.5, fontFamily: 'Nunito_500Medium', color: Colors.muted, marginTop: 2 },
  verMas: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    marginTop: 2,
  },
  verMasText: { fontFamily: 'Nunito_800ExtraBold', color: Colors.primary, fontSize: 14 },
});
