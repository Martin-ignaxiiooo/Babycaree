import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '../constants/colors';

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  showToggle?: boolean;
}

export function InputField({ 
  label, placeholder, value, onChangeText, 
  secureTextEntry, keyboardType, showToggle 
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [show, setShow] = useState(false);

  const isPassword = secureTextEntry && !show;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} <Text style={{ color: Colors.error }}>*</Text>
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            showToggle && { paddingRight: 50 }
          ]}
          placeholder={placeholder}
          placeholderTextColor="#B0ABC4"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword}
          keyboardType={keyboardType}
          autoCapitalize="none"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {showToggle && (
          <TouchableOpacity 
            style={styles.toggleIcon} 
            onPress={() => setShow(!show)}
          >
            {show ? (
              <EyeOff size={22} color={Colors.muted} />
            ) : (
              <Eye size={22} color={Colors.muted} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 18,
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: Colors.text,
    backgroundColor: '#FDFCFF',
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  toggleIcon: {
    position: 'absolute',
    right: 16,
    height: '100%',
    justifyContent: 'center',
    padding: 4,
  }
});
