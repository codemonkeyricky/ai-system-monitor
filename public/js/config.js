// Configuration & Constants
const config = {
  updateInterval: 2000,
  maxDataPoints: 20,
  autoRefresh: true,
  apiEndpoint: '/api/monitoring-data'
};

// Color scales for D3
const colorScales = {
  cpu: d3.scaleSequential(d3.interpolateBlues).domain([0, 100]),
  memory: d3.scaleSequential(d3.interpolateOranges).domain([0, 100]),
  gpu: d3.scaleSequential(d3.interpolateGreens).domain([0, 100]),
  temperature: d3.scaleSequential(d3.interpolateRdYlBu).domain([30, 90])
};

// Status thresholds
const thresholds = {
  cpu: { warning: 70, critical: 90 },
  memory: { warning: 80, critical: 90 },
  gpuTemp: { warning: 75, critical: 85 },
  gpuUsage: { warning: 85, critical: 95 }
};

export { config, colorScales, thresholds };