
const os = require('os');
const fs = require('fs').promises; // Use async fs

// Store previous CPU times for fallback delta calculation
let previousCpuTimes = [];

async function getCpuUtilization() {
  try {
    // ✅ Linux /proc/stat path with two samples
    const stat1 = await fs.readFile('/proc/stat', 'utf8');
    const cpuLine1 = stat1.split('\n').find(line => line.startsWith('cpu '));
    const cpuStats1 = cpuLine1.trim().split(/\s+/).slice(1).map(Number);
    const total1 = cpuStats1.reduce((a, b) => a + b, 0);
    const idle1 = cpuStats1[3]; // Idle is 4th index (0-based) in /proc/stat

    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay

    const stat2 = await fs.readFile('/proc/stat', 'utf8');
    const cpuLine2 = stat2.split('\n').find(line => line.startsWith('cpu '));
    const cpuStats2 = cpuLine2.trim().split(/\s+/).slice(1).map(Number);
    const total2 = cpuStats2.reduce((a, b) => a + b, 0);
    const idle2 = cpuStats2[3];

    // Calculate overall usage from delta
    const totalDelta = total2 - total1;
    const idleDelta = idle2 - idle1;
    const overallUsage = totalDelta > 0 ? Math.min(100, ((totalDelta - idleDelta) / totalDelta) * 100) : 0;

    // Calculate per-core usage (repeat delta logic for each cpuX line)
    const coreStats = [];
    stat2.split('\n').forEach(line => {
      if (line.startsWith('cpu') && !line.startsWith('cpu ')) {
        const parts = line.trim().split(/\s+/).slice(1).map(Number);
        const coreTotal = parts.reduce((a, b) => a + b, 0);
        const coreIdle = parts[3];
        const coreLine1 = stat1.split('\n').find(l => l.startsWith(line.split(' ')[0]));
        const coreParts1 = coreLine1.trim().split(/\s+/).slice(1).map(Number);
        const coreTotal1 = coreParts1.reduce((a, b) => a + b, 0);
        const coreIdle1 = coreParts1[3];
        const coreDelta = coreTotal - coreTotal1;
        const coreIdleDelta = coreIdle - coreIdle1;
        const coreUsage = coreDelta > 0 ? Math.min(100, ((coreDelta - coreIdleDelta) / coreDelta) * 100) : 0;
        coreStats.push({ coreId: parseInt(line.split(' ')[0].substring(3)), usage: parseFloat(coreUsage.toFixed(1)) });
      }
    });

    return {
      usage: parseFloat(overallUsage.toFixed(1)),
      cores: os.cpus().length,
      coreUtilizations: coreStats.sort((a, b) => a.coreId - b.coreId).map(c => ({ idle: 0, total: 0, usage: c.usage }))
    };

  } catch (error) {
    // ✅ Fallback with real delta calculation (no fake values)
    const currentCpus = os.cpus();
    const coreUsages = currentCpus.map((cpu, i) => {
      const prev = previousCpuTimes[i] || cpu.times;
      const totalDelta = cpu.times.total - prev.total;
      const idleDelta = cpu.times.idle - prev.idle;
      const usage = totalDelta > 0 ? Math.min(100, ((totalDelta - idleDelta) / totalDelta) * 100) : 0;
      previousCpuTimes[i] = cpu.times; // Update stored sample
      return { coreId: i, usage: parseFloat(usage.toFixed(1)) };
    });

    // Overall usage from all cores
    const totalDelta = currentCpus.reduce((sum, cpu) => sum + (cpu.times.total - (previousCpuTimes[cpu.coreId]?.total || 0)), 0);
    const idleDelta = currentCpus.reduce((sum, cpu) => sum + (cpu.times.idle - (previousCpuTimes[cpu.coreId]?.idle || 0)), 0);
    const overallUsage = totalDelta > 0 ? Math.min(100, ((totalDelta - idleDelta) / totalDelta) * 100) : 0;

    return {
      usage: parseFloat(overallUsage.toFixed(1)),
      cores: currentCpus.length,
      coreUtilizations: coreUsages.map(c => ({ idle: 0, total: 0, usage: c.usage }))
    };
  }
}

module.exports = { getCpuUtilization };

