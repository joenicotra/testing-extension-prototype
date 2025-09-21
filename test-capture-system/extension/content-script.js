let isRecording = false;
let wsConnection = null;
let recordingIndicator = null;
let actionSequence = [];

function connectWebSocket() {
  if (wsConnection?.readyState === WebSocket.OPEN) return;

  try {
    wsConnection = new WebSocket('ws://localhost:3001');

    wsConnection.onopen = () => {
      console.log('WebSocket connected to test capture server');
    };

    wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    };

    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsConnection.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(connectWebSocket, 3000);
    };
  } catch (error) {
    console.error('Failed to connect WebSocket:', error);
    setTimeout(connectWebSocket, 3000);
  }
}

function handleServerMessage(data) {
  switch (data.type) {
    case 'START_RECORDING':
      startRecording();
      break;
    case 'STOP_RECORDING':
      stopRecording();
      break;
    case 'PING':
      sendMessage({ type: 'PONG' });
      break;
  }
}

function sendMessage(data) {
  if (wsConnection?.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify({
      ...data,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }));
  }
}

function generateSelector(element) {
  const selectors = [];

  if (element.dataset?.automationId) {
    selectors.push({
      type: 'data-automation-id',
      value: `[data-automation-id="${element.dataset.automationId}"]`,
      priority: 1
    });
  }

  if (element.id) {
    selectors.push({
      type: 'id',
      value: `#${element.id}`,
      priority: 2
    });
  }

  if (element.getAttribute('aria-label')) {
    selectors.push({
      type: 'aria-label',
      value: `[aria-label="${element.getAttribute('aria-label')}"]`,
      priority: 3
    });
  }

  if (element.name) {
    selectors.push({
      type: 'name',
      value: `[name="${element.name}"]`,
      priority: 4
    });
  }

  if (element.textContent?.trim() && element.tagName === 'BUTTON') {
    selectors.push({
      type: 'text',
      value: `text="${element.textContent.trim()}"`,
      priority: 5
    });
  }

  if (element.placeholder) {
    selectors.push({
      type: 'placeholder',
      value: `[placeholder="${element.placeholder}"]`,
      priority: 6
    });
  }

  const classSelector = element.className ?
    `.${element.className.split(' ').filter(c => c && !c.includes('active')).join('.')}` : null;
  if (classSelector && classSelector !== '.') {
    selectors.push({
      type: 'class',
      value: classSelector,
      priority: 7
    });
  }

  selectors.push({
    type: 'xpath',
    value: getXPath(element),
    priority: 10
  });

  selectors.sort((a, b) => a.priority - b.priority);

  return {
    primary: selectors[0]?.value || '',
    alternatives: selectors.map(s => s.value),
    hasAutomationId: !!element.dataset?.automationId
  };
}

function getXPath(element) {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const parts = [];
  while (element && element.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling = element.previousSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }
    const tagName = element.nodeName.toLowerCase();
    const xpathIndex = index > 0 ? `[${index + 1}]` : '';
    parts.unshift(`${tagName}${xpathIndex}`);
    element = element.parentNode;
  }
  return parts.length ? `//${parts.join('/')}` : '';
}

function captureAction(event, actionType) {
  if (!isRecording) return;

  const element = event.target;
  const selector = generateSelector(element);

  const action = {
    type: actionType,
    selector: selector.primary,
    alternativeSelectors: selector.alternatives,
    hasAutomationId: selector.hasAutomationId,
    tagName: element.tagName,
    elementType: element.type || '',
    value: element.value || '',
    text: element.textContent?.trim() || '',
    placeholder: element.placeholder || '',
    ariaLabel: element.getAttribute('aria-label') || '',
    url: window.location.href,
    timestamp: new Date().toISOString(),
    viewportSize: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };

  if (actionType === 'click') {
    action.position = {
      x: event.clientX,
      y: event.clientY
    };
  }

  if (actionType === 'input') {
    action.inputType = element.type;
    action.value = element.value;
  }

  actionSequence.push(action);
  sendMessage({
    type: 'ACTION_CAPTURED',
    action
  });

  if (!selector.hasAutomationId) {
    highlightMissingAutomationId(element);
  }
}

function highlightMissingAutomationId(element) {
  const originalBorder = element.style.border;
  element.style.border = '2px dashed orange';
  setTimeout(() => {
    element.style.border = originalBorder;
  }, 1000);
}

function createRecordingIndicator() {
  if (recordingIndicator) return;

  recordingIndicator = document.createElement('div');
  recordingIndicator.id = 'test-capture-indicator';
  recordingIndicator.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ff4458 0%, #ff6b6b 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 999999;
      box-shadow: 0 4px 15px rgba(255, 68, 88, 0.3);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: pulse 2s infinite;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
        animation: blink 1s infinite;
      "></div>
      Recording Test Actions
    </div>
    <style>
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    </style>
  `;
  document.body.appendChild(recordingIndicator);
}

function removeRecordingIndicator() {
  if (recordingIndicator) {
    recordingIndicator.remove();
    recordingIndicator = null;
  }
}

function startRecording() {
  isRecording = true;
  actionSequence = [];
  createRecordingIndicator();

  document.addEventListener('click', handleClick, true);
  document.addEventListener('input', handleInput, true);
  document.addEventListener('change', handleChange, true);
  document.addEventListener('submit', handleSubmit, true);

  sendMessage({
    type: 'RECORDING_STARTED',
    url: window.location.href
  });
}

function stopRecording() {
  isRecording = false;
  removeRecordingIndicator();

  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('input', handleInput, true);
  document.removeEventListener('change', handleChange, true);
  document.removeEventListener('submit', handleSubmit, true);

  sendMessage({
    type: 'RECORDING_STOPPED',
    actionCount: actionSequence.length
  });
}

function handleClick(event) {
  captureAction(event, 'click');
}

function handleInput(event) {
  captureAction(event, 'input');
}

function handleChange(event) {
  captureAction(event, 'change');
}

function handleSubmit(event) {
  captureAction(event, 'submit');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'START_RECORDING':
      startRecording();
      sendResponse({ status: 'started' });
      break;
    case 'STOP_RECORDING':
      stopRecording();
      sendResponse({ status: 'stopped' });
      break;
    case 'GET_STATUS':
      sendResponse({ isRecording, actionCount: actionSequence.length });
      break;
  }
  return true;
});

connectWebSocket();

console.log('Test Capture content script loaded');