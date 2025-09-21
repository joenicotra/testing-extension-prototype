const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let sessions = new Map();
let activeSession = null;
let connectedClients = new Set();

class RecordingSession {
  constructor(id) {
    this.id = id;
    this.startTime = new Date();
    this.actions = [];
    this.voiceIntents = [];
    this.metadata = {
      url: '',
      title: '',
      userAgent: ''
    };
  }

  addAction(action) {
    this.actions.push({
      ...action,
      sequenceNumber: this.actions.length + 1,
      relativeTime: Date.now() - this.startTime.getTime()
    });
  }

  addVoiceIntent(intent) {
    this.voiceIntents.push({
      ...intent,
      timestamp: new Date(),
      associatedActionIndex: this.actions.length - 1
    });
  }

  getDuration() {
    return Date.now() - this.startTime.getTime();
  }

  toJSON() {
    return {
      id: this.id,
      startTime: this.startTime,
      duration: this.getDuration(),
      actionCount: this.actions.length,
      voiceIntentCount: this.voiceIntents.length,
      actions: this.actions,
      voiceIntents: this.voiceIntents,
      metadata: this.metadata
    };
  }
}

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  connectedClients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (error) {
      console.error('Failed to parse message:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    connectedClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    connectedClients.delete(ws);
  });

  ws.send(JSON.stringify({
    type: 'CONNECTED',
    message: 'Connected to test capture server'
  }));

  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'PING' }));
    }
  }, 30000);
});

function handleMessage(ws, data) {
  console.log('Received message:', data.type);

  switch (data.type) {
    case 'START_RECORDING':
      startRecording(data);
      break;

    case 'STOP_RECORDING':
      stopRecording();
      break;

    case 'ACTION_CAPTURED':
      captureAction(data.action);
      break;

    case 'VOICE_INTENT':
      captureVoiceIntent(data.intent);
      break;

    case 'GET_SESSION':
      sendSessionData(ws);
      break;

    case 'GET_SESSIONS':
      sendAllSessions(ws);
      break;

    case 'RECORDING_STARTED':
      handleRecordingStarted(data);
      break;

    case 'RECORDING_STOPPED':
      handleRecordingStopped(data);
      break;

    case 'PONG':
      break;

    default:
      console.log('Unknown message type:', data.type);
  }
}

function startRecording(data) {
  const sessionId = `session-${Date.now()}`;
  activeSession = new RecordingSession(sessionId);

  if (data.metadata) {
    activeSession.metadata = { ...activeSession.metadata, ...data.metadata };
  }

  sessions.set(sessionId, activeSession);

  broadcast({
    type: 'RECORDING_STARTED',
    sessionId: sessionId,
    startTime: activeSession.startTime
  });

  console.log(`Recording started: ${sessionId}`);
}

function stopRecording() {
  if (!activeSession) {
    console.log('No active recording session');
    return;
  }

  const sessionData = activeSession.toJSON();

  broadcast({
    type: 'RECORDING_STOPPED',
    session: sessionData
  });

  console.log(`Recording stopped: ${activeSession.id}`);
  console.log(`Actions captured: ${activeSession.actions.length}`);
  console.log(`Voice intents: ${activeSession.voiceIntents.length}`);

  activeSession = null;
}

function captureAction(action) {
  if (!activeSession) {
    console.log('No active session, creating new one');
    startRecording({});
  }

  activeSession.addAction(action);

  broadcast({
    type: 'ACTION_CAPTURED',
    action: action,
    totalActions: activeSession.actions.length
  });

  console.log(`Action captured: ${action.type} on ${action.selector}`);
}

function captureVoiceIntent(intent) {
  if (!activeSession) {
    console.log('No active session for voice intent');
    return;
  }

  activeSession.addVoiceIntent(intent);

  broadcast({
    type: 'VOICE_INTENT_CAPTURED',
    intent: intent,
    totalIntents: activeSession.voiceIntents.length
  });

  console.log(`Voice intent captured: "${intent.text}"`);
}

