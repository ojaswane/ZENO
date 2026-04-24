import crypto from "node:crypto";

export type SessionId = string;

export type Session = {
  id: SessionId;
  hostSocketId: string;
  clientSocketId?: string;
  createdAtMs: number;
  lastActivityAtMs: number;
};

export type SessionStore = {
  create(hostSocketId: string): Session;
  get(id: SessionId): Session | undefined;
  joinClient(id: SessionId, clientSocketId: string): Session | undefined;
  touch(id: SessionId): void;
  delete(id: SessionId): void;
  deleteByHostSocket(hostSocketId: string): void;
  deleteByClientSocket(clientSocketId: string): void;
  pruneExpired(nowMs: number): number;
};

export type SessionStoreOptions = {
  ttlMs: number;
};

export function createSessionStore(options: SessionStoreOptions): SessionStore {
  const sessions = new Map<SessionId, Session>();

  function newSessionId(): SessionId {
    return crypto.randomBytes(9).toString("base64url");
  }

  return {
    create(hostSocketId) {
      const now = Date.now();
      const id = newSessionId();
      const session: Session = {
        id,
        hostSocketId,
        createdAtMs: now,
        lastActivityAtMs: now,
      };
      sessions.set(id, session);
      return session;
    },

    get(id) {
      return sessions.get(id);
    },

    joinClient(id, clientSocketId) {
      const existing = sessions.get(id);
      if (!existing) return undefined;
      const now = Date.now();
      const updated: Session = { ...existing, clientSocketId, lastActivityAtMs: now };
      sessions.set(id, updated);
      return updated;
    },

    touch(id) {
      const existing = sessions.get(id);
      if (!existing) return;
      sessions.set(id, { ...existing, lastActivityAtMs: Date.now() });
    },

    delete(id) {
      sessions.delete(id);
    },

    deleteByHostSocket(hostSocketId) {
      for (const [id, session] of sessions) {
        if (session.hostSocketId === hostSocketId) sessions.delete(id);
      }
    },

    deleteByClientSocket(clientSocketId) {
      for (const [id, session] of sessions) {
        if (session.clientSocketId === clientSocketId) sessions.delete(id);
      }
    },

    pruneExpired(nowMs) {
      let deleted = 0;
      for (const [id, session] of sessions) {
        if (nowMs - session.lastActivityAtMs > options.ttlMs) {
          sessions.delete(id);
          deleted++;
        }
      }
      return deleted;
    },
  };
}

