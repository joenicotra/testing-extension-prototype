using Microsoft.Playwright;
using NUnit.Framework;
using System.Threading.Tasks;

namespace TestCapture.Tests
{
    [TestFixture]
    public class LoginFlowTests
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
                SlowMo = 50, // Slow down actions for visibility during debugging
                Channel = "chrome", // Use system Chrome instead of bundled Chromium
                ExecutablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            });
            _context = await _browser.NewContextAsync(new BrowserNewContextOptions
            {
                ViewportSize = new ViewportSize { Width = 1280, Height = 720 }
            });
            _page = await _context.NewPageAsync();
        }

        [Test]
        public async Task LoginAndLogout_WithValidCredentials_ShouldSucceed()
        {
            // Navigate to the test login page
            await _page.GotoAsync("http://localhost:3000/test");

            // Wait for the page to be fully loaded
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);

            // Enter username
            var usernameInput = _page.Locator("[data-automation-id=\"username-input\"]");
            await usernameInput.ClickAsync();
            await usernameInput.FillAsync("testuser");

            // Enter password
            var passwordInput = _page.Locator("[data-automation-id=\"password-input\"]");
            await passwordInput.ClickAsync();
            await passwordInput.FillAsync("password123");

            // Click the login button
            var loginButton = _page.Locator("[data-automation-id=\"login-button\"]");
            await loginButton.ClickAsync();

            // Wait for navigation to dashboard
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);

            // Verify successful login by checking for dashboard elements
            var dashboardTitle = _page.Locator("[data-automation-id=\"dashboard-title\"]");
            Assert.That(await dashboardTitle.IsVisibleAsync(), Is.True, "Dashboard title should be visible");
            Assert.That(await dashboardTitle.TextContentAsync(), Is.EqualTo("Dashboard"));

            // Verify welcome message
            var welcomeMessage = _page.Locator("[data-automation-id=\"welcome-message\"]");
            var welcomeText = await welcomeMessage.TextContentAsync();
            Assert.That(welcomeText, Does.Contain("Welcome, testuser!"));

            // Verify dashboard cards are visible
            var statsCard = _page.Locator("[data-automation-id=\"stats-card\"]");
            Assert.That(await statsCard.IsVisibleAsync(), Is.True, "Stats card should be visible");

            var activityCard = _page.Locator("[data-automation-id=\"activity-card\"]");
            Assert.That(await activityCard.IsVisibleAsync(), Is.True, "Activity card should be visible");

            // Click logout button
            var logoutButton = _page.Locator("[data-automation-id=\"logout-button\"]");
            await logoutButton.ClickAsync();

            // Verify we're back at the login page
            Assert.That(await usernameInput.IsVisibleAsync(), Is.True, "Username input should be visible after logout");
            Assert.That(await loginButton.IsVisibleAsync(), Is.True, "Login button should be visible after logout");

            // Verify the login form is displayed
            var loginTitle = _page.Locator("[data-automation-id=\"login-title\"]");
            Assert.That(await loginTitle.TextContentAsync(), Is.EqualTo("Test Login Page"));
        }

        [Test]
        public async Task Login_WithInvalidCredentials_ShouldShowError()
        {
            // Navigate to the test login page
            await _page.GotoAsync("http://localhost:3000/test");

            // Wait for the page to be fully loaded
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);

            // Enter incorrect username
            var usernameInput = _page.Locator("[data-automation-id=\"username-input\"]");
            await usernameInput.FillAsync("wronguser");

            // Enter incorrect password
            var passwordInput = _page.Locator("[data-automation-id=\"password-input\"]");
            await passwordInput.FillAsync("wrongpassword");

            // Click the login button
            var loginButton = _page.Locator("[data-automation-id=\"login-button\"]");
            await loginButton.ClickAsync();

            // Verify error message is displayed
            var errorMessage = _page.Locator("[data-automation-id=\"error-message\"]");
            Assert.That(await errorMessage.IsVisibleAsync(), Is.True, "Error message should be visible");
            var errorText = await errorMessage.TextContentAsync();
            Assert.That(errorText, Does.Contain("Invalid credentials"));

            // Verify we're still on the login page
            Assert.That(await usernameInput.IsVisibleAsync(), Is.True, "Should remain on login page");
            Assert.That(await loginButton.IsVisibleAsync(), Is.True, "Login button should still be visible");
        }

        [Test]
        public async Task Login_WithEmptyFields_ShouldShowError()
        {
            // Navigate to the test login page
            await _page.GotoAsync("http://localhost:3000/test");

            // Wait for the page to be fully loaded
            await _page.WaitForLoadStateAsync(LoadState.NetworkIdle);

            // Click login without entering credentials
            var loginButton = _page.Locator("[data-automation-id=\"login-button\"]");
            await loginButton.ClickAsync();

            // Verify error message is displayed
            var errorMessage = _page.Locator("[data-automation-id=\"error-message\"]");
            Assert.That(await errorMessage.IsVisibleAsync(), Is.True, "Error message should be visible for empty fields");
            var errorText = await errorMessage.TextContentAsync();
            Assert.That(errorText, Does.Contain("Please enter both username and password"));
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
}