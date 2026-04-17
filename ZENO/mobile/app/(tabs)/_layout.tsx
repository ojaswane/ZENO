// This file is basically for the tabs to change the page
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C084FC',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'rgba(5,2,21,0.92)',
          borderTopColor: 'rgba(255,255,255,0.10)',
        },
      }}>

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Connect',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="qrcode.viewfinder" color={color} />,
        }}
        
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="sparkles" color={color} />,
        }}

      />
    </Tabs>
  );
}
