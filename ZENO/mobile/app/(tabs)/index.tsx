import React, { useMemo } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { GlassSurface } from '@/components/zeno_Style/glass-surface';
import { GradientBackdrop } from '@/components/zeno_Style/gradient-backdrop';
// import { SplineOrb } from '@/components/zeno_Style/spline-orb';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { ChatMessage } from '@/hooks/use-assistant-demo';
import { useAssistantDemo } from '@/hooks/use-assistant-demo';
import { useConnection } from '@/hooks/use-connection';
import { Image } from 'expo-image';

// import {} from '../assets/gifs/speaking.gif'

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
      <GlassSurface
        variant="card"
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={styles.bubbleText}>{message.text}</Text>
      </GlassSurface>
    </View>
  );
}

export default function AssistantScreen() {
  const { connected, connecting, sessionId } = useConnection();
  const { orbState, headerLabel, messages, input, setInput, send, isListening, transcript, startListening, stopListening } =
    useAssistantDemo();

  const statusText = useMemo(() => {
    if (connecting) return 'Linking';
    if (!connected) return 'Offline';
    if (!sessionId) return 'Preparing';
    return headerLabel;
  }, [connected, connecting, headerLabel, sessionId]);

  const getGifs = () => {
    switch (orbState) {
      case 'speaking':
        return require('../assets/gifs/speaking.gif');
      case 'thinking':
        return require('../assets/gifs/thinking.gif');
      default:
        return require('../assets/gifs/thinking.gif');
    }
  };
  return (
    <GradientBackdrop>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <View style={styles.header}>
          <Text style={styles.brand}>ZENO</Text>
          <GlassSurface variant="pill" style={styles.statusPill}>
            <View style={[styles.statusDot, connected ? styles.statusDotOn : styles.statusDotOff]} />
            <Text style={styles.statusText}>{statusText}</Text>
          </GlassSurface>
        </View>

        <View style={styles.orbWrap}>
          <Image
            source={getGifs()}
            style={styles.orb}
            resizeMode="contain"
          />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messagesContent}
          style={styles.messages}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />

        {isListening ? (
          <View style={styles.voicePreviewWrap}>
            <Text style={styles.voicePreviewLabel}>Listening</Text>
            <Text style={styles.voicePreviewText}>
              {transcript || 'Speak now...'}
            </Text>
          </View>
        ) : null}

        <View style={styles.composerWrap}>
          <GlassSurface variant="card" style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your command..."
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.input}
              editable={connected}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (!connected) return;
                send(input);
                setInput('');
              }}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (!connected) return;
                if (isListening) {
                  stopListening();
                  return;
                }
                startListening();
              }}
              style={({ pressed }) => [styles.voiceButton, pressed && { opacity: 0.9 }]}>
              <GlassSurface
                variant="button"
                style={[styles.voiceButtonInner, isListening && styles.voiceButtonInnerActive]}>
                <IconSymbol name="mic.fill" size={20} color="rgba(255,255,255,0.92)" />
              </GlassSurface>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (!connected) return;
                send(input);
                setInput('');
              }}
              style={({ pressed }) => [styles.sendButton, pressed && { opacity: 0.9 }]}>
              <GlassSurface variant="button" style={styles.sendButtonInner}>
                <IconSymbol name="paperplane.fill" size={20} color="rgba(255,255,255,0.92)" />
              </GlassSurface>
            </Pressable>
          </GlassSurface>
        </View>
      </KeyboardAvoidingView>
    </GradientBackdrop>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
  },
  orb: {
    width: 180,
    height: 180,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 18,
    letterSpacing: 2.6,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusDotOn: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  statusDotOff: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  statusText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  orbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  messages: {
    flex: 1,
    marginTop: 6,
  },
  messagesContent: {
    paddingBottom: 12,
    gap: 10,
  },
  messageRow: {
    width: '100%',
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: 'rgba(124,58,237,0.16)',
    borderColor: 'rgba(192,132,252,0.28)',
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  bubbleText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 20,
  },
  composerWrap: {
    paddingBottom: 14,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  voicePreviewWrap: {
    marginBottom: 12,
    paddingHorizontal: 6,
    gap: 4,
  },
  voicePreviewLabel: {
    color: 'rgba(192,132,252,0.88)',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  voicePreviewText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    flex: 1,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    paddingVertical: 10,
  },
  voiceButton: {
    width: 46,
    height: 46,
  },
  voiceButtonInner: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.14)',
    borderColor: 'rgba(96,165,250,0.3)',
  },
  voiceButtonInnerActive: {
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderColor: 'rgba(248,113,113,0.4)',
  },
  sendButton: {
    width: 46,
    height: 46,
  },
  sendButtonInner: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(192,132,252,0.10)',
    borderColor: 'rgba(192,132,252,0.28)',
  },
});
