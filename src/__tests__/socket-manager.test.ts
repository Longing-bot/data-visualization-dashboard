// Create a callable mock for moment that works with `import * as moment`
jest.mock('moment', () => {
  class MomentMock extends Function {
    constructor() {
      super();
      return new Proxy(this, {
        apply(target, thisArg, args) {
          return {
            toISOString: () => '2026-01-01T00:00:00.000Z',
            isValid: () => true,
            format: (f: string) => '2026-01-01'
          };
        }
      });
    }
  }
  const instance = new (MomentMock as any)();
  instance.ISO_8601 = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
  instance.__esModule = true;
  return instance;
});

// Mock socket.io
jest.mock('socket.io', () => ({
  Server: jest.fn()
}));

import { SocketManager } from '../socket-manager';

describe('SocketManager', () => {
  describe('getActiveConnections', () => {
    it('should return 0 when no connections', () => {
      expect(SocketManager.getActiveConnections()).toBe(0);
    });
  });

  describe('getConnectionInfo', () => {
    it('should return connection info object', () => {
      const info = SocketManager.getConnectionInfo();
      expect(info).toHaveProperty('activeConnections');
      expect(info).toHaveProperty('realtimeActive');
      expect(info).toHaveProperty('lastUpdate');
      expect(info).toHaveProperty('dataPoints');
      expect(typeof info.activeConnections).toBe('number');
      expect(typeof info.realtimeActive).toBe('boolean');
    });
  });

  describe('stopRealtimeUpdates', () => {
    it('should not throw when no updates running', () => {
      expect(() => SocketManager.stopRealtimeUpdates()).not.toThrow();
    });
  });
});
