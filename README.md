# NVIDIA GPU & CPU Monitoring System

A real-time monitoring dashboard for NVIDIA GPUs and system resources (CPU, memory) with D3.js visualizations.

## Features

- Real-time monitoring of CPU, GPU, and memory utilization
- Interactive D3.js visualizations for system resources
- Web-based dashboard with responsive design
- Support for multiple GPUs
- Auto-refresh and manual refresh options
- Status indicators for resource usage levels
- Detailed GPU information including power consumption, memory usage, and temperature

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- NVIDIA GPU with CUDA support (for GPU monitoring)

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ai-system-monitor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode
To run the application in development mode with auto-restart on code changes:
```bash
npm run dev
```

### Production Mode
To run the application in production mode:
```bash
npm start
```

### Debug Mode
To run with verbose logging enabled:
```bash
npm run debug
```

## Usage

1. Start the server using one of the above commands
2. Open your web browser and navigate to `http://localhost:3000`
3. The dashboard will automatically fetch and display system monitoring data
4. Use the "Refresh Data" button to manually update the data
5. Toggle auto-refresh on/off using the "Auto-Refresh" button

## Project Structure

```
gpu-monitor/
├── package.json          # Application dependencies and scripts
├── server.js             # Main server file with Express.js setup
├── index.html            # Frontend dashboard HTML page
├── src/
│   ├── cpuData.js        # CPU utilization data collection
│   ├── gpuData.js        # GPU utilization data collection (requires nvidia-smi)
│   ├── memoryData.js     # Memory utilization data collection
│   └── monitoringData.js # Main module that combines all monitoring data
└── README.md             # This file
```

## API Endpoints

- `GET /` - Serve the main dashboard page
- `GET /api/monitoring-data` - Get real-time system monitoring data
- `GET /api/debug-info` - Get server debug information

## Configuration

The application uses the following environment variables:
- `PORT` - Port to run the server on (default: 3000)
- `DEBUG` - Enable debug logging (set to 'true' for verbose output)

## Troubleshooting

### GPU Monitoring Issues
If you're not seeing GPU data, ensure:
1. You have an NVIDIA GPU installed
2. NVIDIA drivers are properly installed
3. The `nvidia-smi` command works in your terminal
4. Your system has the necessary permissions to access GPU information

### Port Conflicts
If port 3000 is already in use:
```bash
PORT=3001 npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.
