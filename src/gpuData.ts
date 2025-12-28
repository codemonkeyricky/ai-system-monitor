import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Define TypeScript interface for GPU data
export interface GpuData {
  powerDraw: number;
  powerLimit: number;
  utilization: number;
  memoryUsed: number;
  memoryTotal: number;
}

// Helper function to get GPU utilization data
async function getGpuUtilization(): Promise<GpuData[]> {
  try {
    // Get GPU data using nvidia-smi
    const { stdout: gpuOutput, stderr: gpuError } = await execPromise(
      'nvidia-smi --query-gpu=power.draw,power.limit,utilization.gpu,memory.used,memory.total --format=csv,nounits,noheader'
    );

    if (gpuError) {
      console.error('Error running nvidia-smi:', gpuError);
      throw new Error(`Failed to fetch GPU data: ${gpuError}`);
    }

    // Parse the CSV output
    const lines = gpuOutput.trim().split('\n');
    const gpus: GpuData[] = lines.map(line => {
      const [powerDraw, powerLimit, utilization, memoryUsed, memoryTotal] = line.split(', ').map(Number);
      return {
        powerDraw,
        powerLimit,
        utilization,
        memoryUsed,
        memoryTotal
      };
    });

    return gpus;
  } catch (error: any) {
    console.error('Error fetching GPU data:', error);
    throw new Error('Failed to fetch GPU data');
  }
}

export { getGpuUtilization };