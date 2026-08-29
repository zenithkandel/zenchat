import { MockTransport } from '../src/transport/MockTransport';
import { Peer } from '../src/transport/MessageTransport';
import { MessagePacket } from '../src/protocol/MessagePacket';

describe('MockTransport', () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = new MockTransport();
  });

  afterEach(async () => {
    await transport.stop();
  });

  it('initializes and discovers mock peers without including self', async () => {
    await transport.start({ displayName: 'Alex', userId: 'A7F29C' });

    let latestPeers: Peer[] = [];
    const unsubscribe = transport.onPeersChanged((peers) => {
      latestPeers = peers;
    });

    const peers = await transport.discoverPeers();
    expect(peers.length).toBeGreaterThan(0);
    // Should exclude Alex (A7F29C) since it is our own userId
    expect(peers.some((p) => p.userId === 'A7F29C')).toBe(false);
    expect(peers.some((p) => p.displayName === 'Jordan')).toBe(true);

    unsubscribe();
  });

  it('updates connection state when connecting to a peer', async () => {
    await transport.start({ displayName: 'Alex', userId: 'A7F29C' });
    const peers = await transport.discoverPeers();
    const targetPeer = peers[0];

    let currentPeers: Peer[] = [];
    transport.onPeersChanged((p) => {
      currentPeers = p;
    });

    await transport.connect(targetPeer.userId);
    const updated = currentPeers.find((p) => p.userId === targetPeer.userId);
    expect(updated?.state).toBe('connected');
  });

  it('sends message and allows simulating incoming message callbacks', async () => {
    await transport.start({ displayName: 'Alex', userId: 'A7F29C' });
    const peers = await transport.discoverPeers();

    let receivedPacket: MessagePacket | null = null;
    transport.onMessage((packet) => {
      receivedPacket = packet;
    });

    transport.simulateIncomingMessage('Sam', 'Hey Alex!');
    expect(receivedPacket).not.toBeNull();
    expect((receivedPacket as any)?.senderName).toBe('Sam');
    expect((receivedPacket as any)?.text).toBe('Hey Alex!');
  });
});
