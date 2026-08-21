import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Search, Phone, Stethoscope, Star, Building2 } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { api, errorMessage } from '../../constants/client';
import { Card, EmptyState, ErrorState, Loading, Screen, ScreenHeader } from '../../components/UI';

interface Medico {
  id: string;
  nombre_completo: string;
  especialidad?: string;
  especialidad_nombre?: string;
  nombre_centro: string;
  prevision_aceptada?: string[];
  telefono_contacto?: string | null;
  calificacion_promedio?: number | string | null;
}

export default function DirectorioScreen() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [especialidad, setEspecialidad] = useState<string | null>(null);

  const cargar = useCallback(async (esRefresh = false) => {
    esRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [medRes, espRes] = await Promise.allSettled([
        api.get('/v1/directorio/medicos'),
        api.get('/v1/directorio/especialidades'),
      ]);
      if (medRes.status === 'fulfilled') {
        setMedicos(Array.isArray(medRes.value.data) ? medRes.value.data : []);
      } else {
        throw medRes.reason;
      }
      setEspecialidades(
        espRes.status === 'fulfilled' && Array.isArray(espRes.value.data) ? espRes.value.data : []
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return medicos.filter((m) => {
      if (especialidad && m.especialidad !== especialidad) return false;
      if (!texto) return true;
      return (
        m.nombre_completo?.toLowerCase().includes(texto) ||
        m.nombre_centro?.toLowerCase().includes(texto) ||
        m.especialidad_nombre?.toLowerCase().includes(texto)
      );
    });
  }, [medicos, busqueda, especialidad]);

  const llamar = async (telefono?: string | null) => {
    if (!telefono) return;
    const url = `tel:${telefono.replace(/\s/g, '')}`;
    const puede = await Linking.canOpenURL(url);
    if (puede) Linking.openURL(url);
    else Alert.alert('No se pudo llamar', `Puedes marcar manualmente: ${telefono}`);
  };

  if (loading && medicos.length === 0 && !error) {
    return (
      <SafeAreaView style={styles.safe}>
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Screen refreshing={refreshing} onRefresh={() => cargar(true)}>
        <ScreenHeader
          title="Directorio médico"
          subtitle="Encuentra pediatras y especialistas verificados, y llámalos con un toque."
        />

        <View style={styles.searchBox}>
          <Search size={18} color={Colors.muted} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por nombre o centro…"
            placeholderTextColor={Colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        {especialidades.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {especialidades.map((e: any) => {
              const activo = especialidad === e.codigo;
              return (
                <TouchableOpacity
                  key={e.codigo}
                  onPress={() => setEspecialidad(activo ? null : e.codigo)}
                  activeOpacity={0.8}
                  style={[styles.filtro, activo && styles.filtroActivo]}
                >
                  <Text style={[styles.filtroText, activo && styles.filtroTextActivo]}>
                    {e.nombre_visible ?? e.codigo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {error ? (
          <ErrorState message={error} onRetry={() => cargar()} />
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={<Stethoscope size={38} color={Colors.primary} />}
            title="Sin resultados"
            message={
              busqueda || especialidad
                ? 'Prueba con otro nombre o quita los filtros.'
                : 'Todavía no hay médicos publicados en el directorio.'
            }
          />
        ) : (
          filtrados.map((m) => {
            const rating = Number(m.calificacion_promedio);
            return (
              <Card key={m.id} style={{ marginBottom: 12 }}>
                <View style={styles.medicoTop}>
                  <View style={styles.avatar}>
                    <Stethoscope size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medicoNombre}>{m.nombre_completo}</Text>
                    {!!m.especialidad_nombre && (
                      <Text style={styles.medicoEsp}>{m.especialidad_nombre}</Text>
                    )}
                  </View>
                  {!Number.isNaN(rating) && rating > 0 && (
                    <View style={styles.rating}>
                      <Star size={13} color="#B27B16" fill="#F7DE8B" />
                      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.centroRow}>
                  <Building2 size={15} color={Colors.muted} />
                  <Text style={styles.centroText} numberOfLines={1}>
                    {m.nombre_centro}
                  </Text>
                </View>

                {Array.isArray(m.prevision_aceptada) && m.prevision_aceptada.length > 0 && (
                  <View style={styles.previsiones}>
                    {m.prevision_aceptada.slice(0, 4).map((p, i) => (
                      <View key={i} style={styles.prevChip}>
                        <Text style={styles.prevChipText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {!!m.telefono_contacto && (
                  <TouchableOpacity
                    onPress={() => llamar(m.telefono_contacto)}
                    activeOpacity={0.85}
                    style={styles.llamarBtn}
                  >
                    <Phone size={16} color="white" />
                    <Text style={styles.llamarText}>Llamar {m.telefono_contacto}</Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          })
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontFamily: 'Nunito_500Medium', fontSize: 14.5, color: Colors.text, padding: 0 },
  filtro: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: Colors.card,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filtroActivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtroText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.muted },
  filtroTextActivo: { color: 'white' },
  medicoTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  medicoNombre: { fontSize: 15.5, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  medicoEsp: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: Colors.primary, marginTop: 1 },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF8E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  ratingText: { fontSize: 12, fontFamily: 'Nunito_800ExtraBold', color: '#B27B16' },
  centroRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  centroText: { flex: 1, fontSize: 13.5, fontFamily: 'Nunito_500Medium', color: Colors.muted },
  previsiones: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  prevChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 100,
  },
  prevChipText: { fontSize: 11.5, fontFamily: 'Nunito_700Bold', color: Colors.primary },
  llamarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 100,
    paddingVertical: 12,
    marginTop: 14,
  },
  llamarText: { color: 'white', fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
});
