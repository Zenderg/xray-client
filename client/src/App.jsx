import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  let ws;

  function connectWebSocket() {
      ws = new WebSocket(`ws://${window.location.host}`);
      ws.onopen = () => {
          console.log('WebSocket connected');
      };
      ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'progress') {
              updateProgressBar(data.progress);
          }

          if (data.type === 'xrayStatus') {
              updateXrayStatus(data.status);
          }
      };
      ws.onerror = (error) => {
          console.error('WebSocket error:', error);
      };
      ws.onclose = () => {
          console.log('WebSocket disconnected. Trying to reconnect...');
          setTimeout(connectWebSocket, 5000);
      };
  }

  function updateProgressBar(progress) {
      const progressBar = document.getElementById('progress-bar');
      const progressBarFill = document.getElementById('progress-bar-fill');
      progressBar.style.display = 'block';
      progressBarFill.style.width = `${progress}%`;
      progressBarFill.textContent = `${progress}%`;
  }

  async function saveDomains() {
      const domainsText = document.getElementById('domains').value;
      const domains = domainsText.split('\n').filter(domain => domain.trim());

      const response = await fetch('/domains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domains })
      });

      const result = await response.json();
      alert(result.message);
  }

  async function loadDomains() {
      const response = await fetch('/domains');
      const domains = await response.json();
      document.getElementById('domains').value = domains.join('\n');
  }

  async function lookup(useCache) {
      const domainsText = document.getElementById('domains').value;
      const domains = domainsText.split('\n').filter(domain => domain.trim());

      updateProgressBar(0);

      const response = await fetch('/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domains, useCache })
      });

      const cidrs = await response.json();
      displayResults(cidrs);
      updateProgressBar(100);
  }

  async function clearCache() {
      const response = await fetch('/clear-cache', { method: 'POST' });
      const result = await response.json();
      alert(result.message);
  }

  function displayResults(cidrs) {
      const resultsDiv = document.getElementById('results');
      resultsDiv.innerHTML = cidrs.map(cidr => `<div>${cidr}</div>`).join('');
  }

  async function loadVpnConfig() {
      const response = await fetch('/vpn-config');
      const config = await response.json();
      document.getElementById('vpn-config').value = Object.keys(config).length > 0 
          ? JSON.stringify(config, null, 2)
          : '{\n  "inbounds": [],\n  "outbounds": []\n}';
  }

  async function saveVpnConfig() {
      const config = JSON.parse(document.getElementById('vpn-config').value);
      const response = await fetch('/vpn-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
      });
      const result = await response.json();
      alert(result.message);
  }

  async function startVpn() {
      const response = await fetch('/start-vpn', { method: 'POST' });
      const result = await response.json();
      alert(result.message);
  }

  async function stopVpn() {
      const response = await fetch('/stop-vpn', { method: 'POST' });
      const result = await response.json();
      alert(result.message);
  }

  async function restartVpn() {
      const response = await fetch('/restart-vpn', { method: 'POST' });
      const result = await response.json();
      alert(result.message);
  }

  function updateXrayStatus(status) {
      const statusElement = document.getElementById('xray-status');
      statusElement.textContent = status;
      statusElement.className = `status-${status}`;
  }

  async function getInitialXrayStatus() {
      const response = await fetch('/xray-status');
      const data = await response.json();
      updateXrayStatus(data.status);
  }

  window.addEventListener('load', () => {
      connectWebSocket();

      loadDomains();
      getInitialXrayStatus();
      loadVpnConfig();
  });

  return (
    <>
    <div className="container">
        <div className="input-section">
            <textarea id="domains" placeholder="Enter domains, one per line"></textarea>
            <div>
                <button onClick={saveDomains()}>Save Domains</button>
                <button onClick={loadDomains()}>Load Domains</button>
                <button onClick={lookup(true)}>Lookup (Use Cache)</button>
                <button onClick={lookup(false)}>Lookup (No Cache)</button>
                <button onClick={clearCache()}>Clear Cache</button>
            </div>
            <div id="progress-bar" style="display: none;">
                <span id="progress-bar-fill" style="width: 0%;"></span>
            </div>
        </div>
        <div className="results-section">
            <div id="results"></div>
        </div>

        <div className="vpn-section">
            <h2>VPN Configuration</h2>
            <div>
                <span>Xray Status: </span>
                <span id="xray-status">Unknown</span>
            </div>
            <textarea id="vpn-config"></textarea>
            <div className="vpn-controls">
                <button onClick={saveVpnConfig()}>Save VPN Config</button>
                <button onClick={startVpn()}>Start VPN</button>
                <button onClick={stopVpn()}>Stop VPN</button>
                <button onClick={restartVpn()}>Restart VPN</button>
            </div>
        </div>
    </div>
    </>
  )
}

export default App
