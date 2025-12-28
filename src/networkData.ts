// src/networkData.ts
import { exec } from 'child_process';

// Define TypeScript interfaces for Network data
export interface NetworkInterface {
  iface: string;
  rx_kBs: number;
  tx_kBs: number;
}

export interface NetworkData {
  timestamp: string;
  interfaces: NetworkInterface[];
}

// Helper to parse sar output for rxkB/s
function parseSarNetwork(output: string): NetworkInterface[] {
  const lines = output.trim().split('\n');
  // Find header line
  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/IFACE/i.test(lines[i]) && /rxkB\/s/i.test(lines[i])) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return [];
  const headers = lines[headerIdx].split(/\s+/);
  const ifaceIdx = headers.indexOf('IFACE');
  const rxIdx = headers.findIndex(h => h.toLowerCase().includes('rxkb/s'));
  const txIdx = headers.findIndex(h => h.toLowerCase().includes('txkb/s'));
  if (ifaceIdx === -1 || rxIdx === -1) return [];

  // Parse each average line (skip header and any empty lines)
  return lines.slice(headerIdx + 1).map(line => line.trim()).filter(line => line).map(line => {
    const cols = line.split(/\s+/);
    return {
      iface: cols[ifaceIdx],
      rx_kBs: parseFloat(cols[rxIdx]) || 0,
      tx_kBs: txIdx !== -1 ? parseFloat(cols[txIdx]) || 0 : 0
    };
  });
}

// Get network bandwidth data using sar
function getNetworkBandwidth(): Promise<NetworkData> {
  return new Promise((resolve, reject) => {
    const cmd = "sar -n DEV 1 1 | grep -i average | grep -v lo";
    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(err);
      try {
        const parsed = parseSarNetwork(stdout);
        resolve({ timestamp: new Date().toISOString(), interfaces: parsed });
      } catch (e: any) {
        reject(e);
      }
    });
  });
}

export { getNetworkBandwidth };