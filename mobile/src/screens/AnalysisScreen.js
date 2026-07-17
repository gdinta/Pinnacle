// mobile/src/screens/AnalysisScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const COLORS = {
  primary: '#0f172a',
  text: '#f1f5f9',
};

export default function AnalysisScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Job Analysis Form</Text>
        <Text style={styles.subtitle}>Coming soon - Enter job details here</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#cbd5e1',
  },
});
