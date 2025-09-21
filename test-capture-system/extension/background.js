let recordingTabId = null;
let isRecording = false;

chrome.runtime.onInstalled.addListener(() => {
  console.log('Test Capture Extension installed');
});

chrome.action.onClicked.addListener(async (tab) => {
  chrome.action.openPopup();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'START_RECORDING_FROM_POPUP':
      startRecording(sender.tab?.id);
      sendResponse({ status: 'started' });
      break;
    case 'STOP_RECORDING_FROM_POPUP':
      stopRecording();
      sendResponse({ status: 'stopped' });
      break;
    case 'GET_RECORDING_STATUS':
      sendResponse({ isRecording, recordingTabId });
      break;
  }
  return true;
});

async function startRecording(tabId) {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    recordingTabId = tabId || activeTab.id;
    isRecording = true;

    chrome.tabs.sendMessage(recordingTabId, { action: 'START_RECORDING' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error starting recording:', chrome.runtime.lastError);
        isRecording = false;
        recordingTabId = null;
      } else {
        console.log('Recording started:', response);
        updateIcon(true);
      }
    });
  } catch (error) {
    console.error('Failed to start recording:', error);
    isRecording = false;
    recordingTabId = null;
  }
}

async function stopRecording() {
  if (!isRecording || !recordingTabId) return;

  try {
    chrome.tabs.sendMessage(recordingTabId, { action: 'STOP_RECORDING' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error stopping recording:', chrome.runtime.lastError);
      } else {
        console.log('Recording stopped:', response);
      }
      isRecording = false;
      recordingTabId = null;
      updateIcon(false);
    });
  } catch (error) {
    console.error('Failed to stop recording:', error);
  }
}

function updateIcon(recording) {
  const iconPath = recording ? {
    "16": "icon16-recording.png",
    "48": "icon48-recording.png",
    "128": "icon128-recording.png"
  } : {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  };

  chrome.action.setIcon({ path: iconPath });
  chrome.action.setBadgeText({ text: recording ? 'REC' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#ff4458' });
}

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === recordingTabId) {
    isRecording = false;
    recordingTabId = null;
    updateIcon(false);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === recordingTabId && changeInfo.status === 'complete') {
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { action: 'START_RECORDING' });
    }, 1000);
  }
});