import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Lightbulb, ChevronDown, ChevronUp, Heart } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { api, errorMessage } from '../../constants/client';
import { useBaby } from '../../constants/BabyContext';
import { Badge, Card, EmptyState, ErrorState, Loading, Screen, ScreenHeader } from '../../components/UI';

interface Articulo {
  id: string;
  titulo: string;
  categoria: string;
  rango_edad_meses: string;
  resumen: string;
  contenido_completo: string;
  fuente_citada: string;
  likes?: number;
  has_liked?: boolean;
}

function mesesDeVida(fechaNacimiento?: string | null): number | null {
  if (!fechaNacimiento) return null;
  const nac = new Date(fechaNacimiento);
  const hoy = new Date();
  if (nac > hoy) return null;
  return (hoy.getFullYear() - nac.getFullYear()) * 12 + (hoy.getMonth() - nac.getMonth());
}

/**
 * El rango viene como texto libre ("0-3", "6+", "12"). Lo interpretamos de
 * forma tolerante: si no se entiende, dejamos pasar el artículo en vez de
 * esconderlo, porque es peor ocultar contenido útil que mostrar uno de más.
 */
function aplicaAEdad(rango: string, meses: number | null): boolean {
  if (meses == null || !rango) return true;
  const limpio = String(rango).trim();
  const rangoMatch = limpio.match(/^(\d+)\s*[-–a]\s*(\d+)/);
  if (rangoMatch) {
    return meses >= Number(rangoMatch[1]) && meses <= Number(rangoMatch[2]);
  }
  const masMatch = limpio.match(/^(\d+)\s*\+/);
  if (masMatch) return meses >= Number(masMatch[1]);
  const exacto = limpio.match(/^(\d+)$/);
  if (exacto) return meses >= Number(exacto[1]);
  return true;
}

export default function ConsejosScreen() {
  const { activeBaby, loading: ctxLoading } = useBaby();

  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [soloMiEtapa, setSoloMiEtapa] = useState(true);
  const [categoria, setCategoria] = useState<string | null>(null);

  const cargar = useCallback(async (esRefresh = false) => {
    esRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const res = await api.get('/v1/comunidad/articulos');
      setArticulos(Array.isArray(res.data) ? res.data : []);
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

  const meses = mesesDeVida(activeBaby?.fecha_nacimiento);

  const categorias = useMemo(
    () => Array.from(new Set(articulos.map((a) => a.categoria).filter(Boolean))),
    [articulos]
  );

  const filtrados = useMemo(() => {
    return articulos.filter((a) => {
      if (categoria && a.categoria !== categoria) return false;
      if (soloMiEtapa && meses != null && !aplicaAEdad(a.rango_edad_meses, meses)) return false;
      return true;
    });
  }, [articulos, categoria, soloMiEtapa, meses]);

  const darLike = async (art: Articulo) => {
    // Optimista: la UI responde de inmediato y se revierte solo si falla.
    const previo = { has_liked: art.has_liked, likes: art.likes ?? 0 };
    setArticulos((lista) =>
      lista.map((a) =>
        a.id === art.id
          ? { ...a, has_liked: !a.has_liked, likes: (a.likes ?? 0) + (a.has_liked ? -1 : 1) }
          : a
      )
    );
    try {
      await api.post(`/v1/comunidad/articulos/${art.id}/like`);
    } catch {
      setArticulos((lista) => lista.map((a) => (a.id === art.id ? { ...a, ...previo } : a)));
    }
  };

  if (ctxLoading || (loading && articulos.length === 0 && !error)) {
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
          title="Consejos para ti"
          subtitle="Contenido según la etapa de tu bebé. Descubre qué esperar y cómo apoyar su crecimiento."
        />

        {/* Filtros */}
        {(meses != null || categorias.length > 0) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {meses != null && (
              <TouchableOpacity
                onPress={() => setSoloMiEtapa((v) => !v)}
                activeOpacity={0.8}
                style={[styles.filtro, soloMiEtapa && styles.filtroActivo]}
              >
                <Text style={[styles.filtroText, soloMiEtapa && styles.filtroTextActivo]}>
                  Para los {meses} meses
                </Text>
              </TouchableOpacity>
            )}
            {categorias.map((c) => {
              const activo = categoria === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategoria(activo ? null : c)}
                  activeOpacity={0.8}
                  style={[styles.filtro, activo && styles.filtroActivo]}
                >
                  <Text style={[styles.filtroText, activo && styles.filtroTextActivo]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {error ? (
          <ErrorState message={error} onRetry={() => cargar()} />
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={<Lightbulb size={38} color={Colors.primary} />}
            title="Nada por aquí todavía"
            message={
              soloMiEtapa && articulos.length > 0
                ? 'No hay consejos para esta etapa. Prueba quitando el filtro de edad.'
                : 'Pronto habrá contenido disponible.'
            }
            actionLabel={soloMiEtapa && articulos.length > 0 ? 'Ver todos' : undefined}
            onAction={soloMiEtapa ? () => setSoloMiEtapa(false) : undefined}
          />
        ) : (
          filtrados.map((a) => {
            const abierto = expandido === a.id;
            return (
              <Card key={a.id} style={{ marginBottom: 12 }}>
                <View style={styles.cardTop}>
                  <Badge text={a.categoria} tone="primary" />
                  <TouchableOpacity
                    onPress={() => darLike(a)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.likeBtn}
                    activeOpacity={0.7}
                  >
                    <Heart
                      size={17}
                      color={a.has_liked ? Colors.accent : Colors.muted}
                      fill={a.has_liked ? Colors.accent : 'transparent'}
                    />
                    {(a.likes ?? 0) > 0 && <Text style={styles.likeCount}>{a.likes}</Text>}
                  </TouchableOpacity>
                </View>

                <Text style={styles.articuloTitulo}>{a.titulo}</Text>
                <Text style={styles.articuloResumen}>{a.resumen}</Text>

                {abierto && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.contenido}>{a.contenido_completo}</Text>
                    {!!a.fuente_citada && (
                      <Text style={styles.fuente}>Fuente: {a.fuente_citada}</Text>
                    )}
                  </>
                )}

                <TouchableOpacity
                  onPress={() => setExpandido(abierto ? null : a.id)}
                  activeOpacity={0.85}
                  style={styles.leerMas}
                >
                  <Text style={styles.leerMasText}>{abierto ? 'Mostrar menos' : 'Leer más'}</Text>
                  {abierto ? (
                    <ChevronUp size={17} color="white" />
                  ) : (
                    <ChevronDown size={17} color="white" />
                  )}
                </TouchableOpacity>
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
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: 12.5, fontFamily: 'Nunito_700Bold', color: Colors.muted },
  articuloTitulo: {
    fontSize: 17,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
    marginTop: 10,
    lineHeight: 23,
  },
  articuloResumen: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.muted,
    marginTop: 6,
    lineHeight: 21,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  contenido: { fontSize: 14.5, fontFamily: 'Nunito_400Regular', color: Colors.text, lineHeight: 23 },
  fuente: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.muted,
    marginTop: 12,
    fontStyle: 'italic',
  },
  leerMas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 100,
    paddingVertical: 12,
    marginTop: 14,
  },
  leerMasText: { color: 'white', fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
});
