import React, { PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

type ConnectionContextValue = {
  connected: boolean;
  setConnected: (connected: boolean) => void;
  connect: () => void;
  disconnect: () => void;
};

const ConnectionContext = React.createContext<ConnectionContextValue | null>(null);

export function ConnectionProvider({ children }: PropsWithChildren) {
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => setConnected(true), []);
  const disconnect = useCallback(() => setConnected(false), []);

  const value = useMemo(
    () => ({
      connected,
      setConnected,
      connect,
      disconnect,
    }),
    [connected, connect, disconnect]
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const value = useContext(ConnectionContext);
  if (!value) {
    throw new Error('useConnection must be used within ConnectionProvider');
  }
  return value;
}

