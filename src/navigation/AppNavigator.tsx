import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TextTranslateScreen } from '../screens/TextTranslateScreen';
import { AudioTranslateScreen } from '../screens/AudioTranslateScreen';
import { VideoTranslateScreen } from '../screens/VideoTranslateScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

interface Props {
  initialRouteName?: 'Text' | 'Audio' | 'Video' | 'Settings';
}

export function AppNavigator({ initialRouteName = 'Text' }: Props) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerTitleAlign: 'center' }}>
        <Tab.Screen
          name="Text"
          component={TextTranslateScreen}
          options={{ title: 'Text' }}
        />
        <Tab.Screen
          name="Audio"
          component={AudioTranslateScreen}
          options={{ title: 'Audio' }}
        />
        <Tab.Screen
          name="Video"
          component={VideoTranslateScreen}
          options={{ title: 'Video' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Models' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
