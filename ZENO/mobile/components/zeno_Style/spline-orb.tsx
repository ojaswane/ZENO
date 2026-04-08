import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import type { AssistantOrbState } from '@/hooks/use-assistant-demo';

type Props = {
  state: AssistantOrbState;
  thinkingUrl: string;
  speakingUrl: string;
  size?: number;
};

function splineEmbedHtml(url: string) {
  const escaped = url.replace(/"/g, '&quot;');
  return `<!doctype html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <style>
        html, body { margin:0; padding:0; width:100%; height:100%; background:transparent; overflow:hidden; }
        iframe { position:absolute; inset:0; width:100%; height:100%; border:0; background:transparent; }
      </style>
    </head>
    <body>
      <iframe src="${escaped}" allow="autoplay; fullscreen"></iframe>
    </body>
  </html>`;
}

function FallbackOrb({ state, size }: { state: AssistantOrbState; size: number }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulse.stopAnimation();
    pulse.setValue(0);

    const duration = state === 'speaking' ? 720 : state === 'thinking' ? 1850 : 2600;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [pulse, state]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.06] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={[styles.fallbackGlow, { opacity: glowOpacity, transform: [{ scale }] }]} />
      <Animated.View style={[styles.fallbackCore, { transform: [{ scale }] }]} />
    </View>
  );
}

export function SplineOrb({ state, thinkingUrl, speakingUrl, size = 260 }: Props) {
  const speakingOpacity = useRef(new Animated.Value(0)).current;
  const [speakingMounted, setSpeakingMounted] = useState(false);
  
  useEffect(() => {
    if (state === 'speaking') setSpeakingMounted(true);
    Animated.timing(speakingOpacity, {
      toValue: state === 'speaking' ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [speakingOpacity, state]);
  
  const thinkingHtml = useMemo(() => splineEmbedHtml(thinkingUrl), [thinkingUrl]);
  const speakingHtml = useMemo(() => splineEmbedHtml(speakingUrl), [speakingUrl]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View pointerEvents="none" style={styles.glowRing} />

      <Animated.View style={[styles.layer, { opacity: Animated.subtract(1, speakingOpacity) }]}>
        <WebView
          source={{ html: thinkingHtml }}
          originWhitelist={['*']}
          style={styles.web}
          containerStyle={styles.web}
          scrollEnabled={false}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
        />
      </Animated.View>

      {speakingMounted ? (
        <Animated.View style={[styles.layer, { opacity: speakingOpacity }]}>
          <WebView
            source={{ html: speakingHtml }}
            originWhitelist={['*']}
            style={styles.web}
            containerStyle={styles.web}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            setSupportMultipleWindows={false}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    overflow: 'hidden',
  },
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  glowRing: {
    position: 'absolute',
    width: '98%',
    height: '98%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.35)',
    shadowColor: '#C084FC',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  fallbackGlow: {
    position: 'absolute',
    width: '94%',
    height: '94%',
    borderRadius: 999,
    backgroundColor: 'rgba(124,58,237,0.25)',
    shadowColor: '#C084FC',
    shadowOpacity: 0.55,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
  },
  fallbackCore: {
    width: '58%',
    height: '58%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.30)',
  },
});
