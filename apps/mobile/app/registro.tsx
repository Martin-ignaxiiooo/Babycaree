import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Shield, Baby, Sparkles, Check, ChevronLeft, Heart, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ProgressBar } from '../components/ProgressBar';
import { API_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [flow, setFlow] = useState<string | null>(null);
  
  const [account, setAccount] = useState({ nombre: '', apellidos: '', email: '', password: '', passwordConfirm: '' });
  const [accountError, setAccountError] = useState('');
  
  const [baby, setBaby] = useState({ nombre: '', fecha_nacimiento: '', sexo: '', es_prematuro: false, semanas_gestacion: '' });
  const [babyError, setBabyError] = useState('');
  
  const [consents, setConsents] = useState({ cb1: false, cb2: false, cb3: false });
  const [consentError, setConsentError] = useState(false);
  
  const [successBabyName, setSuccessBabyName] = useState('');

  const validateAccount = () => {
    if (!account.nombre || !account.apellidos || !account.email || !account.password) {
      setAccountError('Por favor completa todos los campos.'); return false;
    }
    if (account.password.length < 8) {
      setAccountError('La contraseña debe tener al menos 8 caracteres.'); return false;
    }
    if (account.password !== account.passwordConfirm) {
      setAccountError('Las contraseñas no coinciden.'); return false;
    }
    setAccountError(''); return true;
  };

  const validateBaby = () => {
    if (!baby.nombre || !baby.fecha_nacimiento) {
      setBabyError('El nombre y la fecha son obligatorios.'); return false;
    }
    setBabyError(''); return true;
  };

  const handleNext = async () => {
    if (step === 1 && flow) { setStep(2); }
    else if (step === 2) { if (validateAccount()) setStep(3); }
    else if (step === 3) { if (validateBaby()) setStep(4); }
    else if (step === 4) {
      if (!consents.cb1 || !consents.cb2 || !consents.cb3) { setConsentError(true); return; }
      setConsentError(false);
      setLoading(true);
      try {
        const authRes = await axios.post(`${API_URL}/auth/register`, {
          email: account.email, password: account.password,
          nombre: account.nombre, apellidos: account.apellidos,
        });
        const userToken = authRes.data.token;
        await AsyncStorage.setItem('token', userToken);
        await AsyncStorage.setItem('user', JSON.stringify(authRes.data.user));

        await axios.post(`${API_URL}/profiles/babies`, {
          nombre: baby.nombre, 
          fecha_nacimiento: baby.fecha_nacimiento, // Debe venir formato YYYY-MM-DD
          sexo: baby.sexo || 'N/A', 
          es_prematuro: baby.es_prematuro,
          semanas_gestacion: baby.es_prematuro ? parseInt(baby.semanas_gestacion) : null,
        }, { headers: { Authorization: `Bearer ${userToken}` } });
        
        setSuccessBabyName(baby.nombre);
        setStep(5);
      } catch (err: any) {
        alert(err.response?.data?.error || 'Ocurrió un error.');
      } finally {
        setLoading(false);
      }
    }
  };

  const stepTitles = ['¡Hola! ¿A quién vamos a cuidar?', 'Crea tu espacio seguro', flow === 'hijo' ? 'Cuéntanos sobre tu bebé' : 'Cuéntanos sobre tu embarazo', 'Un pacto de confianza'];
  const stepSubtitles = ['Elige el camino que más se adapte a tu momento.', 'Solo lo necesario para proteger tu cuenta.', 'Personalizaremos el seguimiento de salud con estos datos.', 'Necesitamos tu consentimiento para cuidarte.'];

  // --- RENDERS DE PASOS ---

  const renderStepOne = () => (
    <View style={styles.stepContainer}>
      <View style={styles.trustBadge}>
        <View style={styles.trustIcon}>
          <Lock size={20} color="white" />
        </View>
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text style={styles.trustTitle}>Registro seguro con cifrado bancario</Text>
          <Text style={styles.trustText}>Tus datos bajo la Ley 19.628 de Chile.</Text>
        </View>
        <Shield size={24} color="rgba(124,92,191,0.4)" />
      </View>

      <TouchableOpacity 
        style={[styles.flowCard, flow === 'hijo' && styles.flowCardActive]}
        onPress={() => setFlow('hijo')}
        activeOpacity={0.8}
      >
        <View style={[styles.flowIcon, flow === 'hijo' ? { backgroundColor: Colors.accent } : { backgroundColor: Colors.border }]}>
          <Baby size={24} color={flow === 'hijo' ? 'white' : Colors.muted} />
        </View>
        <View style={styles.flowContent}>
          <Text style={styles.flowTitle}>Registrar a mi bebé</Text>
          <Text style={styles.flowDesc}>Para bebés que ya están en tus brazos. Seguimiento de vacunas y desarrollo.</Text>
        </View>
        <View style={[styles.flowRadio, flow === 'hijo' && styles.flowRadioActive]}>
          {flow === 'hijo' && <Check size={12} color="white" strokeWidth={3} />}
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.flowCard, flow === 'embarazo' && { borderColor: Colors.primary, backgroundColor: '#F6F3FB' }]}
        onPress={() => setFlow('embarazo')}
        activeOpacity={0.8}
      >
        <View style={[styles.flowIcon, flow === 'embarazo' ? { backgroundColor: Colors.primary } : { backgroundColor: Colors.border }]}>
          <Sparkles size={24} color={flow === 'embarazo' ? 'white' : Colors.muted} />
        </View>
        <View style={styles.flowContent}>
          <Text style={styles.flowTitle}>Registrar mi embarazo</Text>
          <Text style={styles.flowDesc}>Te acompañaremos semana a semana hasta el gran día del nacimiento.</Text>
        </View>
        <View style={[styles.flowRadio, flow === 'embarazo' && { borderColor: Colors.primary, backgroundColor: Colors.primary }]}>
          {flow === 'embarazo' && <Check size={12} color="white" strokeWidth={3} />}
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderStepTwo = () => (
    <View style={styles.stepContainer}>
      {accountError ? <Text style={styles.errorText}>{accountError}</Text> : null}
      <InputField label="Nombre" placeholder="Tu nombre" value={account.nombre} onChangeText={(t) => setAccount({...account, nombre: t})} />
      <InputField label="Apellidos" placeholder="Tus apellidos" value={account.apellidos} onChangeText={(t) => setAccount({...account, apellidos: t})} />
      <InputField label="Correo" placeholder="tu.email@correo.com" value={account.email} onChangeText={(t) => setAccount({...account, email: t})} keyboardType="email-address" />
      <InputField label="Contraseña" placeholder="Mín. 8 caracteres" value={account.password} onChangeText={(t) => setAccount({...account, password: t})} secureTextEntry showToggle />
      <InputField label="Confirmar" placeholder="Repite la clave" value={account.passwordConfirm} onChangeText={(t) => setAccount({...account, passwordConfirm: t})} secureTextEntry showToggle />
    </View>
  );

  const renderStepThree = () => (
    <View style={styles.stepContainer}>
      {babyError ? <Text style={styles.errorText}>{babyError}</Text> : null}
      <InputField 
        label={flow === 'hijo' ? 'Nombre del bebé' : 'Nombre provisional'} 
        placeholder="Ej: Sofía" 
        value={baby.nombre} onChangeText={(t) => setBaby({...baby, nombre: t})} 
      />
      <InputField 
        label={flow === 'hijo' ? 'Fecha de nacimiento' : 'Fecha probable de parto'} 
        placeholder="YYYY-MM-DD" 
        value={baby.fecha_nacimiento} onChangeText={(t) => setBaby({...baby, fecha_nacimiento: t})} 
      />
      
      {flow === 'hijo' && (
        <TouchableOpacity style={styles.prematuroCard} onPress={() => setBaby({...baby, es_prematuro: !baby.es_prematuro})} activeOpacity={0.8}>
          <View style={[styles.flowRadio, baby.es_prematuro && { borderColor: Colors.primary, backgroundColor: Colors.primary }]}>
            {baby.es_prematuro && <Check size={12} color="white" strokeWidth={3} />}
          </View>
          <Text style={styles.prematuroTitle}>Mi bebé nació prematuro</Text>
        </TouchableOpacity>
      )}

      {flow === 'hijo' && baby.es_prematuro && (
        <InputField 
          label="Semanas de gestación" placeholder="Ej: 34" 
          value={baby.semanas_gestacion} onChangeText={(t) => setBaby({...baby, semanas_gestacion: t})} keyboardType="numeric" 
        />
      )}
    </View>
  );

  const renderStepFour = () => {
    const items = [
      { key: 'cb1', title: 'Términos y Privacidad', desc: 'Acepto el funcionamiento de la plataforma y política de privacidad.' },
      { key: 'cb2', title: 'Datos Sensibles', desc: 'Autorizo el tratamiento encriptado de los datos de salud.' },
      { key: 'cb3', title: 'Notificaciones', desc: 'Acepto recibir recordatorios de vacunas y controles.' },
    ];
    return (
      <View style={styles.stepContainer}>
        {consentError && <Text style={styles.errorText}>Debes aceptar todo para continuar.</Text>}
        {items.map(({ key, title, desc }) => {
          const checked = consents[key as keyof typeof consents];
          return (
            <TouchableOpacity key={key} style={[styles.consentCard, checked && styles.consentCardActive]} onPress={() => setConsents({...consents, [key]: !checked})} activeOpacity={0.8}>
              <View style={[styles.flowRadio, checked && { borderColor: Colors.success, backgroundColor: Colors.success }]}>
                {checked && <Check size={12} color="white" strokeWidth={3} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.consentTitle}>{title}</Text>
                <Text style={styles.consentDesc}>{desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIconWrapper}>
        <CheckCircle2 size={70} color={Colors.success} strokeWidth={1.5} />
      </View>
      <Text style={styles.successTitle}>¡Bienvenida a la familia!</Text>
      <Text style={styles.successDesc}>El espacio seguro para {successBabyName} está listo.</Text>
      <PrimaryButton label="Entrar a mi panel" onPress={() => router.replace('/dashboard')} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <View style={styles.card}>
            {step < 5 && (
              <>
                <ProgressBar step={step} />
                <View style={styles.header}>
                  <Text style={styles.title}>{stepTitles[step - 1]}</Text>
                  <Text style={styles.subtitle}>{stepSubtitles[step - 1]}</Text>
                </View>
              </>
            )}

            {step === 1 && renderStepOne()}
            {step === 2 && renderStepTwo()}
            {step === 3 && renderStepThree()}
            {step === 4 && renderStepFour()}
            {step === 5 && renderSuccess()}

            {step < 5 && (
              <View style={styles.btnRow}>
                {step > 1 && (
                  <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)} disabled={loading}>
                    <ChevronLeft size={24} color={Colors.muted} />
                  </TouchableOpacity>
                )}
                <View style={{ flex: 1 }}>
                  <PrimaryButton 
                    label={step === 4 ? "Crear Cuenta" : "Siguiente"} 
                    onPress={handleNext} 
                    loading={loading}
                    disabled={step === 1 && !flow}
                  />
                </View>
              </View>
            )}
          </View>

          {step < 5 && (
            <Text style={styles.footerText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.linkText} onPress={() => router.replace('/')}>Inicia sesión aquí</Text>
            </Text>
          )}
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  card: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 24,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  header: { marginBottom: 24 },
  title: { fontFamily: 'Nunito_900Black', fontSize: 26, color: Colors.text, marginBottom: 8 },
  subtitle: { fontFamily: 'Nunito_500Medium', fontSize: 16, color: Colors.muted },
  stepContainer: { gap: 16 },
  
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight,
    padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(124,92,191,0.15)',
    marginBottom: 16,
  },
  trustIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  trustTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: Colors.text, marginBottom: 4 },
  trustText: { fontFamily: 'Nunito_500Medium', fontSize: 12, color: Colors.muted },
  
  flowCard: {
    flexDirection: 'row', padding: 20, borderRadius: 24, borderWidth: 2, borderColor: Colors.border, backgroundColor: 'white',
  },
  flowCardActive: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
  flowIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  flowContent: { flex: 1, justifyContent: 'center' },
  flowTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: Colors.text, marginBottom: 4 },
  flowDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.muted, lineHeight: 18 },
  flowRadio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginLeft: 12, alignSelf: 'center' },
  flowRadioActive: { borderColor: Colors.accent, backgroundColor: Colors.accent },

  prematuroCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 2, borderColor: Colors.border, gap: 12 },
  prematuroTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: Colors.text },

  consentCard: { flexDirection: 'row', padding: 16, borderRadius: 20, borderWidth: 2, borderColor: Colors.border, gap: 12, alignItems: 'center' },
  consentCardActive: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  consentTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: Colors.text, marginBottom: 2 },
  consentDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.muted },

  errorText: { fontFamily: 'Nunito_700Bold', color: Colors.errorText, fontSize: 14, marginBottom: 8, textAlign: 'center' },
  
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 32 },
  backBtn: { width: 60, height: 60, borderRadius: 20, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  
  successContainer: { alignItems: 'center', paddingVertical: 40 },
  successIconWrapper: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { fontFamily: 'Nunito_900Black', fontSize: 28, color: Colors.text, marginBottom: 12 },
  successDesc: { fontFamily: 'Nunito_500Medium', fontSize: 16, color: Colors.muted, textAlign: 'center', marginBottom: 32 },
  
  footerText: { fontFamily: 'Nunito_500Medium', fontSize: 15, color: Colors.muted, textAlign: 'center', marginTop: 24 },
  linkText: { fontFamily: 'Nunito_800ExtraBold', color: Colors.primary }
});
