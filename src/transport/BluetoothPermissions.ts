import { Platform, PermissionsAndroid, Linking } from 'react-native';

export type BluetoothDiagnostic = {
  isGranted: boolean;
  scanGranted: boolean;
  advertiseGranted: boolean;
  connectGranted: boolean;
  locationGranted: boolean;
  errorMessage: string | null;
};

export const BluetoothPermissions = {
  async checkPermissions(): Promise<BluetoothDiagnostic> {
    if (Platform.OS === 'ios') {
      return {
        isGranted: true,
        scanGranted: true,
        advertiseGranted: true,
        connectGranted: true,
        locationGranted: true,
        errorMessage: null,
      };
    }

    if (Platform.OS !== 'android') {
      return {
        isGranted: true,
        scanGranted: true,
        advertiseGranted: true,
        connectGranted: true,
        locationGranted: true,
        errorMessage: null,
      };
    }

    const apiLevel = Platform.Version as number;

    try {
      // Android 12+ (API 31+) requires BLUETOOTH_SCAN, BLUETOOTH_CONNECT, BLUETOOTH_ADVERTISE
      if (apiLevel >= 31) {
        const scan = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
        );
        const connect = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        const advertise = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE
        );
        const location = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        const allGranted = scan && connect && advertise;

        let errorMsg: string | null = null;
        if (!allGranted) {
          const missing: string[] = [];
          if (!scan) missing.push('Nearby Devices (Scan)');
          if (!connect) missing.push('Bluetooth Connect');
          if (!advertise) missing.push('Bluetooth Advertise');
          errorMsg = `Missing permissions: ${missing.join(', ')}`;
        }

        return {
          isGranted: allGranted,
          scanGranted: scan,
          advertiseGranted: advertise,
          connectGranted: connect,
          locationGranted: location,
          errorMessage: errorMsg,
        };
      } else {
        // Android 6 - 11 requires ACCESS_FINE_LOCATION for Bluetooth LE discovery
        const location = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        return {
          isGranted: location,
          scanGranted: true,
          advertiseGranted: true,
          connectGranted: true,
          locationGranted: location,
          errorMessage: location
            ? null
            : 'Location permission is required for Bluetooth discovery on Android 11 and below.',
        };
      }
    } catch (err: any) {
      return {
        isGranted: false,
        scanGranted: false,
        advertiseGranted: false,
        connectGranted: false,
        locationGranted: false,
        errorMessage: err?.message || 'Could not verify Bluetooth permissions.',
      };
    }
  },

  async requestPermissions(): Promise<BluetoothDiagnostic> {
    if (Platform.OS !== 'android') {
      return {
        isGranted: true,
        scanGranted: true,
        advertiseGranted: true,
        connectGranted: true,
        locationGranted: true,
        errorMessage: null,
      };
    }

    const apiLevel = Platform.Version as number;

    try {
      if (apiLevel >= 31) {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        const scan =
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED;
        const connect =
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED;
        const advertise =
          results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE] ===
          PermissionsAndroid.RESULTS.GRANTED;
        const location =
          results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          PermissionsAndroid.RESULTS.GRANTED;

        const isGranted = scan && connect && advertise;

        let errorMsg: string | null = null;
        if (!isGranted) {
          errorMsg =
            'Permission denied. Please allow "Nearby devices" in App Settings to enable Bluetooth discovery.';
        }

        return {
          isGranted,
          scanGranted: scan,
          advertiseGranted: advertise,
          connectGranted: connect,
          locationGranted: location,
          errorMessage: errorMsg,
        };
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'ZenChat Location & Bluetooth',
            message:
              'ZenChat requires location access to discover nearby devices using Bluetooth Low Energy.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );

        const isGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        return {
          isGranted,
          scanGranted: true,
          advertiseGranted: true,
          connectGranted: true,
          locationGranted: isGranted,
          errorMessage: isGranted
            ? null
            : 'Location permission was denied. Bluetooth discovery cannot run without it.',
        };
      }
    } catch (err: any) {
      return {
        isGranted: false,
        scanGranted: false,
        advertiseGranted: false,
        connectGranted: false,
        locationGranted: false,
        errorMessage: err?.message || 'Error requesting Bluetooth permissions.',
      };
    }
  },

  openSettings() {
    Linking.openSettings().catch(() => {});
  },
};
