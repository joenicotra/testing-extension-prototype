using Microsoft.Playwright;
using NUnit.Framework;
using System;
using System.Threading.Tasks;

namespace TestCapture.Tests
{
    [TestFixture]
    public class BasicTest
    {
        [Test]
        public async Task CanNavigateToLoginPage()
        {
            try
            {
                // Create Playwright instance
                using var playwright = await Playwright.CreateAsync();

                // Launch browser using system Chrome
                await using var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
                {
                    Headless = false,  // Run with UI to see what's happening
                    SlowMo = 100,      // Slow down actions
                    Timeout = 30000,   // 30 second timeout
                    Channel = "chrome", // Use system Chrome
                    ExecutablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
                });

                // Create context and page
                await using var context = await browser.NewContextAsync();
                var page = await context.NewPageAsync();

                Console.WriteLine("Browser launched, navigating to page...");

                // Try to navigate
                var response = await page.GotoAsync("http://localhost:3000/test", new PageGotoOptions
                {
                    WaitUntil = WaitUntilState.NetworkIdle,
                    Timeout = 30000
                });

                Console.WriteLine($"Navigation response status: {response?.Status}");

                // Check if page loaded
                var title = await page.TitleAsync();
                Console.WriteLine($"Page title: {title}");

                // Try to find the login button
                var loginButton = page.Locator("[data-automation-id=\"login-button\"]");
                var isVisible = await loginButton.IsVisibleAsync();
                Console.WriteLine($"Login button visible: {isVisible}");

                Assert.That(isVisible, Is.True, "Login button should be visible");

                // Take a screenshot for debugging
                await page.ScreenshotAsync(new PageScreenshotOptions
                {
                    Path = "test-screenshot.png"
                });
                Console.WriteLine("Screenshot saved to test-screenshot.png");

                await page.CloseAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Test failed with error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }
    }
}