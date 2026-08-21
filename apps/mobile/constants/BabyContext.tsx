import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { api, setUnauthorizedHandler } from './client';

export interface Bebe {
  id: string;
  nombre?: string;
  fecha_nacimiento?: string | null;
  estado?: string;
  [key: string]: any;
}

interface BabyContextValue {
  user: any;
  bebes: Bebe[];
  activeBaby: Bebe | null;
  activeBabyId: string | null;
  loading: boolean;
  setActiveBabyId: (id: string) => void;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
}

const BabyContext = createContext<BabyContextValue | null>(null);

export function useBaby() {
  const ctx = useContext(BabyContext);
  if (!ctx) throw new Error('useBaby debe usarse dentro de <BabyProvider>');
  return ctx;
}

export function BabyProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bebes, setBebes] = useState<Bebe[]>([]);
  const [activeBabyId, setActiveBabyIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [token, storedUser, storedBabyId] = await AsyncStorage.multiGet([
        'token',
        'user',
        'activeBabyId',
      ]).then((entries) => entries.map(([, v]) => v));

      if (!token || !storedUser) {
        router.replace('/');
        return;
      }
      setUser(JSON.parse(storedUser));

      const res = await api.get('/profiles/babies');
      const lista: Bebe[] = Array.isArray(res.data) ? res.data : [];
      setBebes(lista);

      // Respetamos el bebé que el usuario tenía elegido, si sigue existiendo.
      const elegido = lista.find((b) => b.id === storedBabyId) ?? lista[0] ?? null;
      if (elegido) {
        setActiveBabyIdState(elegido.id);
        await AsyncStorage.setItem('activeBabyId', elegido.id);
      }
    } catch {
      // El interceptor ya maneja el 401; acá evitamos romper la UI.
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setUnauthorizedHandler(() => router.replace('/'));
    load();
    return () => setUnauthorizedHandler(null);
  }, [load, router]);

  const setActiveBabyId = useCallback((id: string) => {
    setActiveBabyIdState(id);
    AsyncStorage.setItem('activeBabyId', id);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.clear();
    router.replace('/');
  }, [router]);

  const activeBaby = bebes.find((b) => b.id === activeBabyId) ?? null;

  return (
    <BabyContext.Provider
      value={{ user, bebes, activeBaby, activeBabyId, loading, setActiveBabyId, logout, reload: load }}
    >
      {children}
    </BabyContext.Provider>
  );
}
