import React, { PropsWithChildren } from 'react';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

type Variant = 'card' | 'pill' | 'button';

export type GlassSurfaceProps = PropsWithChildren<
  ViewProps & {
    variant?: Variant;
  }
>;

export function GlassSurface({ variant = 'card', style, children, ...rest }: GlassSurfaceProps) {
  return (
    <View style={[styles.base, stylesByVariant[variant], style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(0, 0, 0 , 0,5)',
    borderWidth: 2,
    overflow: 'hidden',
    ...(Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 8,
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
      },
    }) as object),
  },
});

const stylesByVariant = StyleSheet.create({
  card: {
    borderRadius: 24,
  },
  pill: {
    borderRadius: 999,
  },
  button: {
    borderRadius: 999,
  },
});

