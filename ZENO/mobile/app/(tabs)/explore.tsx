import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassSurface } from '@/components/zeno_Style/glass-surface';
import { GradientBackdrop } from '@/components/zeno_Style/gradient-backdrop';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useConnection } from '@/hooks/use-connection';

export default function ConnectionScreen() {
  const router = useRouter();
  const { connected, connecting, connect, disconnect, serverUrl, setServerUrl, sessionId, lastError } =
    useConnection();

  return (
    <GradientBackdrop>
      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.title}>Connect</Text>
          <Text style={styles.subtitle}>
            Point the app at your PC backend, then create a live control session.
          </Text>
        </View>

        <GlassSurface variant="card" style={styles.qrCard}>
          <Text style={styles.cardLabel}>Server</Text>
          <GlassSurface variant="card" style={styles.inputShell}>
            <TextInput
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="http://192.168.0.10:4000"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.input}
            />
          </GlassSurface>

          <View style={styles.qrPlaceholder}>
            <Image
              source={require('@/assets/images/Ai_Agent.png')}
              style={styles.qrImage}
              contentFit="cover"
            />
            <View pointerEvents="none" style={styles.qrOverlay} />
          </View>

          <Text style={styles.cardHint}>
            {connected
              ? `Linked. Session ${sessionId?.toUpperCase() ?? '----'} is ready for commands.`
              : 'Use your PC local IP here, not localhost, when testing on a real phone.'}
          </Text>
          {lastError ? <Text style={styles.errorText}>{lastError}</Text> : null}
        </GlassSurface>

        <View style={styles.bottom}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (connected) {
                disconnect();
                return;
              }

              connect();
              router.replace('/');
            }}
            style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.98 }] }]}>
            <GlassSurface variant="button" style={styles.fabInner}>
              <IconSymbol
                name={connected ? 'bolt.slash.fill' : 'qrcode.viewfinder'}
                size={22}
                color="rgba(255,255,255,0.92)"
              />
            </GlassSurface>
          </Pressable>
          <Text style={styles.bottomHint}>{connected ? 'Disconnect' : connecting ? 'Linking' : 'Connect'}</Text>
        </View>
      </View>
    </GradientBackdrop>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 34,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  top: {
    gap: 10,
    paddingBottom: 18,
  },
  title: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 15,
    lineHeight: 20,
  },
  qrCard: {
    flex: 1,
    padding: 18,
    gap: 12,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  inputShell: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  input: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    paddingVertical: 10,
  },
  qrPlaceholder: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.24)',
  },
  cardHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    lineHeight: 18,
  },
  bottom: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 18,
  },
  fab: {
    width: 72,
    height: 72,
  },
  fabInner: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.14)',
    borderColor: 'rgba(192,132,252,0.32)',
  },
  bottomHint: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
