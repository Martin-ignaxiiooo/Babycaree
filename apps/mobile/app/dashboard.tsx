import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Bell, LogOut, Baby, Shield, Calendar, ChevronRight, TrendingUp } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { API_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

function getBabyAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 1) return 'Recién nacido';
  if (months < 12) return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} año${years > 1 ? 's' : ''} y ${rem} mes${rem > 1 ? 'es' : ''}` : `${years} año${years > 1 ? 's' : ''}`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [babies, setBabies] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (!token || !storedUser) {
          router.replace('/');
          return;
        }
        
        setUser(JSON.parse(storedUser));
        
        const res = await axios.get(`${API_URL}/profiles/babies`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setBabies(res.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          await AsyncStorage.clear();
          router.replace('/');
        }
      }
    };
    loadData();
  }, [router]);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/');
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <LinearGradient colors={['#7C5CBF', '#A07ADF']} style={styles.logoIcon}>
            <Heart size={16} color="white" fill="white" />
          </LinearGradient>
          <Text style={styles.logoText}>Iniciativa Baby</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell size={20} color={Colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color={Colors.muted} />
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* WELCOME */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>¡Hola, {user.nombre}! 👋</Text>
          <Text style={styles.welcomeSubtitle}>Aquí tienes el resumen de tu familia.</Text>
        </View>

        {/* STATS (Horizontal Scroll) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
          {[
            { label: 'Bebés registrados', value: babies.length.toString(), icon: Baby, color: Colors.accent, bg: Colors.accentLight },
            { label: 'Próximas vacunas', value: '—', icon: Shield, color: Colors.primary, bg: Colors.primaryLight },
            { label: 'Próximos controles', value: '—', icon: Calendar, color: Colors.success, bg: Colors.successLight },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconWrapper, { backgroundColor: stat.bg }]}>
                <stat.icon size={24} color={stat.color} />
              </View>
              <View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* BEBÉS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tus bebés</Text>
          {babies.length > 0 && (
            <TouchableOpacity style={styles.addBtnSmall}>
              <Text style={styles.addBtnSmallText}>Agregar bebé</Text>
              <ChevronRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {babies.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Baby size={40} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aún no hay perfiles registrados</Text>
            <Text style={styles.emptyDesc}>Registra a tu bebé para comenzar el seguimiento.</Text>
            <PrimaryButton label="Agregar bebé" onPress={() => router.push('/registro')} />
          </View>
        ) : (
          <View style={styles.babyList}>
            {babies.map((baby) => (
              <TouchableOpacity key={baby.id} style={styles.babyCard} activeOpacity={0.8}>
                <View style={styles.babyCardHeader}>
                  <LinearGradient colors={['#F4A0A0', '#f9c5c5']} style={styles.babyIconWrapper}>
                    <Baby size={24} color="white" />
                  </LinearGradient>
                  <ChevronRight size={24} color={Colors.border} />
                </View>
                <Text style={styles.babyName}>{baby.nombre}</Text>
                <Text style={styles.babyAge}>{getBabyAge(baby.fecha_nacimiento)}</Text>
                
                <View style={styles.divider} />
                <Text style={styles.babyDob}>
                  Nacido el {baby.fecha_nacimiento}
                </Text>

                <View style={styles.babyStatsRow}>
                  <View style={styles.babyStatPill}>
                    <Shield size={14} color={Colors.primary} />
                    <Text style={styles.babyStatText}>Vacunas</Text>
                  </View>
                  <View style={styles.babyStatPill}>
                    <TrendingUp size={14} color={Colors.success} />
                    <Text style={styles.babyStatText}>Controles</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    shadowColor: Colors.text, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, elevation: 2,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: 'Nunito_900Black', fontSize: 18, color: Colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: Colors.border },
  logoutText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#5a5a5a' },
  
  scroll: { flexGrow: 1, padding: 20 },
  
  welcomeContainer: { marginBottom: 24 },
  welcomeTitle: { fontFamily: 'Nunito_900Black', fontSize: 32, color: Colors.text, marginBottom: 4 },
  welcomeSubtitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: Colors.muted },
  
  statsScroll: { gap: 16, paddingRight: 20 },
  statCard: { 
    flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'white',
    padding: 20, borderRadius: 24, borderWidth: 1, borderColor: Colors.border,
    minWidth: 240, shadowColor: Colors.text, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, elevation: 2,
  },
  statIconWrapper: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: 'Nunito_900Black', fontSize: 28, color: Colors.text },
  statLabel: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: Colors.muted },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontFamily: 'Nunito_900Black', fontSize: 22, color: Colors.text },
  addBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, backgroundColor: 'white' },
  addBtnSmallText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: Colors.primary },

  emptyState: { 
    backgroundColor: 'white', borderRadius: 28, padding: 32, alignItems: 'center', 
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' 
  },
  emptyIconWrapper: { width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: Colors.text, marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: Colors.muted, textAlign: 'center', marginBottom: 24 },

  babyList: { gap: 16 },
  babyCard: { 
    backgroundColor: 'white', borderRadius: 28, padding: 24, 
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.text, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, elevation: 2,
  },
  babyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  babyIconWrapper: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  babyName: { fontFamily: 'Nunito_900Black', fontSize: 22, color: Colors.text, marginBottom: 2 },
  babyAge: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: Colors.primary, marginBottom: 12 },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 12 },
  babyDob: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.muted },
  babyStatsRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  babyStatPill: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.background, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  babyStatText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: Colors.muted }
});
