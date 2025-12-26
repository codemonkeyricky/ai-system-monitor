// File: diskData.js
const fs = require('fs');                      // For sync FS fallback
const os = require('os');
const util = require('util');
const { exec } = require('child_process');
const execPromise = util.promisify(exec);     // Async exec wrapper

// Helper: Convert human-readable size (e.g., "915G", "6.2M") to bytes
function humanToBytes(sizeStr) {
  const unitMap = {
    B: 1,
    K: 1024,
    M: 1024 ** 2,
    G: 1024 ** 3,
    T: 1024 ** 4,
    P: 1024 ** 5,
    E: 1024 ** 6,
  };

  // Match number (with decimals) + unit (case-insensitive), ignore extra spaces
  const match = sizeStr.trim().match(/^([0-9.]+)\s*([KMGTPEB])$/i);
  if (!match) {
    console.debug('Invalid human-readable size:', sizeStr);
    return 0;
  }

  const number = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multiplier = unitMap[unit] || 1; // Default to bytes if unit is unrecognized

  return number * multiplier;
}

// Helper: Parse "df -h | grep /dev/nvme" output into NVMe device data
function parseNvmeFromDfH(output) {
  const lines = output.trim().split('\n');
  const nvmeDevices = [];

  for (const line of lines) {
    // Split by WHITESPACE (handles multiple spaces in df -h output)
    const parts = line.split(/\s+/).filter(Boolean);
    
    // df -h has 6 columns: Filesystem, Size, Used, Avail, Use%, Mounted on
    if (parts.length < 6) {
      console.debug('Skipping invalid df -h line (too few columns):', line);
      continue;
    }

    const [
      filesystem,   // /dev/nvme0n1p2
      sizeStr,      // 915G
      usedStr,      // 795G
      availStr,     // 74G
      capacityStr,  // 92%
      mountPoint    // /
    ] = parts;

    // Skip non-NVMe devices (e.g., /dev/sda)
    if (!filesystem.startsWith('/dev/nvme')) continue;

    // Convert human-readable sizes to bytes → then to MB (consistent with original code)
    const totalBytes = humanToBytes(sizeStr);
    const usedBytes = humanToBytes(usedStr);
    const freeBytes = humanToBytes(availStr);

    // Parse capacity percentage (e.g., "92%" → 92, clamp to 0-100)
    let percentage = 0;
    if (capacityStr && typeof capacityStr === 'string') {
      const cleaned = capacityStr.replace('%', '').trim();
      percentage = Math.max(0, Math.min(100, parseInt(cleaned, 10) || 0));
    }

    // Skip invalid devices (e.g., 0 bytes total)
    if (totalBytes <= 0) {
      console.debug('Skipping NVMe device with invalid size:', filesystem);
      continue;
    }

    nvmeDevices.push({
      path: filesystem,                // /dev/nvme0n1p2
      mountPoint: mountPoint,          // /
      total: Math.round(totalBytes / (1024 * 1024)), // Total MB
      used: Math.round(usedBytes / (1024 * 1024)),   // Used MB
      free: Math.round(freeBytes / (1024 * 1024)),   // Free MB
      percentage: percentage,          // Use% (0-100)
      humanSize: sizeStr,              // Original human size (e.g., "915G")
      humanUsed: usedStr,              // Original used size (e.g., "795G")
      humanFree: availStr              // Original free size (e.g., "74G")
    });
  }

  return nvmeDevices;
}

// Main function: Get NVMe-focused disk usage
async function getDiskUsage() {
  try {
    let nvmeFilesystems = [];
    let rootStats = {};
    let hasNvmeRoot = false;

    // Step 1: Try to get NVMe data via "df -h | grep /dev/nvme" (Linux-only)
    try {
      const { stdout, stderr } = await execPromise('df -h | grep \'/dev/nvme\'');

      // Handle empty output (no NVMe devices) or warnings
      if (!stdout.trim()) {
        console.debug('No NVMe devices found via df -h | grep /dev/nvme');
      } else if (stderr) {
        console.warn('df/grep warning:', stderr);
      }

      // Parse valid NVMe devices from output
      nvmeFilesystems = parseNvmeFromDfH(stdout);

      // Use the NVMe device mounted at "/" as root stats (if exists)
      const rootNvme = nvmeFilesystems.find(device => device.mountPoint === '/');
      if (rootNvme) {
        rootStats = {
          total: rootNvme.total,
          used: rootNvme.used,
          free: rootNvme.free,
          percentage: rootNvme.percentage,
          humanSize: rootNvme.humanSize, // Optional: Add original "915G"
          humanUsed: rootNvme.humanUsed,
          humanFree: rootNvme.humanFree
        };
        hasNvmeRoot = true;
      } else if (nvmeFilesystems.length > 0) {
        console.debug('NVMe devices exist but none mounted at root (/); using fallback for root');
      }
    } catch (dfError) {
      // Handle common errors gracefully
      if (dfError.code === 'ENOENT') {
        console.warn('"df" or "grep" not found (non-Linux system?); falling back to memory stats');
      } else if (dfError.message.includes('No such file or directory')) {
        console.debug('No NVMe devices detected (df command failed)');
      } else {
        console.error('Failed to run df -h | grep /dev/nvme:', dfError.message);
      }
    }

    // Step 2: Fallback for root stats (if no NVMe at root or NVMe parsing failed)
    if (!hasNvmeRoot) {
      try {
        // Fallback 1: Use statfsSync for root (Linux/macOS)
        const rootFs = fs.statfsSync('/');
        const totalBytes = rootFs.bsize * rootFs.blocks;
        const freeBytes = rootFs.bsize * rootFs.bfree;
        const usedBytes = totalBytes - freeBytes;
        const percentage = totalBytes > 0 ? Math.min(100, (usedBytes / totalBytes) * 100) : 0;

        rootStats = {
          total: Math.round(totalBytes / (1024 * 1024)),
          used: Math.round(usedBytes / (1024 * 1024)),
          free: Math.round(freeBytes / (1024 * 1024)),
          percentage: parseFloat(percentage.toFixed(1))
        };
      } catch (statError) {
        // Fallback 2: Use system memory (last resort for Windows/Linux)
        console.warn('Failed to get root stats; using system memory approximation');
        const totalBytes = os.totalmem();
        const freeBytes = os.freemem();
        const usedBytes = totalBytes - freeBytes;
        const percentage = totalBytes > 0 ? Math.min(100, (usedBytes / totalBytes) * 100) : 0;

        rootStats = {
          total: Math.round(totalBytes / (1024 * 1024)),
          used: Math.round(usedBytes / (1024 * 1024)),
          free: Math.round(freeBytes / (1024 * 1024)),
          percentage: parseFloat(percentage.toFixed(1))
        };
      }
    }

    // Return final structured data (matches your example output)
    return {
      timestamp: new Date().toISOString(),
      root: rootStats,
      nvmeDevices: nvmeFilesystems, // Exact NVMe devices from df -h
      totalNvmeCount: nvmeFilesystems.length
    };

  } catch (criticalError) {
    // Catch-all for unexpected errors (return safe defaults)
    console.error('Critical error in getDiskUsage:', criticalError);
    return {
      timestamp: new Date().toISOString(),
      root: {
        total: 10240,   // Default: 10GB
        used: 5120,     // Default: 5GB
        free: 5120,     // Default: 5GB
        percentage: 50  // Default: 50%
      },
      nvmeDevices: [],
      totalNvmeCount: 0
    };
  }
}

module.exports = { getDiskUsage };
