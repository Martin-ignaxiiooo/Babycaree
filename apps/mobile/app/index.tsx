import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Lock, AlertCircle } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { API_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#7C5CBF', '#A07ADF']}
            style={styles.logoIcon}
          >
            <Heart size={24} color="white" fill="white" />
          </LinearGradient>
          <Text style={styles.logoText}>Iniciativa Baby</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Bienvenida de vuelta</Text>
          <Text style={styles.subtitle}>Ingresa a tu espacio seguro</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={20} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <InputField
              label="Correo electrónico"
              placeholder="tu.email@correo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <InputField
              label="Contraseña"
              placeholder="Tu contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showToggle
            />
          </View>

          <View style={styles.btnWrapper}>
            <PrimaryButton 
              label="Iniciar Sesión"
              onPress={handleLogin}
              loading={loading}
            />
          </View>

          <View style={styles.trustBadge}>
            <Lock size={14} color={Colors.muted} />
            <Text style={styles.trustText}>Sesión encriptada con nivel bancario</Text>
          </View>
        </View>

        {/* Register Link */}
        <Text style={styles.footerText}>
          ¿Eres nueva aquí?{' '}
          <Text 
            style={styles.linkText}
            onPress={() => router.push('/registro')}
          >
            Crea tu cuenta gratis
          </Text>
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 12,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Nunito_900Black',
    fontSize: 24,
    color: Colors.text,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 32,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  title: {
    fontFamily: 'Nunito_900Black',
    fontSize: 28,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: 'rgba(244,160,160,0.4)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  errorText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.errorText,
    flex: 1,
  },
  form: {
    marginBottom: 16,
  },
  btnWrapper: {
    marginTop: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  trustText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 13,
    color: Colors.muted,
  },
  footerText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 32,
  },
  linkText: {
    fontFamily: 'Nunito_800ExtraBold',
    color: Colors.primary,
  }
});
