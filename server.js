const express = require('express');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use('/components', express.static('public/components'));


// Add debug logging function
const debugLog = (message) => {
  if (process.env.DEBUG === 'true') {
    console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
  }
};

// Import monitoring data functions
const { getAllMonitoringData } = require('./src/monitoringData');

// API endpoint to get GPU and CPU power consumption data
app.get('/api/monitoring-data', async (req, res) => {
  try {
    debugLog('Fetching monitoring data...');

    const data = await getAllMonitoringData();

    debugLog(`Successfully fetched monitoring data for ${data.gpus.length} GPU(s)`);
    res.json(data);
  } catch (error) {
    debugLog(`Error fetching monitoring data: ${error.message}`);
    console.error('Error fetching monitoring data:', error);
    res.status(500).json({
      error: 'Failed to fetch monitoring data',
      details: error.message
    });
  }
});

// API endpoint for debug information
app.get('/api/debug-info', (req, res) => {
  try {
    const response = {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        debugMode: process.env.DEBUG === 'true'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching debug info:', error);
    res.status(500).json({ error: 'Failed to fetch debug information' });
  }
});

// Serve the main HTML page with enhanced dashboard
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(port, () => {
  console.log(`Monitor server is running on port ${port}`);
  console.log(`Debug mode: ${process.env.DEBUG === 'true' ? 'ON' : 'OFF'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down monitor server...');
  process.exit(0);
});
