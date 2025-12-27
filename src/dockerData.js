// src/dockerData.js
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Helper function to parse Docker ps output
function parseDockerPs(output) {
  if (!output || !output.trim()) {
    return [];
  }

  const lines = output.trim().split('\n');
  // Skip header line
  const containerLines = lines.slice(1);

  return containerLines.map(line => {
    // Remove extra whitespace
    line = line.trim();

    if (!line) return null;

    // Try standard tab-separated parsing first
    let parts = line.split(/\t+/).filter(part => part.trim() !== '');

    // If we don't have enough parts using tabs, try a more robust approach
    if (parts.length < 4) {
      // For complex cases where the splitting fails, let's use a safer method:
      // First, split by whitespace to get all words
      const words = line.trim().split(/\s+/).filter(Boolean);

      if (words.length >= 4) {
        // Extract container ID (first word)
        const id = words[0];
        // Extract name (second word)
        const name = words[1] || '<unnamed>';
        // Extract image (third word)
        const image = words[2] || 'unknown';

        // Handle the remaining words as status and ports
        let status = 'unknown';
        let portsPart = '-';

        if (words.length >= 5) {
          // Join all parts from index 3 onwards to form the status
          // The last part is likely ports, others are status
          const lastWord = words[words.length - 1];

          // Check if last word looks like port information
          if (lastWord.includes(':') || lastWord.includes('/') || lastWord === '-' ||
              (lastWord.match(/^\d+$/) && words.length > 5)) {
            // Last part is ports
            portsPart = lastWord;
            // Status is everything before the last part (but not including it)
            status = words.slice(3, -1).join(' ') || 'unknown';
          } else {
            // Join all words from index 3 to end for status
            status = words.slice(3).join(' ') || 'unknown';
          }
        } else if (words.length === 4) {
          // Only 4 parts: status is the fourth part
          status = words[3] || 'unknown';
        }

        // Extract short ID (first 12 characters)
        const shortId = id.substring(0, 12);

        return {
          id: shortId,
          name: name,
          image: image,
          status: status,
          ports: portsPart && portsPart !== '-' ? portsPart.split(',').map(p => p.trim()) : []
        };
      }

      return null;
    }

    // Standard approach with tab-separated parts
    const [id, name, image, status, ports] = parts;

    // Extract short ID (first 12 characters)
    const shortId = id.substring(0, 12);

    return {
      id: shortId,
      name: name || '<unnamed>',
      image: image || 'unknown',
      status: status || 'unknown',
      ports: ports && ports !== '-' ? ports.split(',').map(p => p.trim()) : []
    };
  }).filter(Boolean);
}

// Helper function to get Docker containers
async function getDockerContainers() {
  try {
    // Get running containers using docker ps with table format
    const { stdout, stderr } = await execPromise(
      'docker ps --format "table {{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"'
    );

    if (stderr) {
      console.error('Error running docker ps:', stderr);
      throw new Error(`Failed to fetch Docker containers: ${stderr}`);
    }

    // Parse the output
    const containers = parseDockerPs(stdout);

    return containers;
  } catch (error) {
    console.error('Error fetching Docker containers:', error);
    // Return empty array on error, following existing patterns
    return [];
  }
}

module.exports = { getDockerContainers, parseDockerPs };