function handleRecordingStarted(data) {
  if (!activeSession) {
    startRecording(data);
  }

  if (data.url) {
    activeSession.metadata.url = data.url;
  }
}

function handleRecordingStopped(data) {
  console.log(`Extension reported recording stopped: ${data.actionCount} actions`);
}

function sendSessionData(ws) {
  if (!activeSession) {
    ws.send(JSON.stringify({
      type: 'SESSION_DATA',
      session: null
    }));
    return;
  }

  ws.send(JSON.stringify({
    type: 'SESSION_DATA',
    session: activeSession.toJSON()
  }));
}

function sendAllSessions(ws) {
  const allSessions = Array.from(sessions.values()).map(s => s.toJSON());

  ws.send(JSON.stringify({
    type: 'ALL_SESSIONS',
    sessions: allSessions
  }));
}

function broadcast(data) {
  const message = JSON.stringify(data);
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeSession: activeSession ? activeSession.id : null,
    connectedClients: connectedClients.size,
    totalSessions: sessions.size
  });
});

app.get('/session', (req, res) => {
  if (!activeSession) {
    res.json({ session: null });
    return;
  }
  res.json({ session: activeSession.toJSON() });
});

app.get('/sessions', (req, res) => {
  const allSessions = Array.from(sessions.values()).map(s => s.toJSON());
  res.json({ sessions: allSessions });
});

app.post('/generate-test', async (req, res) => {
  const { sessionId } = req.body;
  const session = sessions.get(sessionId) || activeSession;

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  res.json({
    message: 'Test generation endpoint ready',
    session: session.toJSON()
  });
});

app.post('/generate-test-mcp', async (req, res) => {
  const { sessionId, testName, actions, voiceIntents, metadata } = req.body;

  try {
    console.log('MCP Test Generation Request:', {
      sessionId,
      testName,
      actionCount: actions?.length || 0,
      voiceIntentCount: voiceIntents?.length || 0
    });

    // Call Claude Code via MCP for intelligent test generation
    const testCode = await generateTestWithMCP({
      sessionId,
      testName,
      actions,
      voiceIntents,
      metadata
    });

    res.json({
      success: true,
      testCode: testCode,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP test generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test generation failed',
      details: error.message
    });
  }
});

async function generateTestWithMCP(payload) {
  // Format the data for Claude Code MCP
  const prompt = `
Generate a comprehensive C# Playwright test based on the following captured user interactions:

**Test Name:** ${payload.testName}
**Target URL:** ${payload.metadata?.url || 'http://localhost:3000/test'}

**Captured Actions:**
${payload.actions.map((action, index) =>
  `${index + 1}. ${action.type.toUpperCase()}: ${action.selector} ${action.value ? `(value: "${action.value}")` : ''} ${action.text ? `(text: "${action.text}")` : ''}`
).join('\n')}

**Voice Intents (User Expectations):**
${payload.voiceIntents?.map((intent, index) =>
  `${index + 1}. "${intent.text}"`
).join('\n') || 'None captured'}

**Requirements:**
1. Use the WORKING-TEMPLATE.cs as the base structure
2. Generate intelligent assertions based on voice intents and action flow
3. Use proper data-automation-id selectors
4. Include wait strategies for stability
5. Handle the login/logout flow correctly
6. Add meaningful comments explaining test steps
7. Ensure the test is ready-to-run without modifications

Please generate a complete, executable C# Playwright test that captures the user's intent and validates the expected behavior.
`;

  // For now, return a structured response
  // In a real MCP integration, this would call Claude Code
  return generateMockTestWithIntelligence(payload, prompt);
}

