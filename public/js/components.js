// Update Network stats display
function updateNetworkStats() {
  const monitoringData = getMonitoringData();
  const networkData = monitoringData.network.current;
  if (!networkData) return;

  // Calculate total RX/TX bandwidth for all interfaces (kB/s)
  const totalRx = networkData.interfaces.reduce((acc, iface) => acc + (iface.rx_kBs || 0), 0);
  const totalTx = networkData.interfaces.reduce((acc, iface) => acc + (iface.tx_kBs || 0), 0);

  const networkStats = document.getElementById('network-stats');
  networkStats.innerHTML = `
    <div class="stat-item network-stat">
      <div class="stat-label">Total RX</div>
      <div class="stat-value">${totalRx.toFixed(2)} kB/s</div>
    </div>
    <div class="stat-item network-stat">
      <div class="stat-label">Total TX</div>
      <div class="stat-value">${totalTx.toFixed(2)} kB/s</div>
    </div>
  `;
}
import { getMonitoringData } from './data-service.js';
import { thresholds } from './config.js';

// Update CPU stats display
function updateCpuStats() {
  const monitoringData = getMonitoringData();
  const cpuData = monitoringData.cpu.current;
  if (!cpuData) return;

  const cpuStats = document.getElementById('cpu-stats');
  cpuStats.innerHTML = `
    <div class="stat-item cpu-stat">
      <div class="stat-label">Cores</div>
      <div class="stat-value">${cpuData.cores}</div>
    </div>
    <div class="stat-item cpu-stat">
      <div class="stat-label">Threads</div>
      <div class="stat-value">${cpuData.threads || cpuData.cores * 2}</div>
    </div>
    <div class="stat-item cpu-stat">
      <div class="stat-label">Frequency</div>
      <div class="stat-value">${(cpuData.frequency || 3.5).toFixed(1)} GHz</div>
    </div>
    <div class="stat-item cpu-stat">
      <div class="stat-label">Temperature</div>
      <div class="stat-value">${cpuData.temperature || 45}°C</div>
    </div>
  `;
}

// Update Memory stats display
function updateMemoryStats() {
  const monitoringData = getMonitoringData();
  const memoryData = monitoringData.memory.current;
  if (!memoryData) return;

  const usedGB = (memoryData.used / 1024).toFixed(1);
  const totalGB = (memoryData.total / 1024).toFixed(1);
  const availableGB = (memoryData.available / 1024).toFixed(1);
  const usagePercentage = memoryData.percentage;

  const memoryStats = document.getElementById('memory-stats');
  memoryStats.innerHTML = `
    <div class="stat-item memory-stat">
      <div class="stat-label">Used</div>
      <div class="stat-value">${usedGB} GB</div>
    </div>
    <div class="stat-item memory-stat">
      <div class="stat-label">Total</div>
      <div class="stat-value">${totalGB} GB</div>
    </div>
    <div class="stat-item memory-stat">
      <div class="stat-label">Available</div>
      <div class="stat-value">${availableGB} GB</div>
    </div>
    <div class="stat-item memory-stat">
      <div class="stat-label">Usage</div>
      <div class="stat-value">${usagePercentage.toFixed(1)}%</div>
    </div>
  `;
}

