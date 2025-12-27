
import { config } from './config.js';
import { fetchRealData, processData } from './data-service.js';
import { initCpuChart, initMemoryChart, updateAllCharts, initNetworkChart } from './charts.js';
import { updateAllComponents } from './components.js';

let refreshInterval = null;

// Function to load HTML components
async function loadComponent(componentName) {
  try {
    const response = await fetch(`/components/${componentName}.html`);
    if (!response.ok) {
      throw new Error(`Failed to load ${componentName}: ${response.status}`);
    }
    const html = await response.text();
    return html;
  } catch (error) {
    console.error(`Error loading component ${componentName}:`, error);
    // Fallback to simple placeholder
    return `<div class="card" id="${componentName.replace('-card', '')}-card">
      <div class="card-header">
        <h2 class="card-title">${componentName.replace('-card', '').toUpperCase()}</h2>
      </div>
      <p>Failed to load component</p>
    </div>`;
  }
}

// Initialize charts and load components
async function initializeDashboard() {
  try {

    // Load all components in parallel (add network and docker)
    const [cpuHtml, gpuHtml, memoryHtml, diskHtml, networkHtml, dockerHtml] = await Promise.all([
      loadComponent('cpu-card'),
      loadComponent('gpu-card'),
      loadComponent('memory-card'),
      loadComponent('disk-card'),
      loadComponent('network-card'),
      loadComponent('docker-card')
    ]);

    // Insert components into dashboard
    const dashboardGrid = document.getElementById('dashboard-grid');
    dashboardGrid.innerHTML = cpuHtml + gpuHtml + memoryHtml + diskHtml + networkHtml + dockerHtml;


    // Now initialize the charts
    initCpuChart();
    initMemoryChart();
    if (typeof initNetworkChart === 'function') initNetworkChart();

    // Load initial data
    await updateAllData();

    // Set up auto-refresh if enabled
    if (config.autoRefresh) {
      startAutoRefresh();
    }

    // Set up event listeners
    setupEventListeners();

  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', updateAllData);
  }
  
  const autoRefreshBtn = document.getElementById('auto-refresh-btn');
  if (autoRefreshBtn) {
    autoRefreshBtn.addEventListener('click', toggleAutoRefresh);
  }
}

// Update all data from API
async function updateAllData() {
  // Show loading indicator
  const loadingIndicator = document.getElementById('loading-indicator');
  const refreshText = document.getElementById('refresh-text');
  
  if (loadingIndicator) loadingIndicator.style.display = 'inline-block';
  if (refreshText) refreshText.textContent = 'Loading...';
  
  try {
    const data = await fetchRealData();
    processData(data);
    updateAllCharts();
    updateAllComponents();
  } catch (error) {
    console.error('Error updating data:', error);
  } finally {
    // Hide loading indicator
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (refreshText) refreshText.textContent = 'Refresh Data';
  }
}

// Start auto-refresh
function startAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval = setInterval(updateAllData, config.updateInterval);
}

// Stop auto-refresh
function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// Toggle auto-refresh
function toggleAutoRefresh() {
  config.autoRefresh = !config.autoRefresh;
  const button = document.getElementById('auto-refresh-text');
  if (button) {
    button.textContent = `Auto-Refresh: ${config.autoRefresh ? 'ON' : 'OFF'}`;
  }
  
  if (config.autoRefresh) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

// Initialize the dashboard when page loads
document.addEventListener('DOMContentLoaded', initializeDashboard);

export { initializeDashboard, updateAllData, toggleAutoRefresh };