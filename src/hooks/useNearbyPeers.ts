import { useTransport } from '../transport/TransportContext';

export function useNearbyPeers() {
  const { peers, status, isMock, refreshPeers } = useTransport();

  return {
    peers,
    status,
    isMock,
    isSearching: status === 'searching',
    isBluetoothOff: status === 'bluetooth_off',
    refreshPeers,
  };
}
