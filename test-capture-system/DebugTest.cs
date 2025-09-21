using Microsoft.Playwright;
using NUnit.Framework;
using System;
using System.Threading.Tasks;

namespace TestCapture.Tests
{
    [TestFixture]
    public class DebugTest
    {
        [Test]
        public async Task JustLaunchBrowser()
        {
            try
            {
                Console.WriteLine("Starting browser launch test...");

                // Set environment variables for debugging
                Environment.SetEnvironmentVariable("PWDEBUG", "1");
                Environment.SetEnvironmentVariable("DEBUG", "pw:*");

                using var playwright = await Playwright.CreateAsync();
                Console.WriteLine("Playwright created successfully");

                var browser = await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
                {
                    Headless = true,
                    Timeout = 60000  // 60 second timeout
                });
                Console.WriteLine("Browser launched successfully");

                var page = await browser.NewPageAsync();
                Console.WriteLine("Page created successfully");

                await page.GotoAsync("https://www.google.com");
                Console.WriteLine("Navigation successful");

                var title = await page.TitleAsync();
                Console.WriteLine($"Page title: {title}");

                await page.CloseAsync();
                await browser.CloseAsync();

                Console.WriteLine("Test completed successfully!");
                Assert.Pass("Browser launch test passed");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }
    }
}