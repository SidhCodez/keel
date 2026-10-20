import React from 'react';
import { Tabs } from 'expo-router';
import { Sun, Flame, Briefcase, BookOpen, BarChart2 } from 'lucide-react-native';
import { colors } from '@/styles/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgPrimary,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Sun color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, size }) => <Flame color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="work"
        options={{
          title: 'Work',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide index redirect from tab bar
        }}
      />
    </Tabs>
  );
}
