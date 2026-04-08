import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export function GradientBackdrop({ children }: PropsWithChildren) {
  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.glowA} />
      <View pointerEvents="none" style={styles.glowB} />
      <View pointerEvents="none" style={styles.glowC} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050215',
  },
  content: {
    flex: 1,
  },
  glowA: {
    position: 'absolute',
    top: -120,
    left: -90,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: '#7C3AED',
    opacity: 0.28,
  },
  glowB: {
    position: 'absolute',
    bottom: -160,
    right: -120,
    width: 380,
    height: 380,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
    opacity: 0.24,
  },
  glowC: {
    position: 'absolute',
    top: 200,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: '#C084FC',
    opacity: 0.12,
  },
});

