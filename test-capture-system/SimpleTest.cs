using Microsoft.Playwright;
using NUnit.Framework;
using System.Threading.Tasks;

namespace TestCapture.Tests
{
    [TestFixture]
    public class SimpleLoginTest
    {
        [Test]
        public async Task SimpleLogin_ShouldWork()
        {
            // Create Playwright instance
            using var playwright = await Playwright.CreateAsync();

            // Launch browser using system Chrome
            await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
            {
                Headless = false,  // Run with UI to see what's happening
                Channel = "chrome", // Use system Chrome
                ExecutablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            });

            // Create a new page
            var page = await browser.NewPageAsync();

            try
            {
                // Navigate to the test login page
                await page.GotoAsync("http://localhost:3000/test");

                // Fill username
                await page.Locator("[data-automation-id=\"username-input\"]").FillAsync("testuser");

                // Fill password
                await page.Locator("[data-automation-id=\"password-input\"]").FillAsync("password123");

                // Click login button
                await page.Locator("[data-automation-id=\"login-button\"]").ClickAsync();

                // Wait a bit for navigation
                await page.WaitForTimeoutAsync(1000);

                // Check if we're logged in by looking for dashboard title
                var dashboardTitle = page.Locator("[data-automation-id=\"dashboard-title\"]");
                Assert.That(await dashboardTitle.IsVisibleAsync(), Is.True, "Should see dashboard after login");

                // Get the text content
                var titleText = await dashboardTitle.TextContentAsync();
                Assert.That(titleText, Is.EqualTo("Dashboard"), "Dashboard title should be correct");

                // Click logout
                await page.Locator("[data-automation-id=\"logout-button\"]").ClickAsync();

                // Wait a bit
                await page.WaitForTimeoutAsync(500);

                // Verify we're back at login
                var loginButton = page.Locator("[data-automation-id=\"login-button\"]");
                Assert.That(await loginButton.IsVisibleAsync(), Is.True, "Should see login button after logout");
            }
            finally
            {
                await page.CloseAsync();
            }
        }
    }
}