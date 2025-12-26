const { getGpuUtilization } = require('./gpuData');
const { getCpuUtilization } = require('./cpuData');
const { getMemoryUtilization } = require('./memoryData');
const { getDiskUsage } = require('./diskData');
const os = require('os');

// Helper function to get all monitoring data
async function getAllMonitoringData() {
  try {
    // Get GPU data
    const gpus = await getGpuUtilization();

    // Get CPU data
    const cpuData = await getCpuUtilization();

    // Get memory data
    const memoryData = getMemoryUtilization();

    // Get disk usage data
    const diskData = await getDiskUsage();

    // Create combined response
    const response = {
      timestamp: new Date().toISOString(),
      cpu: cpuData,
      gpus: gpus,
      system: {
        loadAverage: os.loadavg(),
        freeMemory: os.freemem(),
        totalMemory: os.totalmem()
      },
      memory: memoryData.memoryUsage,
      disk: diskData
    };

    return response;
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    throw error;
  }
}

module.exports = { getAllMonitoringData };