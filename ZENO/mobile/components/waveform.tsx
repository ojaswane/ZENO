import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

export function Waveform({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <View style={styles.wrap}>
      <LottieView
        source={require('../assets/WaveForm.json')}
        autoPlay
        loop
        style={styles.anim}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  anim: {
    width: 220,
    height: 70,
  },
});

