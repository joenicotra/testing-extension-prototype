let isRecording = false;
let actionCount = 0;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const openDashboard = document.getElementById('openDashboard');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const actionCountDiv = document.getElementById('actionCount');
const actionNumber = document.getElementById('actionNumber');
const connectionStatus = document.getElementById('connectionStatus');
const connectionText = document.getElementById('connectionText');

async function updateStatus() {
  chrome.runtime.sendMessage({ action: 'GET_RECORDING_STATUS' }, (response) => {
    if (response) {
      isRecording = response.isRecording;
      updateUI();
    }
  });

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(activeTab.id, { action: 'GET_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      connectionStatus.className = 'connection-status disconnected';
      connectionText.textContent = 'Extension not loaded on this page';
    } else if (response) {
      connectionStatus.className = 'connection-status connected';
      connectionText.textContent = 'Connected to page';

      if (response.isRecording) {
        isRecording = true;
        actionCount = response.actionCount || 0;
        updateUI();
      }
    }
  });
}

function updateUI() {
  if (isRecording) {
    statusIndicator.className = 'status-indicator recording';
    statusText.textContent = 'Recording';
    startBtn.disabled = true;
    stopBtn.disabled = false;
    actionCountDiv.style.display = 'block';
    actionNumber.textContent = actionCount;
  } else {
    statusIndicator.className = 'status-indicator';
    statusText.textContent = 'Not Recording';
    startBtn.disabled = false;
    stopBtn.disabled = true;
    actionCountDiv.style.display = 'none';
  }
}

async function checkWebSocketServer() {
  try {
    const response = await fetch('http://localhost:3001/health', {
      method: 'GET',
      mode: 'cors'
    }).catch(() => null);

    if (response && response.ok) {
      connectionStatus.className = 'connection-status connected';
      connectionText.textContent = 'Server connected';
      return true;
    }
  } catch (error) {
    // Server not running
  }

  connectionStatus.className = 'connection-status disconnected';
  connectionText.textContent = 'Server not running (start server first)';
  return false;
}

startBtn.addEventListener('click', async () => {
  const serverRunning = await checkWebSocketServer();
  if (!serverRunning) {
    alert('Please start the WebSocket server first:\ncd server && npm start');
    return;
  }

  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(activeTab.id, { action: 'START_RECORDING' }, (response) => {
    if (chrome.runtime.lastError) {
      alert('Cannot start recording. Please refresh the page and try again.');
    } else {
      isRecording = true;
      actionCount = 0;
      updateUI();
    }
  });
});

stopBtn.addEventListener('click', async () => {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(activeTab.id, { action: 'STOP_RECORDING' }, (response) => {
    if (!chrome.runtime.lastError) {
      isRecording = false;
      updateUI();
    }
  });
});

openDashboard.addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000' });
});

setInterval(() => {
  if (isRecording) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_STATUS' }, (response) => {
          if (response && response.actionCount !== undefined) {
            actionCount = response.actionCount;
            actionNumber.textContent = actionCount;
          }
        });
      }
    });
  }
}, 1000);

updateStatus();
checkWebSocketServer();