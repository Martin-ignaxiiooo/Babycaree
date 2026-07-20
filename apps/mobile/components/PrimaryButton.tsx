import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  variant?: 'primary' | 'outline';
}

export function PrimaryButton({ 
  label, onPress, loading, disabled, icon: Icon, variant = 'primary' 
}: PrimaryButtonProps) {
  const isOutline = variant === 'outline';
  const isDisabled = disabled || loading;

  const content = (
    <View style={styles.contentContainer}>
      {loading ? (
        <>
          <ActivityIndicator color={isOutline ? Colors.muted : 'white'} style={{ marginRight: 8 }} />
          <Text style={[styles.text, isOutline ? styles.textOutline : styles.textPrimary]}>
            Procesando...
          </Text>
        </>
      ) : (
        <>
          {Icon && <Icon size={20} color={isDisabled ? Colors.muted : (isOutline ? Colors.muted : 'white')} style={{ marginRight: 8 }} />}
          <Text style={[
            styles.text, 
            isOutline ? styles.textOutline : styles.textPrimary,
            isDisabled && isOutline && { color: Colors.muted },
            isDisabled && !isOutline && { color: '#B0ABC4' }
          ]}>
            {label}
          </Text>
        </>
      )}
    </View>
  );

  if (isOutline) {
    return (
      <TouchableOpacity 
        style={[styles.button, styles.outline, isDisabled && styles.disabledOutline]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  if (isDisabled) {
    return (
      <View style={[styles.button, styles.disabledPrimary]}>
        {content}
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.shadow}>
      <LinearGradient
        colors={['#7C5CBF', '#A07ADF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
  },
  textPrimary: {
    color: 'white',
  },
  textOutline: {
    color: Colors.muted,
  },
  outline: {
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: 'white',
  },
  disabledPrimary: {
    backgroundColor: '#E5E3EC',
  },
  disabledOutline: {
    opacity: 0.6,
  }
});
