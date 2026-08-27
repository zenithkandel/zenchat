/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

try {
  const { registerRootComponent } = require('expo');
  registerRootComponent(App);
} catch {
  AppRegistry.registerComponent(appName, () => App);
}
