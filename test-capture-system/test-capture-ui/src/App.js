import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import RecordingControls from './components/RecordingControls';
import ActionsList from './components/ActionsList';
import VoiceIntentCapture from './components/VoiceIntentCapture';
import TestGeneration from './components/TestGeneration';
import TestLoginPage from './TestLoginPage';
import { WebSocketProvider, useWebSocket } from './contexts/WebSocketContext';

function AppContent() {
  const { session, isConnected, startRecording, stopRecording, getSession, actions } = useWebSocket();
  const [isRecording, setIsRecording] = useState(false);
  const [generatedTest, setGeneratedTest] = useState(null);
  const [testName, setTestName] = useState('');

  const handleStartRecording = () => {
    setTestName(`Test_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '_')}`);
    startRecording();
    setIsRecording(true);
    setGeneratedTest(null);
  };

  const handleStopRecording = () => {
    stopRecording();
    setIsRecording(false);
  };

  const handleGenerateTest = async () => {
    if (!session || session.actions.length === 0) {
      alert('No actions captured. Please record some actions first.');
      return;
    }

    try {
      // Send comprehensive data to MCP for intelligent test generation
      const payload = {
        sessionId: session.id,
        testName: testName,
        actions: session.actions,
        voiceIntents: session.voiceIntents || [],
        metadata: {
          url: session.metadata?.url || 'http://localhost:3000/test',
          timestamp: new Date().toISOString(),
          browser: 'chrome'
        }
      };

      const response = await fetch('http://localhost:3001/generate-test-mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`MCP generation failed: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedTest(data.testCode);
    } catch (error) {
      console.error('Failed to generate test via MCP:', error);
      // Fallback to local generation if MCP fails
      const fallbackTest = generateMockTest(session, testName);
      setGeneratedTest(fallbackTest);
    }
  };

  const generateMockTest = (session, testName) => {
    const actions = session?.actions || [];
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
            await _page.GotoAsync("${session?.metadata?.url || 'http://localhost:3000/test'}");
`;

    actions.forEach(action => {
      const escapedSelector = action.selector ? action.selector.replace(/"/g, '\\"') : '';
      const escapedValue = action.value ? action.value.replace(/"/g, '\\"') : '';
      const escapedText = action.text ? action.text.replace(/"/g, '\\"') : '';

      switch (action.type) {
        case 'click':
          testCode += `
            // Click on ${escapedText || escapedSelector}
            await _page.Locator("${escapedSelector}").ClickAsync();`;
          break;
        case 'input':
          testCode += `
            // Fill input field
            await _page.Locator("${escapedSelector}").FillAsync("${escapedValue}");`;
          break;
        case 'change':
          // Check if this is a select element or text input
          if (escapedSelector.includes('select') || action.elementType === 'select') {
            testCode += `
            // Select/change value
            await _page.Locator("${escapedSelector}").SelectOptionAsync("${escapedValue}");`;
          } else {
            // For text inputs, use FillAsync instead of SelectOptionAsync
            testCode += `
            // Clear and set final value (from change event)
            await _page.Locator("${escapedSelector}").ClearAsync();
            await _page.Locator("${escapedSelector}").FillAsync("${escapedValue}");`;
          }
          break;
        case 'submit':
          testCode += `
            // Submit form
            await _page.Locator("${escapedSelector}").PressAsync("Enter");`;
          break;
      }

      if (!action.hasAutomationId) {
        testCode += ` // WARNING: No data-automation-id found`;
      }
      testCode += '\n';
    });

    // Add assertions based on voice intents
    if (session?.voiceIntents?.length > 0) {
      testCode += `
            // Assertions based on user expectations:`;

      session.voiceIntents.forEach(intent => {
        const intentText = intent.text.toLowerCase();
        testCode += `
            // User expectation: "${intent.text}"`;

        // Generate assertions based on common intent patterns
        if (intentText.includes('logout') || intentText.includes('log out') || intentText.includes('sign out') || intentText.includes('brought back to the login')) {
          testCode += `
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            Assert.That(await _page.Locator("[data-automation-id=\\"login-button\\"]").IsVisibleAsync(), Is.True, "Should see login form after logout");`;
        } else if (intentText.includes('login') || intentText.includes('log in') || intentText.includes('sign in') || intentText.includes('move on to the next page')) {
          testCode += `
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            Assert.That(await _page.Locator("[data-automation-id=\\"dashboard-title\\"]").IsVisibleAsync(), Is.True, "Should see dashboard after successful login");`;
        } else if (intentText.includes('error') || intentText.includes('fail') || intentText.includes('invalid')) {
          testCode += `
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            Assert.That(await _page.Locator(".error-message, [data-automation-id=\\"error-message\\"]").IsVisibleAsync(), Is.True, "Should show error message");`;
        } else if (intentText.includes('success') || intentText.includes('complete') || intentText.includes('submit')) {
          testCode += `
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            Assert.That(await _page.Locator(".success-message, [data-automation-id=\\"success-message\\"]").IsVisibleAsync(), Is.True, "Should show success message");`;
        } else {
          // Generic assertion for other intents
          testCode += `
            // TODO: Add specific assertion for: "${intent.text}"`;
        }
      });
    } else {
      // Add default assertions based on the last action
      const lastAction = actions[actions.length - 1];
      if (lastAction?.type === 'click' && lastAction?.text?.toLowerCase().includes('login')) {
        testCode += `
            // Default assertion: Verify login success
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            Assert.That(await _page.Locator("[data-automation-id=\\"dashboard-title\\"]").IsVisibleAsync(), Is.True, "Should see dashboard after login");`;
      } else if (lastAction?.type === 'click' && lastAction?.text?.toLowerCase().includes('logout')) {
        testCode += `
            // Default assertion: Verify logout success
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            Assert.That(await _page.Locator("[data-automation-id=\\"login-button\\"]").IsVisibleAsync(), Is.True, "Should see login form after logout");`;
      } else if (lastAction?.type === 'submit') {
        testCode += `
            // Default assertion: Verify form submission
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);
            // TODO: Add appropriate assertion based on expected outcome`;
      }
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
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Test Capture System</h1>
          <div className="connection-status">
            {isConnected ? (
              <span className="status connected">Connected</span>
            ) : (
              <span className="status disconnected">Disconnected</span>
            )}
          </div>
        </div>
      </header>

      <div className="app-container">
        <div className="main-content">
          <RecordingControls
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            testName={testName}
            onTestNameChange={setTestName}
          />

          {isConnected && !session && (
            <button
              onClick={getSession}
              className="btn btn-generate"
              style={{ marginBottom: '20px' }}
            >
              Load Previous Session
            </button>
          )}

          {isRecording && (
            <VoiceIntentCapture isRecording={isRecording} />
          )}

          <ActionsList />

          {!isRecording && (session?.actions?.length > 0 || actions?.length > 0) && (
            <TestGeneration
              onGenerateTest={handleGenerateTest}
              generatedTest={generatedTest}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [showTestPage, setShowTestPage] = useState(false);

  const isTestPath = window.location.pathname === '/test';

  if (isTestPath || showTestPage) {
    return <TestLoginPage />;
  }

  return (
    <WebSocketProvider>
      <AppContent />
    </WebSocketProvider>
  );
}

export default App;
