// This is the main screen
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
import { SplineOrb } from '@/components/zeno_Style/spline-orb';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { ChatMessage } from '@/hooks/use-assistant-demo';
import { useAssistantDemo } from '@/hooks/use-assistant-demo';
import { useConnection } from '@/hooks/use-connection';

const ORB_THINKING_URL = 'https://my.spline.design/untitled-d7FjJOgZDDZFyfrGxouNIIV4/';
const ORB_SPEAKING_URL = 'https://my.spline.design/untitled-d7FjJOgZDDZFyfrGxouNIIV4/';

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
  const { connected } = useConnection();
  const { orbState, headerLabel, messages, input, setInput, send } = useAssistantDemo();

  const statusText = useMemo(() => {
    if (!connected) return 'Offline';
    return headerLabel;
  }, [connected, headerLabel]);

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
          <SplineOrb
            state={connected ? orbState : 'idle'}
            thinkingUrl={ORB_THINKING_URL}
            speakingUrl={ORB_SPEAKING_URL}
            size={270}
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

        <View style={styles.composerWrap}>
          <GlassSurface variant="card" style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type your message…"
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
  input: {
    flex: 1,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    paddingVertical: 10,
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
