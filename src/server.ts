#!/usr/bin/env node

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import chalk from 'chalk';

// Import visualization modules
import { ChartEngine } from './chart-engine';
import { DataProcessor } from './data-processor';
import { SocketManager } from './socket-manager';

class DashboardServer {
  private app: express.Application;
  private server: http.Server;
  private io: Server;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocketHandlers();
    this.startServer();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors());

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    console.log(chalk.green('🛡️ Security middleware initialized'));
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Chart endpoints
    this.app.post('/api/charts/bar', async (req, res) => {
      try {
        const chartData = await ChartEngine.createBarChart(req.body);
        res.json({ success: true, data: chartData });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/charts/line', async (req, res) => {
      try {
        const chartData = await ChartEngine.createLineChart(req.body);
        res.json({ success: true, data: chartData });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/charts/pie', async (req, res) => {
      try {
        const chartData = await ChartEngine.createPieChart(req.body);
        res.json({ success: true, data: chartData });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Data processing endpoints
    this.app.post('/api/process/csv', async (req, res) => {
      try {
        const processedData = await DataProcessor.processCSV(req.body.data);
        res.json({ success: true, data: processedData });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/process/json', async (req, res) => {
      try {
        const processedData = await DataProcessor.processJSON(req.body.data);
        res.json({ success: true, data: processedData });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Real-time data endpoint
    this.app.post('/api/realtime/start', (req, res) => {
      const { interval, dataSource } = req.body;
      SocketManager.startRealtimeUpdates(interval, dataSource);
      res.json({ success: true, message: 'Real-time updates started' });
    });

    this.app.post('/api/realtime/stop', (req, res) => {
      SocketManager.stopRealtimeUpdates();
      res.json({ success: true, message: 'Real-time updates stopped' });
    });

    // Static files for dashboard UI
    this.app.use(express.static('public'));

    console.log(chalk.green('🚀 Routes initialized'));
  }

  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(chalk.blue(`🔗 Client connected: ${socket.id}`));

      socket.on('request-chart', async (data) => {
        try {
          const chartData = await ChartEngine.generateChart(data.type, data.config);
          socket.emit('chart-response', { success: true, data: chartData });
        } catch (error) {
          socket.emit('chart-response', { success: false, error: error.message });
        }
      });

      socket.on('request-data', async (data) => {
        try {
          const processedData = await DataProcessor.processRequest(data);
          socket.emit('data-response', { success: true, data: processedData });
        } catch (error) {
          socket.emit('data-response', { success: false, error: error.message });
        }
      });

      socket.on('disconnect', () => {
        console.log(chalk.yellow(`🔌 Client disconnected: ${socket.id}`));
      });
    });

    console.log(chalk.green('📡 Socket handlers initialized'));
  }

  private startServer(): void {
    this.server.listen(this.port, () => {
      console.log(chalk.cyan(`
╭─────────────────────────────────────╮
│   Data Visualization Dashboard v1.0 │
│     Interactive Charts & Analytics    │
╰─────────────────────────────────────╯
🌐 Server running on http://localhost:${this.port}
📊 WebSocket ready for real-time updates
🎯 Dashboard accessible at /dashboard
`));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log(chalk.red('\n🛑 Received SIGTERM, shutting down gracefully...'));
      this.shutdown();
    });

    process.on('SIGINT', () => {
      console.log(chalk.red('\n🛑 Received SIGINT, shutting down gracefully...'));
      this.shutdown();
    });
  }

  private async shutdown(): Promise<void> {
    console.log(chalk.yellow('🔄 Closing server...'));
    
    // Close server
    this.server.close(() => {
      console.log(chalk.green('✅ Server closed'));
    });

    // Force shutdown after 5 seconds
    setTimeout(() => {
      console.log(chalk.red('💥 Forcing shutdown...'));
      process.exit(0);
    }, 5000);
  }
}

// Start the dashboard server
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
new DashboardServer(port);