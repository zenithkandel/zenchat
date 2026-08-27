/**
 * ZenChat State — Nearby Peers Store
 */

import { create } from 'zustand';
import type { DiscoveredPeer } from '../../ble/BleTransport';

interface NearbyState {
  peers: DiscoveredPeer[];
  lastScanAt: number | null;

  addOrUpdatePeer: (peer: DiscoveredPeer) => void;
  removePeer: (bleId: string) => void;
  clearPeers: () => void;
  setPeers: (peers: DiscoveredPeer[]) => void;
  setLastScanAt: (timestamp: number) => void;
}

export const useNearbyStore = create<NearbyState>((set, get) => ({
  peers: [],
  lastScanAt: null,

  addOrUpdatePeer: (peer) => {
    set((state) => {
      const existing = state.peers.findIndex(p => p.bleId === peer.bleId);
      if (existing >= 0) {
        const updated = [...state.peers];
        updated[existing] = peer;
        return { peers: updated };
      }
      return { peers: [...state.peers, peer] };
    });
  },

  removePeer: (bleId) => {
    set((state) => ({
      peers: state.peers.filter(p => p.bleId !== bleId),
    }));
  },

  clearPeers: () => set({ peers: [] }),

  setPeers: (peers) => set({ peers }),

  setLastScanAt: (timestamp) => set({ lastScanAt: timestamp }),
}));
