import { getGpuUtilization, GpuData } from './gpuData';
import { getCpuUtilization, CpuData } from './cpuData';
import { getMemoryUtilization, MemoryData } from './memoryData';
import { getDiskUsage, DiskData } from './diskData';
import * as os from 'os';
import { getNetworkBandwidth, NetworkData } from './networkData';
import { getDockerContainers, DockerContainer } from './dockerData';

// Helper function to get all monitoring data
async function getAllMonitoringData() {
  try {
    // Get GPU data
    const gpus: GpuData[] = await getGpuUtilization();

    // Get CPU data
    const cpuData: CpuData = await getCpuUtilization();

    // Get memory data
    const memoryData: MemoryData = getMemoryUtilization();

    // Get disk usage data
    const diskData: DiskData = await getDiskUsage();

    // Get network bandwidth data
    const networkData: NetworkData = await getNetworkBandwidth();

    // Get Docker containers data
    const dockerContainers: DockerContainer[] = await getDockerContainers();

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
      disk: diskData,
      network: {
        interfaces: networkData.interfaces
      },
      docker: {
        containers: dockerContainers
      }
    };

    return response;
  } catch (error: any) {
    console.error('Error fetching monitoring data:', error);
    throw error;
  }
}

export { getAllMonitoringData };