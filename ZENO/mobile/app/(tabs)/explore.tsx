import { useRouter, usePathname } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GlassSurface } from '@/components/zeno_Style/glass-surface';
import { GradientBackdrop } from '@/components/zeno_Style/gradient-backdrop';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useConnection } from '@/hooks/use-connection';
import { CameraView, useCameraPermissions } from 'expo-camera';

function ScannerView({ onScanned }: { onScanned: (data: { sessionId: string; serverUrl: string }) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);

  if (!permission) {
    return <View style={styles.scannerPlaceholder}><Text style={styles.scannerText}>Loading...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.scannerPlaceholder}>
        <Text style={styles.scannerText}>Camera permission needed</Text>
        <Pressable onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  const handleScan = ({ data }: any) => {
    if (scanned.current) return;
    scanned.current = true;

    try {
      const parsed = JSON.parse(data);
      onScanned(parsed);
    } catch (e) {
      console.error("Invalid QR data:", e);
      scanned.current = false;
    }
  };

  return (
    <CameraView
      style={{ flex: 1 }}
      facing="back"
      onBarcodeScanned={handleScan}
      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
    />
  );
}

export default function ConnectionScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { connected, connecting, joinSession, disconnect, serverUrl, setServerUrl, sessionId, lastError } =
    useConnection();
  const [showScanner, setShowScanner] = useState(false);

  // Navigate to AI chat once the session is actually joined.
  useEffect(() => {
    if (connected && sessionId && pathname.includes('explore')) {
      router.replace('/');
    }
  }, [connected, pathname, router, sessionId]);

  const handleConnect = () => {
    if (connected) {
      disconnect();
      setShowScanner(false);
      return;
    }
    // Just turn on the scanner - connection happens after QR scan
    setShowScanner(true);
  };

  const handleQRScanned = ({ sessionId, serverUrl }: { sessionId: string; serverUrl: string }) => {
    setServerUrl(serverUrl);
    setShowScanner(false);
    joinSession(sessionId, serverUrl);
  };

  return (
    <GradientBackdrop>
      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.title}>{connected ? 'Connected' : 'Connect'}</Text>
          <Text style={styles.subtitle}>
            {connected
              ? `Session ${sessionId?.toUpperCase() ?? '----'} active`
              : 'Tap the button to scan QR code from your PC'}
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
              placeholder="http://192.168.105.96:4000"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.input}
            />
          </GlassSurface>

          <View style={styles.qrPlaceholder}>
            {showScanner ? (
              <ScannerView onScanned={handleQRScanned} />
            ) : (
              <View style={styles.scannerPlaceholder}>
                {connecting ? (
                  <ActivityIndicator size="large" color="rgba(192,132,252,0.8)" />
                ) : (
                  <IconSymbol name="qrcode.viewfinder" size={48} color="rgba(255,255,255,0.35)" />
                )}
                <Text style={styles.scannerHint}>
                  {connected ? 'Connected!' : 'Tap button below to scan'}
                </Text>
              </View>
            )}
            <View pointerEvents="none" style={styles.qrOverlay} />
          </View>

          <Text style={styles.cardHint}>
            {connected
              ? 'Redirecting to ZENO assistant...'
              : 'Make sure your PC backend is running'}
          </Text>
          {lastError ? <Text style={styles.errorText}>{lastError}</Text> : null}
        </GlassSurface>

        <View style={styles.bottom}>
          <Pressable
            accessibilityRole="button"
            onPress={handleConnect}
            style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.98 }] }]}>
            <GlassSurface variant="button" style={styles.fabInner}>
              <IconSymbol
                name={connected ? 'bolt.slash.fill' : 'qrcode.viewfinder'}
                size={22}
                color="rgba(255,255,255,0.92)"
              />
            </GlassSurface>
          </Pressable>
          <Text style={styles.bottomHint}>
            {connected ? 'Disconnect' : connecting ? 'Cancel' : 'Scan QR'}
          </Text>
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
  scannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scannerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  scannerHint: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    marginTop: 8,
  },
  permissionButton: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
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