// Update GPU display
function updateGpuDisplay() {
  const monitoringData = getMonitoringData();
  const gpus = monitoringData.gpus.current || [];

  if (gpus.length === 0) {
    document.getElementById('gpu-list').innerHTML = '<p>No GPUs detected</p>';
    return;
  }

  let gpuHtml = '';
  
  gpus.forEach((gpu, index) => {
    const powerPercentage = gpu.powerLimit > 0 ? (gpu.powerDraw / gpu.powerLimit) * 100 : 0;
    const memoryPercentage = (gpu.memoryUsed / gpu.memoryTotal) * 100;
    
    gpuHtml += `
      <div class="gpu-item">
        <div class="gpu-name">
          <span>GPU ${index + 1}: ${gpu.name || 'NVIDIA GPU'}</span>
          <span>${gpu.temperature || 60}°C</span>
        </div>
        
        <div class="progress-container">
          <div class="progress-label">
            <span>Power</span>
            <span>${gpu.powerDraw.toFixed(1)}W / ${gpu.powerLimit}W</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill power-fill" style="width: ${Math.min(powerPercentage, 100)}%"></div>
          </div>
        </div>
        
        <div class="progress-container">
          <div class="progress-label">
            <span>Memory</span>
            <span>${gpu.memoryUsed}MB / ${gpu.memoryTotal}MB</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill memory-fill" style="width: ${memoryPercentage}%"></div>
          </div>
        </div>
        
        <div class="progress-container">
          <div class="progress-label">
            <span>Utilization</span>
            <span>${gpu.utilization}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill utilization-fill" style="width: ${gpu.utilization}%"></div>
          </div>
        </div>
        
        <div class="progress-container">
          <div class="progress-label">
            <span>Fan Speed</span>
            <span>${gpu.fanSpeed || 60}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill temperature-fill" style="width: ${gpu.fanSpeed || 60}%"></div>
          </div>
        </div>
      </div>
    `;
  });

  document.getElementById('gpu-list').innerHTML = gpuHtml;

  // Update GPU stats
  const gpuStats = document.getElementById('gpu-stats');
  if (gpus.length > 0) {
    const firstGpu = gpus[0];
    const avgUtilization = gpus.reduce((sum, gpu) => sum + gpu.utilization, 0) / gpus.length;
    const maxTemp = Math.max(...gpus.map(g => g.temperature || 60));
    
    gpuStats.innerHTML = `
      <div class="stat-item gpu-stat">
        <div class="stat-label">Total GPUs</div>
        <div class="stat-value">${gpus.length}</div>
      </div>
      <div class="stat-item gpu-stat">
        <div class="stat-label">Avg. Utilization</div>
        <div class="stat-value">${avgUtilization.toFixed(1)}%</div>
      </div>
      <div class="stat-item gpu-stat">
        <div class="stat-label">Driver Version</div>
        <div class="stat-value">${firstGpu.driverVersion || '470.xx'}</div>
      </div>
      <div class="stat-item gpu-stat">
        <div class="stat-label">Max Temp</div>
        <div class="stat-value">${maxTemp}°C</div>
      </div>
    `;
  }
}

// Update status indicators
function updateStatusIndicators() {
  const monitoringData = getMonitoringData();
  
  // CPU status
  const cpuUsage = monitoringData.cpu.current ? monitoringData.cpu.current.usage : 0;
  const cpuStatus = document.getElementById('cpu-status');
  cpuStatus.className = 'status-indicator ' +
    (cpuUsage > thresholds.cpu.critical ? 'status-error' : 
     cpuUsage > thresholds.cpu.warning ? 'status-warning' : 'status-ok');

  // Memory status
  const memUsage = monitoringData.memory.current ? monitoringData.memory.current.percentage : 0;
  const memoryStatus = document.getElementById('memory-status');
  memoryStatus.className = 'status-indicator ' +
    (memUsage > thresholds.memory.critical ? 'status-error' : 
     memUsage > thresholds.memory.warning ? 'status-warning' : 'status-ok');

  // GPU status
  const gpus = monitoringData.gpus.current || [];
  let gpuStatusClass = 'status-ok';
  if (gpus.length > 0) {
    const maxGpuTemp = Math.max(...gpus.map(g => g.temperature || 0));
    const maxGpuUsage = Math.max(...gpus.map(g => g.utilization || 0));

    if (maxGpuTemp > thresholds.gpuTemp.critical || maxGpuUsage > thresholds.gpuUsage.critical) {
      gpuStatusClass = 'status-error';
    } else if (maxGpuTemp > thresholds.gpuTemp.warning || maxGpuUsage > thresholds.gpuUsage.warning) {
      gpuStatusClass = 'status-warning';
    }
  }
  document.getElementById('gpu-status').className = 'status-indicator ' + gpuStatusClass;
}

// Update last update time (unchanged)
function updateLastUpdateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  document.getElementById('update-time').textContent = timeString;
}

// ==============================================
// NEW: Missing Disk Functions (Fixes ReferenceError)
// ==============================================

/**
 * Update disk summary (root filesystem stats)
 * @param {Object} diskData - From getMonitoringData().disk.current
 */
function updateDiskSummary(diskData) {
  const summaryElement = document.getElementById('disk-summary');
  if (!summaryElement || !diskData.root) return;

  const root = diskData.root;
  // Convert MB to GB for readability (consistent with memory display)
  const usedGB = (root.used / 1024).toFixed(1);
  const totalGB = (root.total / 1024).toFixed(1);
  const freeGB = (root.free / 1024).toFixed(1);
  const percentage = root.percentage.toFixed(1);

  summaryElement.innerHTML = `
    
      Total
      ${totalGB} GB
    
    
      Used
      ${usedGB} GB
    
    
      Free
      ${freeGB} GB
    
    
      Usage
      ${percentage}%
    
  `;
}

/**
 * Update NVMe filesystems list (from diskData.nvmeDevices)
 * @param {Object} diskData - From getMonitoringData().disk.current
 */
