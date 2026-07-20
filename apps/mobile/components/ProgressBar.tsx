import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';

const TOTAL_STEPS = 4;
const LABELS = ['Inicio', 'Cuenta', 'Bebé', 'Legal'];
const { width } = Dimensions.get('window');

export function ProgressBar({ step }: { step: number }) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
    Animated.timing(animatedWidth, {
      toValue: pct,
      duration: 500,
      useNativeDriver: false, // backgroundColor/width don't support native driver easily
    }).start();
  }, [step]);

  return (
    <View style={styles.container}>
      {/* Background Line */}
      <View style={styles.lineBg}>
        <Animated.View style={[
          styles.lineActive, 
          { 
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            })
          }
        ]}>
          <LinearGradient
            colors={['#7C5CBF', '#F4A0A0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(n => {
          const isActive = n === step;
          const isPast = n < step;

          return (
            <View key={n} style={styles.dotWrapper}>
              <View style={[
                styles.dot,
                isActive && styles.dotActive,
                isPast && styles.dotPast,
                !isActive && !isPast && styles.dotFuture,
              ]}>
                {isPast ? (
                  <Check size={18} color="white" strokeWidth={3} />
                ) : (
                  <Text style={[
                    styles.dotText,
                    isActive || isPast ? styles.dotTextActive : styles.dotTextFuture
                  ]}>
                    {n}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.label,
                isActive ? styles.labelActive : styles.labelFuture
              ]}>
                {LABELS[n - 1]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    position: 'relative',
    paddingHorizontal: 8,
  },
  lineBg: {
    position: 'absolute',
    top: 20,
    left: 32,
    right: 32,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
  },
  lineActive: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dotWrapper: {
    alignItems: 'center',
    width: 60,
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.15 }],
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  dotPast: {
    backgroundColor: Colors.success,
  },
  dotFuture: {
    backgroundColor: Colors.border,
  },
  dotText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
  },
  dotTextActive: {
    color: 'white',
  },
  dotTextFuture: {
    color: Colors.muted,
  },
  label: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: Colors.primary,
  },
  labelFuture: {
    color: '#B0ABC4',
  }
});
