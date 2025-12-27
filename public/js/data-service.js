import { config } from './config.js';

// Data storage
let monitoringData = {
  cpu: { history: [], current: null },
  memory: { history: [], current: null },
  gpus: { history: [], current: [] },
  disk: { history: [], current: null },
  system: { history: [], current: null },
  network: { history: [], current: null },
  docker: { history: [], current: null }
};

// Fetch real data from API
async function fetchRealData() {
  try {
    const response = await fetch(config.apiEndpoint);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return transformApiData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    // Fallback to mock data
    return generateMockData();
  }
}

// Process data from API
function processData(data) {
    // Process Network data
    if (data.network) {
      monitoringData.network.current = data.network;
      // For each interface, store rx_kBs+tx_kBs sum for bandwidth
      const totalBandwidth = (data.network.interfaces || []).reduce((acc, iface) => acc + (iface.rx_kBs || 0) + (iface.tx_kBs || 0), 0);
      // Ensure timestamp is a Date object for d3 scaleTime
      let ts = data.network.timestamp;
      if (typeof ts === 'string') ts = new Date(ts);
      monitoringData.network.history.push({
        timestamp: ts,
        totalBandwidth
      });
      if (monitoringData.network.history.length > config.maxDataPoints) {
        monitoringData.network.history.shift();
      }
    }
  // Process CPU data
  if (data.cpu) {
    monitoringData.cpu.current = data.cpu;
    monitoringData.cpu.history.push({
      timestamp: new Date(),
      usage: data.cpu.usage
    });

    // Keep only maxDataPoints
    if (monitoringData.cpu.history.length > config.maxDataPoints) {
      monitoringData.cpu.history.shift();
    }
  }

  // Process Memory data
  if (data.memory) {
    monitoringData.memory.current = data.memory;
    monitoringData.memory.history.push({
      timestamp: new Date(),
      usage: data.memory.percentage
    });

    if (monitoringData.memory.history.length > config.maxDataPoints) {
      monitoringData.memory.history.shift();
    }
  }

  // Process GPU data
  if (data.gpus) {
    monitoringData.gpus.current = data.gpus;
    monitoringData.gpus.history.push({
      timestamp: new Date(),
      gpus: data.gpus
    });

    if (monitoringData.gpus.history.length > config.maxDataPoints) {
      monitoringData.gpus.history.shift();
    }
  }

  // Process Disk data
  if (data.disk) {
    monitoringData.disk.current = data.disk;
    // For disk, we don't track history in the same way as CPU/memory
    // We just keep the current data for display
  }

  // Process System data
  if (data.system) {
    monitoringData.system.current = data.system;
  }

  // Process Docker data
  if (data.docker) {
    monitoringData.docker.current = data.docker;
    // For Docker, we don't track history in the same way as CPU/memory
    // We just keep the current data for display
  }
}

// Transform API response to expected format
function transformApiData(apiData) {
  // Adjust this function based on your actual API response structure
  return {
    cpu: {
      usage: apiData.cpu_usage || apiData.cpu?.usage || 0,
      cores: apiData.cpu_cores || apiData.cpu?.cores || 8,
      threads: apiData.cpu_threads || apiData.cpu?.threads || 16,
      frequency: apiData.cpu_frequency || apiData.cpu?.frequency || 3.6,
      temperature: apiData.cpu_temp || apiData.cpu?.temperature || 45
    },
    memory: {
      total: apiData.memory_total || apiData.memory?.total || 32768,
      used: apiData.memory_used || apiData.memory?.used || 0,
      available: apiData.memory_available || apiData.memory?.available || 0,
      percentage: apiData.memory_percentage || apiData.memory?.percentage || 0
    },
    gpus: apiData.gpus || apiData.gpu_list || [],
    disk: apiData.disk || {},
    system: apiData.system || {},
    network: apiData.network || null,
    docker: apiData.docker || {}
  };
}

// Generate mock data for demonstration
function generateMockData() {
  const baseCpuUsage = 30 + Math.random() * 40;
  const baseMemoryUsage = 40 + Math.random() * 30;

  return {
    cpu: {
      usage: baseCpuUsage,
      cores: 8,
      threads: 16,
      frequency: 3.6 + Math.random() * 0.8,
      temperature: 40 + Math.random() * 20
    },
    memory: {
      total: 32768,
      used: baseMemoryUsage / 100 * 32768,
      available: (100 - baseMemoryUsage) / 100 * 32768,
      percentage: baseMemoryUsage
    },
    gpus: [
      {
        name: "NVIDIA RTX 3080",
        powerDraw: 280 + Math.random() * 40,
        powerLimit: 320,
        utilization: 65 + Math.random() * 30,
        memoryUsed: 8192,
        memoryTotal: 10240,
        temperature: 65 + Math.random() * 15,
        fanSpeed: 60 + Math.random() * 30,
        driverVersion: "470.82"
      }
    ],
    disk: {
      root: {
        total: 102400, // 100GB
        used: 25000 + Math.random() * 10000, // 25-35GB used
        free: 77400 + Math.random() * 10000, // 77.4-87.4GB free
        percentage: 25 + Math.random() * 10 // 25-35% used
      },
      filesystems: [
        {
          path: "/home",
          total: 20480, // 20GB
          used: 5000 + Math.random() * 5000, // 5-10GB used
          free: 15480 + Math.random() * 5000, // 15.48-20.48GB free
          percentage: 25 + Math.random() * 10 // 25-35% used
        },
        {
          path: "/var",
          total: 5120, // 5GB
          used: 1000 + Math.random() * 1000, // 1-2GB used
          free: 4120 + Math.random() * 1000, // 4.12-5.12GB free
          percentage: 20 + Math.random() * 10 // 20-30% used
        }
      ]
    },
    system: {
      os: "Ubuntu 20.04",
      uptime: 86400 + Math.random() * 86400,
      diskUsed: 250 + Math.random() * 100,
      diskTotal: 1000,
      processes: 150 + Math.floor(Math.random() * 50)
    },
    docker: {
      containers: [
        {
          id: "a1b2c3d4e5f6",
          name: "nginx-server",
          image: "nginx:latest",
          status: "Up 2 hours",
          ports: ["80/tcp", "443/tcp"]
        },
        {
          id: "f6e5d4c3b2a1",
          name: "mysql-database",
          image: "mysql:8.0",
          status: "Up 3 days",
          ports: ["3306/tcp"]
        }
      ]
    }
  };
}

// Get current data
function getMonitoringData() {
  return monitoringData;
}

export { fetchRealData, processData, getMonitoringData, generateMockData };