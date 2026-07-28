import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

/** TESTE_MINIMO_V1 — zero imports de Cocina/imagens. Se isto abrir, o Expo está ok. */
export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Text style={styles.brand}>ORBE</Text>
      <Text style={styles.ok}>App vivo</Text>
      <Text style={styles.hint}>Se você está vendo isto, o Expo Go voltou.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fef6e8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 6,
    color: '#c96a20',
    marginBottom: 8,
  },
  ok: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d1400',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#9a7050',
    textAlign: 'center',
  },
});
