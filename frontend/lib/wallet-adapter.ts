/**
 * Issue #446 — Wallet connection abstraction layer.
 */

export interface WalletProvider {
  id: string;
  name: string;
  icon?: string;
  isAvailable: () => Promise<boolean>;
  connect: () => Promise<WalletConnection>;
}

export interface WalletConnection {
  address: string;
  network: string;
  networkPassphrase: string;
  signerAddress?: string;
}

export interface WalletAdapter {
  signTransaction: (xdr: string, opts?: { networkPassphrase?: string }) => Promise<string>;
}

type WalletListener = (connection: WalletConnection | null) => void;

class WalletManager {
  private providers: WalletProvider[] = [];
  private connection: WalletConnection | null = null;
  private adapter: WalletAdapter | null = null;
  private listeners = new Set<WalletListener>();

  registerProvider(provider: WalletProvider): void {
    this.providers.push(provider);
  }

  getProviders(): WalletProvider[] {
    return [...this.providers];
  }

  getConnection(): WalletConnection | null {
    return this.connection;
  }

  getAdapter(): WalletAdapter | null {
    return this.adapter;
  }

  subscribe(listener: WalletListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.connection);
    }
  }

  async connect(providerId: string): Promise<WalletConnection> {
    const provider = this.providers.find((p) => p.id === providerId);
    if (!provider) throw new Error(`Unknown wallet provider: ${providerId}`);

    const conn = await provider.connect();
    this.connection = conn;

    this.adapter = {
      signTransaction: async (xdr: string, opts?: { networkPassphrase?: string }) => {
        const freighter = (window as any).freighter;
        if (freighter?.signTransaction) {
          const result = await freighter.signTransaction(xdr, {
            networkPassphrase: opts?.networkPassphrase ?? conn.networkPassphrase,
          });
          return result.signedTxXDR;
        }
        throw new Error('No signing provider available');
      },
    };

    this.notify();
    return conn;
  }

  disconnect(): void {
    this.connection = null;
    this.adapter = null;
    this.notify();
  }
}

export const walletManager = new WalletManager();

export const freighterProvider: WalletProvider = {
  id: 'freighter',
  name: 'Freighter',
  isAvailable: async () => {
    return typeof window !== 'undefined' && !!(window as any).freighter;
  },
  connect: async () => {
    const freighter = (window as any).freighter;
    if (!freighter) throw new Error('Freighter extension not found');

    const [address, network] = await Promise.all([
      freighter.getAddress(),
      freighter.getNetwork(),
    ]);

    return {
      address,
      network: network.network,
      networkPassphrase: network.networkPassphrase,
    };
  },
};

walletManager.registerProvider(freighterProvider);
