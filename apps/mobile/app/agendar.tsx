import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { Mic, Square, Stethoscope, CalendarCheck, ArrowLeft, Sparkles } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { api, errorMessage } from '../constants/client';
import { API_URL } from '../constants/api';
import { useBaby } from '../constants/BabyContext';
import { Card, ScreenHeader, Screen } from '../components/UI';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TipoCita = 'control' | 'cita';

/** Fecha ISO -> texto editable "DD/MM/AAAA HH:MM" para mostrar en el form. */
function isoALegible(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** "DD/MM/AAAA HH:MM" -> ISO. Devuelve null si no se puede interpretar. */
function legibleAIso(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!m) return null;
  const [, dia, mes, anio, hora = '9', min = '00'] = m;
  const d = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(min));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function AgendarCitaScreen() {
  const router = useRouter();
  const { activeBabyId, activeBaby } = useBaby();

  const [tipo, setTipo] = useState<TipoCita>('control');
  const [fechaTexto, setFechaTexto] = useState('');
  const [medico, setMedico] = useState('');
  const [lugar, setLugar] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [notas, setNotas] = useState('');

  const [transcribiendo, setTranscribiendo] = useState(false);
  const [transcripcion, setTranscripcion] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  useEffect(() => {
    // El modo de audio hay que fijarlo antes de grabar: en iOS, sin
    // allowsRecording el micrófono queda mudo y se graba silencio.
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => {});
  }, []);

  const empezarAGrabar = useCallback(async () => {
    try {
      const permiso = await requestRecordingPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          'Permiso de micrófono',
          'Para dictar la cita necesitamos acceso al micrófono. Puedes activarlo en los ajustes del teléfono.'
        );
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      Alert.alert('No pudimos grabar', 'Intenta de nuevo en unos segundos.');
    }
  }, [recorder]);

  const detenerYTranscribir = useCallback(async () => {
    if (!activeBabyId) return;
    try {
      await recorder.stop();
    } catch {
      // Si el stop falla igual intentamos usar la uri que haya quedado.
    }

    const uri = recorder.uri;
    if (!uri) {
      Alert.alert('Sin audio', 'No se registró ninguna grabación. Intenta de nuevo.');
      return;
    }

    setTranscribiendo(true);
    try {
      // Se sube como multipart. Usamos fetch directo (y no el cliente axios)
      // porque en React Native el FormData con archivos necesita este formato
      // de objeto {uri, name, type}, que axios no siempre respeta.
      const token = await AsyncStorage.getItem('token');
      const form = new FormData();
      form.append('audio', {
        uri,
        name: 'nota.m4a',
        type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
      } as any);

      const res = await fetch(`${API_URL}/v1/salud/${activeBabyId}/citas/transcribir`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert(
          'No pudimos procesar el audio',
          data?.error ?? 'Intenta de nuevo o completa el formulario a mano.'
        );
        return;
      }

      // Prellenamos solo lo que vino: si el dictado no mencionó el lugar,
      // no borramos lo que el usuario ya hubiera escrito.
      if (data.fecha_cita) setFechaTexto(isoALegible(data.fecha_cita));
      if (data.medico) setMedico(data.medico);
      if (data.lugar) setLugar(data.lugar);
      if (data.especialidad) setEspecialidad(data.especialidad);
      if (data.notas) setNotas(data.notas);
      if (data.tipo === 'control' || data.tipo === 'cita') setTipo(data.tipo);
      setTranscripcion(data.transcripcion ?? null);
    } catch (e) {
      Alert.alert('Error de conexión', errorMessage(e));
    } finally {
      setTranscribiendo(false);
    }
  }, [recorder, activeBabyId]);

  const guardar = async () => {
    if (!activeBabyId) return;

    const iso = legibleAIso(fechaTexto);
    if (!iso) {
      Alert.alert(
        'Revisa la fecha',
        'Escríbela como DD/MM/AAAA HH:MM. Por ejemplo: 03/10/2026 10:30'
      );
      return;
    }

    setGuardando(true);
    try {
      await api.post(`/v1/salud/${activeBabyId}/citas`, {
        fecha_cita: iso,
        tipo,
        medico: medico.trim() || null,
        lugar: lugar.trim() || null,
        especialidad: especialidad.trim() || null,
        notas: notas.trim() || null,
      });
      Alert.alert(
        tipo === 'control' ? 'Control agendado' : 'Cita agendada',
        'Te enviaremos un recordatorio por correo antes de la fecha.',
        [{ text: 'Listo', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('No se pudo guardar', errorMessage(e));
    } finally {
      setGuardando(false);
    }
  };

  const grabando = recorderState.isRecording;

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <TouchableOpacity onPress={() => router.back()} style={styles.volver} activeOpacity={0.7}>
          <ArrowLeft size={18} color={Colors.primary} />
          <Text style={styles.volverText}>Volver</Text>
        </TouchableOpacity>

        <ScreenHeader
          title="Agendar"
          subtitle={
            activeBaby?.nombre
              ? `Nueva hora médica para ${activeBaby.nombre}.`
              : 'Nueva hora médica.'
          }
        />

        {/* Dictado por voz */}
        <Card style={{ marginBottom: 18 }}>
          <View style={styles.vozHeader}>
            <Sparkles size={17} color={Colors.primary} />
            <Text style={styles.vozTitulo}>Dictar la cita</Text>
          </View>
          <Text style={styles.vozAyuda}>
            Toca el micrófono y di algo como: “control del niño sano el viernes 3 de octubre a las
            diez y media, con la doctora Pérez en el consultorio”.
          </Text>

          <TouchableOpacity
            onPress={grabando ? detenerYTranscribir : empezarAGrabar}
            disabled={transcribiendo}
            activeOpacity={0.85}
            style={[
              styles.micBtn,
              grabando && styles.micBtnGrabando,
              transcribiendo && styles.micBtnDeshabilitado,
            ]}
          >
            {transcribiendo ? (
              <>
                <ActivityIndicator color="white" />
                <Text style={styles.micText}>Interpretando…</Text>
              </>
            ) : grabando ? (
              <>
                <Square size={18} color="white" fill="white" />
                <Text style={styles.micText}>
                  Detener ({Math.floor(recorderState.durationMillis / 1000)}s)
                </Text>
              </>
            ) : (
              <>
                <Mic size={19} color="white" />
                <Text style={styles.micText}>Grabar nota de voz</Text>
              </>
            )}
          </TouchableOpacity>

          {!!transcripcion && (
            <View style={styles.transcripcionBox}>
              <Text style={styles.transcripcionLabel}>Escuchamos:</Text>
              <Text style={styles.transcripcionTexto}>“{transcripcion}”</Text>
              <Text style={styles.transcripcionNota}>
                Revisa los datos abajo antes de guardar.
              </Text>
            </View>
          )}
        </Card>

        {/* Tipo */}
        <Text style={styles.label}>Tipo</Text>
        <View style={styles.tipoRow}>
          <TouchableOpacity
            onPress={() => setTipo('control')}
            activeOpacity={0.85}
            style={[styles.tipoBtn, tipo === 'control' && styles.tipoBtnActivo]}
          >
            <CalendarCheck size={20} color={tipo === 'control' ? 'white' : Colors.primary} />
            <Text style={[styles.tipoTitulo, tipo === 'control' && styles.tipoTextoActivo]}>
              Control sano
            </Text>
            <Text style={[styles.tipoSub, tipo === 'control' && styles.tipoSubActivo]}>
              Revisión periódica
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTipo('cita')}
            activeOpacity={0.85}
            style={[styles.tipoBtn, tipo === 'cita' && styles.tipoBtnActivo]}
          >
            <Stethoscope size={20} color={tipo === 'cita' ? 'white' : Colors.primary} />
            <Text style={[styles.tipoTitulo, tipo === 'cita' && styles.tipoTextoActivo]}>
              Cita médica
            </Text>
            <Text style={[styles.tipoSub, tipo === 'cita' && styles.tipoSubActivo]}>
              Por un motivo puntual
            </Text>
          </TouchableOpacity>
        </View>

        {/* Formulario */}
        <Text style={styles.label}>Fecha y hora</Text>
        <TextInput
          value={fechaTexto}
          onChangeText={setFechaTexto}
          placeholder="03/10/2026 10:30"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Médico</Text>
        <TextInput
          value={medico}
          onChangeText={setMedico}
          placeholder="Dra. Pérez"
          placeholderTextColor={Colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Especialidad</Text>
        <TextInput
          value={especialidad}
          onChangeText={setEspecialidad}
          placeholder="Pediatría"
          placeholderTextColor={Colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Lugar</Text>
        <TextInput
          value={lugar}
          onChangeText={setLugar}
          placeholder="Cesfam / Clínica"
          placeholderTextColor={Colors.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Notas</Text>
        <TextInput
          value={notas}
          onChangeText={setNotas}
          placeholder="Algo que quieras recordar…"
          placeholderTextColor={Colors.muted}
          style={[styles.input, styles.inputMultilinea]}
          multiline
        />

        <TouchableOpacity
          onPress={guardar}
          disabled={guardando}
          activeOpacity={0.85}
          style={[styles.guardarBtn, guardando && styles.micBtnDeshabilitado]}
        >
          {guardando ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.guardarText}>
              {tipo === 'control' ? 'Agendar control' : 'Agendar cita'}
            </Text>
          )}
        </TouchableOpacity>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  volverText: { color: Colors.primary, fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  vozHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  vozTitulo: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
  vozAyuda: {
    fontSize: 13.5,
    fontFamily: 'Nunito_500Medium',
    color: Colors.muted,
    lineHeight: 20,
    marginBottom: 14,
  },
  micBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: Colors.primary,
    borderRadius: 100,
    paddingVertical: 14,
  },
  micBtnGrabando: { backgroundColor: Colors.errorText },
  micBtnDeshabilitado: { opacity: 0.6 },
  micText: { color: 'white', fontFamily: 'Nunito_800ExtraBold', fontSize: 14.5 },
  transcripcionBox: {
    marginTop: 14,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
  },
  transcripcionLabel: {
    fontSize: 11.5,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  transcripcionTexto: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.text,
    marginTop: 5,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  transcripcionNota: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.muted,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
    marginBottom: 7,
    marginTop: 4,
  },
  tipoRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  tipoBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  tipoBtnActivo: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tipoTitulo: {
    fontSize: 14,
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.text,
    marginTop: 7,
  },
  tipoSub: {
    fontSize: 11.5,
    fontFamily: 'Nunito_500Medium',
    color: Colors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  tipoTextoActivo: { color: 'white' },
  tipoSubActivo: { color: 'rgba(255,255,255,0.85)' },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14.5,
    fontFamily: 'Nunito_500Medium',
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  inputMultilinea: { minHeight: 84, textAlignVertical: 'top' },
  guardarBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  guardarText: { color: 'white', fontFamily: 'Nunito_800ExtraBold', fontSize: 15.5 },
});
