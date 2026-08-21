import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Stethoscope, CalendarCheck, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { api, errorMessage } from '../constants/client';
import { useBaby } from '../constants/BabyContext';
import { ScreenHeader, Screen } from '../components/UI';

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

  const [guardando, setGuardando] = useState(false);

  // El dictado por voz vive en la versión web, donde el navegador lo hace
  // gratis con la Web Speech API. En la app nativa haría falta un servicio
  // de transcripción de pago, así que acá se completa a mano.

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
          style={[styles.guardarBtn, guardando && styles.guardarBtnDeshabilitado]}
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
  vozTitulo: { fontSize: 16, fontFamily: 'Nunito_800ExtraBold', color: Colors.text },
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
  guardarBtnDeshabilitado: { opacity: 0.6 },
  guardarText: { color: 'white', fontFamily: 'Nunito_800ExtraBold', fontSize: 15.5 },
});
