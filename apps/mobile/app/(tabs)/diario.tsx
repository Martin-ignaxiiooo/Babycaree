import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Milk, Moon, Baby, Sun, Trash2, Plus, X } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { api, errorMessage } from '../../constants/client';
import { useBaby } from '../../constants/BabyContext';
import { Card, EmptyState, ErrorState, Loading, Screen, ScreenHeader } from '../../components/UI';

type Tipo = 'toma' | 'sueno' | 'panal';

/** "hace 2 h 15 min": así se piensa el tiempo entre tomas, no como un reloj. */
function haceCuanto(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  if (h < 24) return r > 0 ? `hace ${h} h ${r} min` : `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function duracion(min: number): string {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

function describir(r: any): string {
  if (r.tipo === 'toma') {
    if (r.fuente === 'biberon') return `Biberón · ${r.cantidad_ml ?? '?'} ml`;
    const lado = r.fuente === 'pecho_izq' ? 'izquierdo' : 'derecho';
    return r.duracion_min ? `Pecho ${lado} · ${r.duracion_min} min` : `Pecho ${lado}`;
  }
  if (r.tipo === 'sueno') {
    if (!r.sueno_fin) return 'Durmiendo ahora';
    const min = (new Date(r.sueno_fin).getTime() - new Date(r.sueno_inicio).getTime()) / 60000;
    return `Durmió ${duracion(min)}`;
  }
  return ({ pis: 'Pañal · pipí', caca: 'Pañal · caca', mixto: 'Pañal · mixto' } as any)[r.panal_tipo] ?? 'Pañal';
}

const ESTILO: Record<Tipo, { bg: string; fg: string; Icon: any }> = {
  toma: { bg: '#E3F2FD', fg: '#1976D2', Icon: Milk },
  sueno: { bg: '#EDE7F6', fg: Colors.primary, Icon: Moon },
  panal: { bg: '#FFF4E0', fg: '#B27B16', Icon: Baby },
};

export default function DiarioScreen() {
  const { activeBabyId, loading: ctxLoading } = useBaby();

  const [registros, setRegistros] = useState<any[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [abierto, setAbierto] = useState<Tipo | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [fuente, setFuente] = useState<'pecho_izq' | 'pecho_der' | 'biberon'>('biberon');
  const [cantidadMl, setCantidadMl] = useState(120);
  const [duracionMin, setDuracionMin] = useState(15);
  const [panalTipo, setPanalTipo] = useState<'pis' | 'caca' | 'mixto'>('pis');
  const [nota, setNota] = useState('');

  const cargar = useCallback(async (esRefresh = false) => {
    if (!activeBabyId) { setLoading(false); return; }
    esRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [reg, res] = await Promise.all([
        api.get(`/v1/diario/${activeBabyId}/registros?limite=40`),
        api.get(`/v1/diario/${activeBabyId}/registros/resumen`),
      ]);
      setRegistros(Array.isArray(reg.data) ? reg.data : []);
      setResumen(res.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBabyId]);

  useEffect(() => { cargar(); }, [cargar]);

  // Al volver a esta pestaña se recarga: es probable que se haya
  // registrado algo desde otro dispositivo (el papá, la abuela).
  useFocusEffect(useCallback(() => { cargar(true); }, [cargar]));

  const registrar = async (cuerpo: any) => {
    if (!activeBabyId) return;
    setGuardando(true);
    try {
      await api.post(`/v1/diario/${activeBabyId}/registros`, { ...cuerpo, nota: nota.trim() || null });
      setAbierto(null);
      setNota('');
      cargar(true);
    } catch (e) {
      Alert.alert('No se pudo guardar', errorMessage(e));
    } finally {
      setGuardando(false);
    }
  };

  const despertar = async (id: string) => {
    if (!activeBabyId) return;
    try {
      await api.patch(`/v1/diario/${activeBabyId}/registros/${id}/despertar`);
      cargar(true);
    } catch (e) {
      Alert.alert('No se pudo cerrar el sueño', errorMessage(e));
    }
  };

  const eliminar = (id: string) => {
    Alert.alert('Eliminar registro', '¿Seguro que quieres borrarlo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/v1/diario/${activeBabyId}/registros/${id}`);
            cargar(true);
          } catch (e) {
            Alert.alert('No se pudo eliminar', errorMessage(e));
          }
        },
      },
    ]);
  };

  if (ctxLoading || (loading && registros.length === 0 && !error)) {
    return <SafeAreaView style={styles.safe}><Loading /></SafeAreaView>;
  }

  if (!activeBabyId) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState title="Sin perfil activo" message="Crea el perfil de tu bebé para llevar el registro diario." />
      </SafeAreaView>
    );
  }

  const suenoEnCurso = resumen?.sueno_en_curso;

  return (
    <SafeAreaView style={styles.safe}>
      <Screen refreshing={refreshing} onRefresh={() => cargar(true)}>
        <ScreenHeader title="Diario" subtitle="Tomas, sueño y pañales del día a día." />

        {/* Resumen de hoy */}
        {resumen && (
          <View style={styles.statsRow}>
            <Mini valor={String(resumen.hoy.tomas)} etiqueta="tomas" bg="#E3F2FD" />
            <Mini valor={`${resumen.hoy.ml_total}`} etiqueta="ml" bg="#E1F5FE" />
            <Mini valor={duracion(resumen.hoy.sueno_min)} etiqueta="sueño" bg="#EDE7F6" />
            <Mini valor={String(resumen.hoy.panales)} etiqueta="pañales" bg="#FFF4E0" />
          </View>
        )}

        {/* Sueño en curso */}
        {suenoEnCurso && (
          <Card style={styles.suenoCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Moon size={24} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.suenoTitulo}>Está durmiendo</Text>
                <Text style={styles.suenoSub}>
                  Desde las {hora(suenoEnCurso.sueno_inicio)} · {haceCuanto(suenoEnCurso.sueno_inicio)}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => despertar(suenoEnCurso.id)} style={styles.despertarBtn} activeOpacity={0.85}>
              <Sun size={16} color={Colors.primary} />
              <Text style={styles.despertarText}>Ya despertó</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Registro rápido */}
        <View style={styles.rapidoRow}>
          <Rapido tipo="toma" activo={abierto === 'toma'} label="Toma" onPress={() => setAbierto(abierto === 'toma' ? null : 'toma')} />
          {!suenoEnCurso && (
            <Rapido tipo="sueno" activo={false} label="Se durmió" onPress={() => registrar({ tipo: 'sueno', sueno_inicio: new Date().toISOString() })} />
          )}
          <Rapido tipo="panal" activo={abierto === 'panal'} label="Pañal" onPress={() => setAbierto(abierto === 'panal' ? null : 'panal')} />
        </View>

        {/* Formulario de toma */}
        {abierto === 'toma' && (
          <Card style={{ marginBottom: 14 }}>
            <Label>¿De dónde comió?</Label>
            <View style={styles.opcionesRow}>
              {([['pecho_izq', 'Pecho izq.'], ['biberon', 'Biberón'], ['pecho_der', 'Pecho der.']] as const).map(([v, l]) => (
                <Opcion key={v} activo={fuente === v} onPress={() => setFuente(v)} label={l} />
              ))}
            </View>

            {fuente === 'biberon' ? (
              <>
                <Label>Cantidad</Label>
                <Contador valor={cantidadMl} setValor={setCantidadMl} paso={10} min={10} max={500} unidad="ml" atajos={[60, 120, 180]} />
              </>
            ) : (
              <>
                <Label>Duración</Label>
                <Contador valor={duracionMin} setValor={setDuracionMin} paso={5} min={1} max={120} unidad="min" atajos={[10, 15, 20]} />
              </>
            )}

            <NotaInput nota={nota} setNota={setNota} />
            <GuardarBtn
              guardando={guardando}
              onPress={() => registrar(
                fuente === 'biberon'
                  ? { tipo: 'toma', fuente, cantidad_ml: cantidadMl }
                  : { tipo: 'toma', fuente, duracion_min: duracionMin }
              )}
            />
          </Card>
        )}

        {/* Formulario de pañal */}
        {abierto === 'panal' && (
          <Card style={{ marginBottom: 14 }}>
            <Label>¿Qué había?</Label>
            <View style={styles.opcionesRow}>
              {([['pis', 'Pipí'], ['caca', 'Caca'], ['mixto', 'Ambos']] as const).map(([v, l]) => (
                <Opcion key={v} activo={panalTipo === v} onPress={() => setPanalTipo(v)} label={l} />
              ))}
            </View>
            <NotaInput nota={nota} setNota={setNota} />
            <GuardarBtn guardando={guardando} onPress={() => registrar({ tipo: 'panal', panal_tipo: panalTipo })} />
          </Card>
        )}

        {error && <ErrorState message={error} onRetry={() => cargar()} />}

        {/* Línea de tiempo */}
        <Text style={styles.seccion}>Últimos registros</Text>

        {registros.length === 0 && !error ? (
          <EmptyState
            title="Todavía no hay registros"
            message="Usa los botones de arriba para anotar la primera toma o cambio de pañal."
          />
        ) : (
          registros.map((r) => {
            const est = ESTILO[r.tipo as Tipo];
            return (
              <Card key={r.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.iconCircle, { backgroundColor: est.bg }]}>
                    <est.Icon size={19} color={est.fg} />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.itemTitle}>{describir(r)}</Text>
                    <Text style={styles.itemSub}>
                      {hora(r.fecha_hora)} · {haceCuanto(r.fecha_hora)}
                      {r.registrado_por_nombre ? ` · ${r.registrado_por_nombre}` : ''}
                    </Text>
                    {!!r.nota && <Text style={styles.itemNota}>{r.nota}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => eliminar(r.id)} hitSlop={8}>
                    <Trash2 size={16} color="#C4BFD4" />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </Screen>
    </SafeAreaView>
  );
}

/* ── piezas ── */

function Mini({ valor, etiqueta, bg }: any) {
  return (
    <View style={[styles.mini, { backgroundColor: bg }]}>
      <Text style={styles.miniValor}>{valor}</Text>
      <Text style={styles.miniEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

function Rapido({ tipo, activo, label, onPress }: any) {
  const est = ESTILO[tipo as Tipo];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.rapido, activo && { backgroundColor: est.fg, borderColor: est.fg }]}
    >
      <est.Icon size={22} color={activo ? '#fff' : est.fg} />
      <Text style={[styles.rapidoText, activo && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Label({ children }: any) {
  return <Text style={styles.label}>{children}</Text>;
}

function Opcion({ activo, onPress, label }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.opcion, activo && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
    >
      <Text style={[styles.opcionText, activo && { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Contador con +/- y atajos: de madrugada nadie quiere teclear. */
function Contador({ valor, setValor, paso, min, max, unidad, atajos }: any) {
  const ajustar = (d: number) => setValor(Math.min(max, Math.max(min, valor + d)));
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.contadorRow}>
        <TouchableOpacity onPress={() => ajustar(-paso)} style={styles.circulo} activeOpacity={0.7}>
          <Text style={styles.circuloText}>−</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center', minWidth: 100 }}>
          <Text style={styles.contadorValor}>{valor}</Text>
          <Text style={styles.contadorUnidad}>{unidad}</Text>
        </View>
        <TouchableOpacity
          onPress={() => ajustar(paso)}
          style={[styles.circulo, { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.circuloText, { color: '#fff' }]}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.atajosRow}>
        {atajos.map((a: number) => (
          <TouchableOpacity key={a} onPress={() => setValor(a)} style={styles.atajo} activeOpacity={0.8}>
            <Text style={styles.atajoText}>{a} {unidad}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function NotaInput({ nota, setNota }: any) {
  return (
    <>
      <Label>Nota (opcional)</Label>
      <TextInput
        value={nota}
        onChangeText={setNota}
        maxLength={300}
        placeholder="Algo que quieras recordar…"
        placeholderTextColor={Colors.muted}
        style={styles.input}
      />
    </>
  );
}

function GuardarBtn({ guardando, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={guardando}
      activeOpacity={0.85}
      style={[styles.guardar, guardando && { opacity: 0.6 }]}
    >
      {guardando ? <ActivityIndicator color="#fff" /> : (
        <>
          <Plus size={17} color="#fff" />
          <Text style={styles.guardarText}>Guardar registro</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mini: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  miniValor: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  miniEtiqueta: { fontSize: 11, fontFamily: 'Nunito_600SemiBold', color: Colors.muted, marginTop: 1 },
  suenoCard: { backgroundColor: Colors.primary, marginBottom: 14 },
  suenoTitulo: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: '#fff' },
  suenoSub: { fontSize: 13, fontFamily: 'Nunito_500Medium', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  despertarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#fff', borderRadius: 100, paddingVertical: 11, marginTop: 14,
  },
  despertarText: { color: Colors.primary, fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  rapidoRow: { flexDirection: 'row', gap: 9, marginBottom: 14 },
  rapido: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', gap: 7, borderWidth: 2, borderColor: Colors.border,
  },
  rapidoText: { fontSize: 13, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  label: { fontSize: 12.5, fontFamily: 'Nunito_800ExtraBold', color: Colors.text, marginBottom: 8 },
  opcionesRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  opcion: {
    flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  opcionText: { fontSize: 13, fontFamily: 'Nunito_700Bold', color: Colors.text },
  contadorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 12 },
  circulo: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card,
  },
  circuloText: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: Colors.primary },
  contadorValor: { fontSize: 32, fontFamily: 'Nunito_800ExtraBold', color: Colors.primary, lineHeight: 36 },
  contadorUnidad: { fontSize: 12, fontFamily: 'Nunito_600SemiBold', color: Colors.muted },
  atajosRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  atajo: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  atajoText: { fontSize: 12, fontFamily: 'Nunito_700Bold', color: Colors.primary },
  input: {
    backgroundColor: Colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, fontFamily: 'Nunito_500Medium', color: Colors.text,
    borderWidth: 1.5, borderColor: Colors.border, marginBottom: 16,
  },
  guardar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 100, paddingVertical: 14,
  },
  guardarText: { color: '#fff', fontFamily: 'Nunito_800ExtraBold', fontSize: 14.5 },
  seccion: { fontSize: 17, fontFamily: 'Nunito_800ExtraBold', color: Colors.text, marginTop: 8, marginBottom: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemTitle: { fontSize: 14.5, fontFamily: 'Nunito_700Bold', color: Colors.text },
  itemSub: { fontSize: 12.5, fontFamily: 'Nunito_500Medium', color: Colors.muted, marginTop: 2 },
  itemNota: { fontSize: 13, fontFamily: 'Nunito_500Medium', color: Colors.muted, marginTop: 5, fontStyle: 'italic' },
});
