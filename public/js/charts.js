import { colorScales } from './config.js';
import { getMonitoringData } from './data-service.js';

// Initialize CPU chart
function initCpuChart() {
  const container = document.getElementById('cpu-chart');
  const width = container.clientWidth;
  const height = container.clientHeight;

  const svg = d3.select('#cpu-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
}

// Update CPU chart
function updateCpuChart() {
  const container = document.getElementById('cpu-chart');
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Clear previous chart
  d3.select('#cpu-chart svg').remove();

  const monitoringData = getMonitoringData();
  const cpuData = monitoringData.cpu.current;
  if (!cpuData) return;

  const usage = Math.min(Math.round(cpuData.usage), 100);

  const svg = d3.select('#cpu-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Create a radial progress chart
  const radius = Math.min(width, height) / 2 - 10;
  const centerX = width / 2;
  const centerY = height / 2;

  // Background circle
  svg.append('circle')
    .attr('cx', centerX)
    .attr('cy', centerY)
    .attr('r', radius)
    .attr('fill', 'rgba(255, 255, 255, 0.05)')
    .attr('stroke', 'rgba(255, 255, 255, 0.1)')
    .attr('stroke-width', 2);

  // Progress arc
  const arc = d3.arc()
    .innerRadius(radius - 10)
    .outerRadius(radius)
    .startAngle(0)
    .cornerRadius(5);

  const progressArc = arc.endAngle(2 * Math.PI * (usage / 100));

  svg.append('path')
    .attr('d', progressArc)
    .attr('transform', `translate(${centerX}, ${centerY})`)
    .attr('fill', colorScales.cpu(usage));

  // Percentage text
  svg.append('text')
    .attr('x', centerX)
    .attr('y', centerY)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.3em')
    .attr('fill', '#ffffff')
    .attr('font-size', '2.5rem')
    .attr('font-weight', 'bold')
    .text(`${usage}%`);

  svg.append('text')
    .attr('x', centerX)
    .attr('y', centerY + 30)
    .attr('text-anchor', 'middle')
    .attr('fill', '#a3d5ff')
    .attr('font-size', '0.9rem')
    .text('CPU Usage');
}

// Initialize Memory chart
function initMemoryChart() {
  const container = document.getElementById('memory-chart');
  const width = container.clientWidth;
  const height = container.clientHeight;

  const svg = d3.select('#memory-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height);
}

// Update Memory chart
function updateMemoryChart() {
  const container = document.getElementById('memory-chart');
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Clear previous chart
  d3.select('#memory-chart svg').remove();

  const monitoringData = getMonitoringData();
  const memoryData = monitoringData.memory.current;
  if (!memoryData) return;

  const svg = d3.select('#memory-chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const usedGB = (memoryData.used / 1024).toFixed(1);
  const totalGB = (memoryData.total / 1024).toFixed(1);
  const usagePercentage = memoryData.percentage;

  // Create a bar chart with history
  const history = monitoringData.memory.history;
  if (history.length > 1) {
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const x = d3.scaleTime()
      .domain(d3.extent(history, d => d.timestamp))
      .range([0, chartWidth]);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    const line = d3.line()
      .x(d => x(d.timestamp))
      .y(d => y(d.usage))
      .curve(d3.curveMonotoneX);

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Add X axis
    chart.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%H:%M')))
      .attr('color', 'rgba(255, 255, 255, 0.5)');

    // Add Y axis
    chart.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'))
      .attr('color', 'rgba(255, 255, 255, 0.5)');

    // Add line
    chart.append('path')
      .datum(history)
      .attr('fill', 'none')
      .attr('stroke', colorScales.memory(usagePercentage))
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add area under line
    const area = d3.area()
      .x(d => x(d.timestamp))
      .y0(chartHeight)
      .y1(d => y(d.usage))
      .curve(d3.curveMonotoneX);

    chart.append('path')
      .datum(history)
      .attr('fill', colorScales.memory(usagePercentage))
      .attr('fill-opacity', 0.2)
      .attr('d', area);
  } else {
    // Simple gauge for single data point
    const radius = Math.min(width, height) / 2 - 10;
    const centerX = width / 2;
    const centerY = height / 2;

    // Background circle
    svg.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', radius)
      .attr('fill', 'rgba(255, 255, 255, 0.05)')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)')
      .attr('stroke-width', 2);

    // Progress arc
    const arc = d3.arc()
      .innerRadius(radius - 15)
      .outerRadius(radius)
      .startAngle(0)
      .cornerRadius(5);

    const progressArc = arc.endAngle(2 * Math.PI * (usagePercentage / 100));

    svg.append('path')
      .attr('d', progressArc)
      .attr('transform', `translate(${centerX}, ${centerY})`)
      .attr('fill', colorScales.memory(usagePercentage));

    // Percentage text
    svg.append('text')
      .attr('x', centerX)
      .attr('y', centerY)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', '#ffffff')
      .attr('font-size', '2rem')
      .attr('font-weight', 'bold')
      .text(`${usagePercentage.toFixed(1)}%`);

    svg.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#a3d5ff')
      .attr('font-size', '0.8rem')
      .text(`${usedGB} / ${totalGB} GB`);
  }
}

// Update all charts

function initNetworkChart() {
  const container = document.getElementById('network-chart');
  if (!container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  d3.select('#network-chart').append('svg').attr('width', width).attr('height', height);
}

function updateNetworkChart() {
  const container = document.getElementById('network-chart');
  if (!container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  d3.select('#network-chart svg').remove();
  const monitoringData = getMonitoringData();
  const history = monitoringData.network.history;
  if (!history || history.length === 0) return;

  const svg = d3.select('#network-chart').append('svg').attr('width', width).attr('height', height);
  if (history.length > 1) {
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    const x = d3.scaleTime().domain(d3.extent(history, d => d.timestamp)).range([0, chartWidth]);
    const y = d3.scaleLinear().domain([0, d3.max(history, d => d.totalBandwidth) || 1]).range([chartHeight, 0]);
    const line = d3.line().x(d => x(d.timestamp)).y(d => y(d.totalBandwidth)).curve(d3.curveMonotoneX);
    const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
    chart.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%H:%M:%S')))
      .attr('color', 'rgba(255,255,255,0.5)');
    chart.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', 'rgba(255,255,255,0.5)')
      .call(g => g.append('text')
        .attr('fill', '#4fc3f7')
        .attr('x', -40)
        .attr('y', -10)
        .attr('text-anchor', 'start')
        .attr('font-size', '0.9rem')
        .text('kB/s')
      );
    chart.append('path').datum(history).attr('fill', 'none').attr('stroke', '#4fc3f7').attr('stroke-width', 3).attr('d', line);
    const area = d3.area().x(d => x(d.timestamp)).y0(chartHeight).y1(d => y(d.totalBandwidth)).curve(d3.curveMonotoneX);
    chart.append('path').datum(history).attr('fill', '#4fc3f7').attr('fill-opacity', 0.2).attr('d', area);
  } else {
    // Simple gauge for single data point
    const centerX = width / 2;
    const centerY = height / 2;
    svg.append('text').attr('x', centerX).attr('y', centerY).attr('text-anchor', 'middle').attr('fill', '#4fc3f7').attr('font-size', '1.5rem').text(`${history[0].totalBandwidth} pkts`);
  }
}

function updateAllCharts() {
  updateCpuChart();
  updateMemoryChart();
  updateNetworkChart();
}

export { initCpuChart, initMemoryChart, updateCpuChart, updateMemoryChart, updateAllCharts, initNetworkChart, updateNetworkChart };