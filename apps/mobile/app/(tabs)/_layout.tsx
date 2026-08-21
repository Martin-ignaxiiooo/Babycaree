import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LayoutDashboard, HeartPulse, Lightbulb, Stethoscope, User } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { BabyProvider } from '../../constants/BabyContext';

/** Píldora detrás del ícono activo: el detalle que hace que la barra se sienta viva. */
function TabIcon({ Icon, focused }: { Icon: typeof LayoutDashboard; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon size={21} color={focused ? Colors.primary : Colors.muted} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <BabyProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.muted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          sceneStyle: { backgroundColor: Colors.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ focused }) => <TabIcon Icon={LayoutDashboard} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="salud"
          options={{
            title: 'Salud',
            tabBarIcon: ({ focused }) => <TabIcon Icon={HeartPulse} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="consejos"
          options={{
            title: 'Consejos',
            tabBarIcon: ({ focused }) => <TabIcon Icon={Lightbulb} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="directorio"
          options={{
            title: 'Médicos',
            tabBarIcon: ({ focused }) => <TabIcon Icon={Stethoscope} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
          }}
        />
      </Tabs>
    </BabyProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 86,
    paddingTop: 8,
    paddingBottom: 24,
  },
  tabLabel: { fontSize: 11, fontFamily: 'Nunito_700Bold', marginTop: 2 },
  iconWrap: {
    width: 52,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: Colors.primaryLight },
});
