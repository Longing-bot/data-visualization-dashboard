import { Server, Socket } from 'socket.io';
import * as moment from 'moment';

export interface RealtimeConfig {
  interval: number;
  dataSource: string;
  data: any[];
}

export class SocketManager {
  private static io: Server;
  private static activeSockets: Set<string> = new Set();
  private static realtimeInterval: NodeJS.Timeout | null = null;
  private static currentData: any[] = [];

  static initialize(io: Server): void {
    this.io = io;

    this.io.on('connection', (socket: Socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);
      this.activeSockets.add(socket.id);

      // Send initial data to new client
      if (this.currentData.length > 0) {
        socket.emit('realtime-update', {
          type: 'initial-data',
          data: this.currentData,
          timestamp: moment().toISOString()
        });
      }

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.activeSockets.delete(socket.id);
      });

      socket.on('request-live-data', (config: any) => {
        this.startClientRealtime(socket, config);
      });

      socket.on('stop-live-data', () => {
        this.stopClientRealtime(socket);
      });
    });

    console.log('📡 Socket manager initialized with', this.activeSockets.size, 'active connections');
  }

  static startRealtimeUpdates(interval: number, dataSource: string): void {
    if (this.realtimeInterval) {
      console.warn('⚠️ Real-time updates already running');
      return;
    }

    console.log(`🌊 Starting real-time updates every ${interval}ms from ${dataSource}`);

    this.realtimeInterval = setInterval(() => {
      const newData = this.generateMockData(dataSource);
      this.updateAllClients(newData);
    }, interval);

    // Initial update
    const initialData = this.generateMockData(dataSource);
    this.updateAllClients(initialData);
  }

  static stopRealtimeUpdates(): void {
    if (this.realtimeInterval) {
      clearInterval(this.realtimeInterval);
      this.realtimeInterval = null;
      console.log('🛑 Real-time updates stopped');
    }
  }

  private static generateMockData(sourceType: string): any[] {
    switch (sourceType) {
      case 'metrics':
        return this.generateMetricsData();
      case 'analytics':
        return this.generateAnalyticsData();
      case 'sensor':
        return this.generateSensorData();
      default:
        return this.generateGenericData();
    }
  }

  private static generateMetricsData(): any[] {
    return [
      {
        id: Date.now(),
        timestamp: moment().toISOString(),
        metric: 'cpu_usage',
        value: Math.random() * 100,
        unit: '%'
      },
      {
        id: Date.now() + 1,
        timestamp: moment().toISOString(),
        metric: 'memory_usage',
        value: Math.random() * 80 + 20,
        unit: 'MB'
      },
      {
        id: Date.now() + 2,
        timestamp: moment().toISOString(),
        metric: 'disk_io',
        value: Math.floor(Math.random() * 500),
        unit: 'ops'
      }
    ];
  }

  private static generateAnalyticsData(): any[] {
    const users = ['user_001', 'user_002', 'user_003', 'user_004', 'user_005'];
    return users.map(user => ({
      id: Date.now() + Math.random(),
      user_id: user,
      action: ['login', 'purchase', 'view', 'search'][Math.floor(Math.random() * 4)],
      session_duration: Math.floor(Math.random() * 3600),
      revenue: Math.random() * 1000
    }));
  }

  private static generateSensorData(): any[] {
    return [
      {
        sensor_id: 'temp_001',
        location: 'room_1',
        temperature: Math.random() * 30 + 18,
        humidity: Math.random() * 60 + 40,
        timestamp: moment().toISOString()
      },
      {
        sensor_id: 'pressure_001',
        location: 'outdoor',
        pressure: Math.random() * 50 + 950,
        wind_speed: Math.random() * 20,
        timestamp: moment().toISOString()
      }
    ];
  }

  private static generateGenericData(): any[] {
    return Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      name: `Item ${i + 1}`,
      value: Math.random() * 100,
      category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
    }));
  }

  private static updateAllClients(data: any[]): void {
    this.currentData = data;

    const updateEvent = {
      type: 'realtime-update',
      data: data,
      timestamp: moment().toISOString(),
      count: this.activeSockets.size
    };

    this.io.to(Array.from(this.activeSockets)).emit('realtime-update', updateEvent);

    console.log(`📤 Sent ${data.length} data points to ${this.activeSockets.size} clients`);
  }

  private static startClientRealtime(socket: Socket, config: any): void {
    const interval = setInterval(() => {
      if (!this.activeSockets.has(socket.id)) {
        clearInterval(interval);
        return;
      }

      const data = this.generateMockData(config.source || 'generic');
      socket.emit('client-realtime', {
        type: 'client-update',
        data: data,
        timestamp: moment().toISOString()
      });
    }, config.interval || 2000);

    socket.data.realtimeInterval = interval;
    console.log(`🔄 Started client real-time updates for ${socket.id}`);
  }

  private static stopClientRealtime(socket: Socket): void {
    if (socket.data.realtimeInterval) {
      clearInterval(socket.data.realtimeInterval);
      delete socket.data.realtimeInterval;
      console.log(`🛑 Stopped client real-time updates for ${socket.id}`);
    }
  }

  static getActiveConnections(): number {
    return this.activeSockets.size;
  }

  static broadcastMessage(type: string, payload: any): void {
    this.io.emit(type, {
      ...payload,
      timestamp: moment().toISOString(),
      recipients: this.activeSockets.size
    });
  }

  static getConnectionInfo(): any {
    return {
      activeConnections: this.activeSockets.size,
      realtimeActive: this.realtimeInterval !== null,
      lastUpdate: moment().toISOString(),
      dataPoints: this.currentData.length
    };
  }
}