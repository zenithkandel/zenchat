/**
 * ZenChat — Navigation Setup
 *
 * Simple hierarchy:
 * - Onboarding (if first launch)
 * - Main tabs (Home, Nearby, Chats, More)
 * - Modal screens (Chat, ContactDetails, etc.)
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { useIdentityStore } from '../../state/stores/useIdentityStore';

// Screens
import { WelcomeScreen } from '../../screens/Onboarding/WelcomeScreen';
import { NameSetupScreen } from '../../screens/Onboarding/NameSetupScreen';
import { HomeScreen } from '../../screens/Home/HomeScreen';
import { NearbyScreen } from '../../screens/Nearby/NearbyScreen';
import { ChatsListScreen } from '../../screens/Chats/ChatsListScreen';
import { MoreScreen } from '../../screens/More/MoreScreen';
import { ChatScreen } from '../../screens/Chat/ChatScreen';
import { SettingsScreen } from '../../screens/Settings/SettingsScreen';
import { MyQRScreen } from '../../screens/MyQR/MyQRScreen';
import { DiagnosticsScreen } from '../../screens/Diagnostics/DiagnosticsScreen';
import { PacketLabScreen } from '../../screens/PacketLab/PacketLabScreen';
import { ScanQRScreen } from '../../screens/ScanQR/ScanQRScreen';
import { ContactDetailsScreen } from '../../screens/ContactDetails/ContactDetailsScreen';

// ─── Navigation Types ──────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  Chat: { peerUserId: string; peerDisplayName: string };
  ContactDetails: { userId: string };
  Settings: undefined;
  MyQR: undefined;
  ScanQR: undefined;
  Diagnostics: undefined;
  PacketLab: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  NameSetup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Nearby: undefined;
  ChatsList: undefined;
  More: undefined;
};

// ─── Stacks ────────────────────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// ─── Tab Icon (simple text-based until SVG icons are integrated) ────

function TabIcon({ label, focused, color }: { label: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    Home: '⌂',
    Nearby: '◎',
    Chats: '💬',
    More: '⋯',
  };

  return (
    <View style={tabStyles.iconContainer}>
      <Text style={[tabStyles.icon, { color, opacity: focused ? 1 : 0.6 }]}>
        {icons[label] ?? '○'}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  icon: {
    fontSize: 22,
  },
});

// ─── Onboarding Navigator ─────────────────────────────────────────

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="NameSetup" component={NameSetupScreen} />
    </OnboardingStack.Navigator>
  );
}

// ─── Main Tab Navigator ────────────────────────────────────────────

function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 8,
          height: 88,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Home" focused={focused} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Nearby"
        component={NearbyScreen}
        options={{
          tabBarLabel: 'Nearby',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Nearby" focused={focused} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="ChatsList"
        component={ChatsListScreen}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="Chats" focused={focused} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon label="More" focused={focused} color={color} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

// ─── Root Navigator ────────────────────────────────────────────────

export function RootNavigator() {
  const { hasCompletedOnboarding, isLoading } = useIdentityStore();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[rootStyles.loading, { backgroundColor: colors.background }]}>
        <Text style={[rootStyles.loadingText, { color: colors.textMuted }]}>
          Loading…
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {!hasCompletedOnboarding ? (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
            <RootStack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="MyQR"
              component={MyQRScreen}
              options={{
                presentation: 'modal',
              }}
            />
            <RootStack.Screen
              name="ScanQR"
              component={ScanQRScreen}
              options={{
                presentation: 'modal',
              }}
            />
            <RootStack.Screen
              name="ContactDetails"
              component={ContactDetailsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="Diagnostics"
              component={DiagnosticsScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
            <RootStack.Screen
              name="PacketLab"
              component={PacketLabScreen}
              options={{
                animation: 'slide_from_right',
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const rootStyles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});
