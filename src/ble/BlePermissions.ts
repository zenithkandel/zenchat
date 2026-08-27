/**
 * ZenChat BLE — Platform Permissions Handler
 *
 * Handles runtime permission requests for Android 12+ (API 31+)
 * and legacy Android, with graceful iOS fallback.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import { logger } from '../utils/logger';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  details: {
    bluetoothScan: boolean;
    bluetoothAdvertise: boolean;
    bluetoothConnect: boolean;
    location: boolean;
    camera: boolean;
  };
}

/**
 * Request all required Bluetooth runtime permissions.
 */
export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // iOS requests Bluetooth permission automatically on first CoreBluetooth usage.
    logger.info('BLE', 'iOS handles Bluetooth authorization via CoreBluetooth.');
    return true;
  }

  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const apiLevel = Platform.Version;
    logger.info('BLE', `Requesting Android BLE permissions (API ${apiLevel})...`);

    if (apiLevel >= 31) {
      // Android 12+ (API 31+) uses fine-grained Bluetooth permissions
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);

      const scanGranted = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED;
      const advGranted = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE] === PermissionsAndroid.RESULTS.GRANTED;
      const connGranted = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;

      const allGranted = scanGranted && advGranted && connGranted;
      logger.info('BLE', `Android 12+ permissions result: ${allGranted ? 'GRANTED' : 'DENIED'}`, results);
      return allGranted;
    } else {
      // Android 6-11 (API 23-30) requires location permission for BLE scanning
      const locationResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission for Nearby Bluetooth',
          message: 'ZenChat requires location permission to scan for nearby Bluetooth devices.',
          buttonPositive: 'Grant Permission',
          buttonNegative: 'Cancel',
        },
      );

      const granted = locationResult === PermissionsAndroid.RESULTS.GRANTED;
      logger.info('BLE', `Legacy Android BLE location permission: ${granted ? 'GRANTED' : 'DENIED'}`);
      return granted;
    }
  } catch (error) {
    logger.error('BLE', 'Error requesting Bluetooth permissions', error);
    return false;
  }
}

/**
 * Check if Bluetooth permissions are already granted.
 */
export async function checkBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true;
  }

  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const apiLevel = Platform.Version;

    if (apiLevel >= 31) {
      const scan = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
      const adv = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE);
      const conn = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
      return scan && adv && conn;
    } else {
      return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
  } catch (error) {
    logger.error('BLE', 'Error checking Bluetooth permissions', error);
    return false;
  }
}

/**
 * Request camera permission for scanning identity QR codes.
 */
export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true;
  }

  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission for QR Scan',
        message: 'ZenChat uses the camera to scan contact identity QR codes.',
        buttonPositive: 'Grant',
        buttonNegative: 'Cancel',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    logger.error('QR', 'Error requesting camera permission', error);
    return false;
  }
}