function generateMockTestWithIntelligence(payload, prompt) {
  const { testName, actions, voiceIntents, metadata } = payload;

  // Enhanced generation logic with better intelligence
  let testCode = `using Microsoft.Playwright;
using NUnit.Framework;
using System.Threading.Tasks;

namespace TestCapture.Tests
{
    [TestFixture]
    public class ${testName}
    {
        private IPlaywright _playwright;
        private IBrowser _browser;
        private IBrowserContext _context;
        private IPage _page;

        [SetUp]
        public async Task Setup()
        {
            _playwright = await Playwright.CreateAsync();
            _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
            {
                Headless = false,
                SlowMo = 50,
                Channel = "chrome",
                ExecutablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            });
            _context = await _browser.NewContextAsync(new BrowserNewContextOptions
            {
                ViewportSize = new ViewportSize { Width = 1280, Height = 720 }
            });
            _page = await _context.NewPageAsync();
        }

        [Test]
        public async Task ${testName}_Flow()
        {
            // Navigate to the application
            await _page.GotoAsync("${metadata?.url || 'http://localhost:3000/test'}");
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
`;

  // Group and deduplicate actions intelligently
  const intelligentActions = deduplicateActions(actions);

  intelligentActions.forEach(action => {
    const escapedSelector = action.selector ? action.selector.replace(/"/g, '\\"') : '';
    const escapedValue = action.value ? action.value.replace(/"/g, '\\"') : '';

    switch (action.type) {
      case 'click':
        testCode += `
            // Click: ${action.text || action.selector}
            await _page.Locator("${escapedSelector}").ClickAsync();`;
        break;
      case 'input':
      case 'change':
        testCode += `
            // Fill input: ${escapedSelector}
            await _page.Locator("${escapedSelector}").FillAsync("${escapedValue}");`;
        break;
      case 'submit':
        // Skip form submissions that don't have proper selectors
        if (escapedSelector.includes('data-automation-id')) {
          testCode += `
            // Submit form
            await _page.Locator("${escapedSelector}").ClickAsync();`;
        }
        break;
    }
  });

  // Add intelligent assertions based on voice intents
  if (voiceIntents?.length > 0) {
    testCode += `

            // Assertions based on user expectations:`;

    voiceIntents.forEach(intent => {
      const intentText = intent.text.toLowerCase();
      testCode += `
            // User expectation: "${intent.text}"`;

      if (intentText.includes('logout') || intentText.includes('brought back to the login')) {
        testCode += `
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            Assert.That(await _page.Locator("[data-automation-id=\\"login-button\\"]").IsVisibleAsync(), Is.True, "Should see login form after logout");`;
      } else if (intentText.includes('login') || intentText.includes('move on to the next page')) {
        testCode += `
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            Assert.That(await _page.Locator("[data-automation-id=\\"dashboard-title\\"]").IsVisibleAsync(), Is.True, "Should see dashboard after successful login");`;
      }
    });
  }

  testCode += `
        }

        [TearDown]
        public async Task Teardown()
        {
            if (_page != null)
            {
                await _page.CloseAsync();
            }

            if (_context != null)
            {
                await _context.CloseAsync();
            }

            if (_browser != null)
            {
                await _browser.CloseAsync();
            }

            if (_playwright != null)
            {
                _playwright.Dispose();
            }
        }
    }
}`;

  return testCode;
}

function deduplicateActions(actions) {
  if (!actions || actions.length === 0) return [];

  // Remove consecutive duplicate input actions (typing character by character)
  const deduplicated = [];
  let lastAction = null;

  for (const action of actions) {
    if (action.type === 'input' && lastAction?.type === 'input' &&
        action.selector === lastAction.selector) {
      // Skip intermediate typing, keep only the final value
      continue;
    }

    // Skip form submissions that don't have data-automation-id
    if (action.type === 'submit' && !action.selector?.includes('data-automation-id')) {
      continue;
    }

    deduplicated.push(action);
    lastAction = action;
  }

  return deduplicated;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
  console.log(`HTTP health check on http://localhost:${PORT}/health`);
  console.log('\nWaiting for connections...');
});