function updateFilesystemsList(diskData) {
  const listElement = document.getElementById('filesystems-list');
  if (!listElement) return;

  const nvmeDevices = diskData.nvmeDevices || [];

  if (nvmeDevices.length === 0) {
    listElement.innerHTML = '<p style="color: #a3d5ff; text-align: center;">No NVMe devices found</p>';
    return;
  }

  // Generate HTML with progress bars for each NVMe device
  const devicesHtml = nvmeDevices.map(device => {
    // Use human-readable sizes (from df -h) or calculate from MB→GB
    const size = device.humanSize || `${(device.total / 1024).toFixed(1)} GB`;
    const used = device.humanUsed || `${(device.used / 1024).toFixed(1)} GB`;
    const free = device.humanFree || `${(device.free / 1024).toFixed(1)} GB`;
    const percentage = device.percentage.toFixed(1);

    return `
      <div class="filesystem-item">
        <div class="filesystem-header">
          <div class="filesystem-path">${device.path} (${device.mountPoint})</div>
          <div class="filesystem-percentage">${percentage}%</div>
        </div>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill disk-fill" style="width: ${device.percentage}%"></div>
          </div>
        </div>
        <div class="filesystem-stats">
          <span>Size: ${size}</span>
          <span>Used: ${used}</span>
          <span>Free: ${free}</span>
        </div>
      </div>
    `;
  }).join('');

  listElement.innerHTML = devicesHtml;
}

// Update Disk display (unchanged, now calls defined functions)
function updateDiskDisplay() {
  const monitoringData = getMonitoringData();
  const diskData = monitoringData.disk.current;

  // updateDiskSummary(diskData);
  updateFilesystemsList(diskData);
}

// Function to update Docker containers display
function updateDockerDisplay() {
  try {
    const monitoringData = getMonitoringData();

    // Check if monitoring data exists and has docker property
    if (!monitoringData || !monitoringData.docker) {
      console.warn('Docker data not found in monitoring data');
      return;
    }

    console.log('### monitoring data:', monitoringData); // Debug line

    // Access containers properly based on API response structure
    const containers = monitoringData.docker.current.containers || [];

    console.log('Docker containers from monitoring data:', containers); // Debug line

    const containerList = document.getElementById('docker-containers-list');
    const totalCountElement = document.getElementById('docker-total-count');
    const runningCountElement = document.getElementById('docker-running-count');

    // Update summary
    if (totalCountElement) {
      totalCountElement.textContent = containers.length;
    }

    const runningContainers = containers.filter(c =>
      c.status && (c.status.toLowerCase().includes('up') || c.status.toLowerCase().includes('running'))
    );

    if (runningCountElement) {
      runningCountElement.textContent = runningContainers.length;
    }

    // Update container list
    if (containerList) {
      if (containers.length === 0) {
        containerList.innerHTML = '<p style="color: #a3d5ff; text-align: center;">No containers found</p>';
        return;
      }

      const containersHTML = containers.map(container => {
        // Ensure container properties exist
        const name = container.name || '<unnamed>';
        const id = container.id || '';
        const image = container.image || 'unknown';
        const status = container.status || 'unknown';

        // Determine status class
        let statusClass = 'status-exited';
        if (status.toLowerCase().includes('up') || status.toLowerCase().includes('running')) {
          statusClass = 'status-running';
        }

        // Format ports display
        const portsDisplay = (container.ports && container.ports.length > 0) ?
          `<div class="docker-container-ports">Ports: ${container.ports.join(', ')}</div>` : '';

        return `
          <div class="docker-container-item">
            <div class="docker-container-header">
              <div>
                <div class="docker-container-name">${name}</div>
                <div class="docker-container-id">${id}</div>
              </div>
              <div class="docker-container-status ${statusClass}">${status}</div>
            </div>
            <div class="docker-container-image">Image: ${image}</div>
            ${portsDisplay}
          </div>
        `;
      }).join('');

      containerList.innerHTML = containersHTML;
    }
  } catch (error) {
    console.error('Error updating Docker display:', error);
  }
}

// Update all components (unchanged)
function updateAllComponents() {
  updateCpuStats();
  updateMemoryStats();
  updateGpuDisplay();
  updateDiskDisplay();
  updateNetworkStats();
  updateDockerDisplay();
  updateStatusIndicators();
  updateLastUpdateTime();
}

export { 
  updateCpuStats, 
  updateMemoryStats, 
  updateGpuDisplay, 
  updateNetworkStats,
  updateStatusIndicators, 
  updateLastUpdateTime,
  updateAllComponents 
};
