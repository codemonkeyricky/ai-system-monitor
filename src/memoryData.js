const os = require('os');

// Helper function to get memory utilization
function getMemoryUtilization() {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate usage percentage
    const percentage = totalMemory > 0 ? Math.min(100, (usedMemory / totalMemory) * 100) : 0;

    return {
      timestamp: new Date().toISOString(),
      memoryUsage: {
        total: Math.round(totalMemory / (1024 * 1024)), // MB
        used: Math.round(usedMemory / (1024 * 1024)), // MB
        free: Math.round(freeMemory / (1024 * 1024)), // MB
        available: Math.round(freeMemory / (1024 * 1024)), // MB (approximate)
        buffCache: 0, // OS doesn't directly expose this in os module, but it's part of freeMemory
        percentage: parseFloat(percentage.toFixed(1))
      }
    };
  } catch (error) {
    console.error('Error fetching memory data:', error);
    throw new Error('Failed to fetch memory data');
  }
}

module.exports = { getMemoryUtilization };