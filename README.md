# 📊 Data Visualization Dashboard

Interactive data visualization dashboard with real-time charts, analytics, and WebSocket-powered live updates. Built with Express, D3.js, Chart.js, and Socket.IO for enterprise-grade performance and scalability.

## ✨ Features

### **Core Capabilities**
- 🎨 **Multiple Chart Types**: Bar, Line, Pie, Scatter plots with D3.js
- 🌊 **Real-Time Updates**: WebSocket-powered live data streaming
- 📈 **Data Processing**: CSV/JSON parsing, aggregation, filtering, sorting
- 🔄 **Interactive Charts**: Mouse events, hover effects, dynamic updates
- 📱 **Responsive Design**: Mobile-friendly dashboard interface
- 🛡️ **Security**: Helmet middleware, CORS, rate limiting protection

### **Advanced Features**
- 🚀 **High Performance**: Optimized D3 rendering and data processing
- 💾 **Memory Efficient**: Stream processing for large datasets
- 🔌 **WebSocket Support**: Real-time bidirectional communication
- 📊 **Statistical Analysis**: Automated data type detection and statistics
- 🎯 **Customizable**: Configurable colors, themes, and layouts
- 🧪 **Test Coverage**: Comprehensive Jest test suite with 90%+ coverage

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev

# Production start
npm start

# Run tests
npm test

# Check types
npm run typecheck
```

## 📋 API Endpoints

### **Health Check**
```bash
GET /health
```
Returns server status and uptime information.

### **Chart Generation**
```bash
POST /api/charts/bar
Content-Type: application/json

{
  "data": [10, 25, 15, 30, 20],
  "labels": ["A", "B", "C", "D", "E"],
  "title": "Sample Bar Chart"
}
```

```bash
POST /api/charts/line
Content-Type: application/json

{
  "data": [5, 12, 8, 18, 14],
  "labels": ["Jan", "Feb", "Mar", "Apr", "May"],
  "title": "Trend Line"
}
```

```bash
POST /api/charts/pie
Content-Type: application/json

{
  "data": [30, 25, 20, 15, 10],
  "labels": ["Category A", "B", "C", "D", "E"],
  "title": "Distribution Chart"
}
```

### **Data Processing**
```bash
POST /api/process/csv
Content-Type: application/json

{
  "data": "name,age,salary\nJohn,30,50000\nJane,25,45000\nBob,35,60000"
}
```

```bash
POST /api/process/json
Content-Type: application/json

[
  {"name": "Alice", "score": 85, "category": "A"},
  {"name": "Bob", "score": 92, "category": "B"}
]
```

### **Real-Time Operations**
```bash
POST /api/realtime/start
Content-Type: application/json

{
  "interval": 2000,
  "dataSource": "metrics"
}

POST /api/realtime/stop
```

## 🔧 Configuration

The dashboard runs on port 3000 by default. You can customize this:

```bash
PORT=8080 npm start
```

## 📁 Project Structure

```
data-visualization-dashboard/
├── src/
│   ├── server.ts              # Express server & routes
│   ├── chart-engine.ts        # D3.js chart generation
│   ├── data-processor.ts      # CSV/JSON processing & analysis
│   └── socket-manager.ts      # WebSocket real-time updates
├── public/                   # Static files (dashboard UI)
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── jest.config.js           # Jest test configuration
└── README.md                # This file
```

## 🎨 Chart Examples

### **Bar Chart**
```javascript
const config = {
  type: 'bar',
  data: [10, 25, 15, 30, 20],
  labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
  title: 'Quarterly Sales',
  colors: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6']
};
```

### **Line Chart**
```javascript
const config = {
  type: 'line',
  data: [5, 12, 8, 18, 14],
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  title: 'Monthly Performance'
};
```

### **Pie Chart**
```javascript
const config = {
  type: 'pie',
  data: [30, 25, 20, 15, 10],
  labels: ['Product A', 'B', 'C', 'D', 'E'],
  title: 'Market Share'
};
```

## 🌊 Real-Time Features

### **WebSocket Events**

**Client Connection:**
```javascript
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
});
```

**Receiving Updates:**
```javascript
socket.on('realtime-update', (data) => {
  console.log('Received update:', data);
});
```

**Sending Requests:**
```javascript
socket.emit('request-chart', {
  type: 'bar',
  config: { /* chart config */ }
});
```

### **Supported Data Sources**
- `metrics`: CPU, memory, disk usage
- `analytics`: User actions and behavior
- `sensor`: IoT sensor data
- `generic`: Custom data sets

## 📊 Data Processing

### **CSV Processing**
```bash
curl -X POST http://localhost:3000/api/process/csv \
  -H "Content-Type: application/json" \
  -d '{"data":"name,age,city\nJohn,30,NYC\nJane,25,LA"}'
```

### **JSON Processing**
```bash
curl -X POST http://localhost:3000/api/process/json \
  -H "Content-Type: application/json" \
  -d '[{"name":"Alice","score":85},{"name":"Bob","score":92}]'
```

### **Data Analysis Output**
```json
{
  "summary": {
    "totalRows": 2,
    "totalColumns": 3,
    "numericColumns": ["age"],
    "categoricalColumns": ["name", "city"],
    "dateColumns": []
  },
  "statistics": {
    "age": {
      "mean": 27.5,
      "median": 27.5,
      "min": 25,
      "max": 30,
      "sum": 55,
      "count": 2,
      "stdDev": 3.5355339059327378
    }
  },
  "transformed": [...]
}
```

## 🛠️ Development

### **TypeScript Support**
Full TypeScript implementation with strict mode enabled:
- Interface definitions for all data structures
- Type safety throughout the codebase
- Null safety and error handling

### **Testing**
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode for development
npm run test:coverage     # Generate coverage report
```

### **Code Quality**
- ESLint with TypeScript support
- Prettier formatting
- Jest testing framework
- Coverage requirements (90%+)

## 🚀 Production Deployment

### **Environment Variables**
```bash
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
MAX_CONNECTIONS=1000
```

### **Docker Example**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ dist/
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## 📈 Performance Features

- **Connection Pooling**: Efficient WebSocket connection management
- **Data Compression**: Gzip compression for large payloads
- **Memory Optimization**: Stream processing for big datasets
- **Load Balancing**: Ready for horizontal scaling
- **Caching**: Response caching for repeated requests

## 🔒 Security Considerations

- **Helmet**: HTTP header security middleware
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against abuse
- **Input Validation**: All user inputs validated
- **Error Sanitization**: No sensitive data in error messages

## 🚀 Future Enhancements

- **Additional Chart Types**: Heatmaps, scatter plots, radar charts
- **Export Functionality**: PNG/SVG/PDF export options
- **Dashboard Builder**: Drag-and-drop interface creation
- **Plugin System**: Extensible architecture for custom visualizations
- **Machine Learning**: Predictive analytics integration

## 🤝 Contributing

This is a foundational project demonstrating modern Node.js development practices. Contributions welcome!

## 📄 License

MIT License - see LICENSE file for details.