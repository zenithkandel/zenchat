/**
 * ZenChat State — BLE Store
 */

import { create } from 'zustand';
import type { BluetoothState } from '../../ble/BleTransport';

interface BleState {
  bluetoothState: BluetoothState;
  isAdvertising: boolean;
  isScanning: boolean;
  permissionGranted: boolean;

  setBluetoothState: (state: BluetoothState) => void;
  setAdvertising: (active: boolean) => void;
  setScanning: (active: boolean) => void;
  setPermissionGranted: (granted: boolean) => void;
}

export const useBleStore = create<BleState>((set) => ({
  bluetoothState: 'unknown',
  isAdvertising: false,
  isScanning: false,
  permissionGranted: false,

  setBluetoothState: (state) => set({ bluetoothState: state }),
  setAdvertising: (active) => set({ isAdvertising: active }),
  setScanning: (active) => set({ isScanning: active }),
  setPermissionGranted: (granted) => set({ permissionGranted: granted }),
}));
