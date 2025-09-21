# Running the C# Playwright Tests

## Prerequisites

1. Install .NET SDK 8.0 or later:
   ```bash
   # Check if .NET is installed
   dotnet --version
   ```

2. Install Playwright browsers:
   ```bash
   # Install the Playwright CLI
   dotnet tool install --global Microsoft.Playwright.CLI

   # Install browsers
   playwright install chromium
   ```

## Setup Test Project

1. Navigate to the test-capture-system directory:
   ```bash
   cd test-capture-system
   ```

2. Restore NuGet packages:
   ```bash
   dotnet restore
   ```

3. Build the test project:
   ```bash
   dotnet build
   ```

## Running Tests

### Prerequisites for Tests
1. Start the React application:
   ```bash
   cd test-capture-ui
   npm start
   ```
   The app should be running at `http://localhost:3000`

2. Ensure the test login page is accessible at `http://localhost:3000/test`

### Execute Tests

Run all tests:
```bash
dotnet test
```

Run tests with detailed output:
```bash
dotnet test --logger "console;verbosity=detailed"
```

Run a specific test:
```bash
dotnet test --filter "FullyQualifiedName~LoginAndLogout_WithValidCredentials_ShouldSucceed"
```

Run tests in headed mode (see browser):
```bash
PWDEBUG=1 dotnet test
```

## Test Description

The test file `TestCaptureLoginTest.cs` includes three test scenarios:

1. **LoginAndLogout_WithValidCredentials_ShouldSucceed**
   - Navigates to the login page
   - Enters valid credentials (testuser/password123)
   - Verifies successful login by checking dashboard elements
   - Logs out and verifies return to login page

2. **Login_WithInvalidCredentials_ShouldShowError**
   - Attempts login with incorrect credentials
   - Verifies error message is displayed
   - Confirms user remains on login page

3. **Login_WithEmptyFields_ShouldShowError**
   - Attempts login without entering credentials
   - Verifies appropriate error message
   - Confirms validation is working

## Key Improvements Made

1. **Fixed Syntax Errors**: Corrected the quote escaping issues in selectors
2. **Removed Redundant Actions**: Consolidated multiple character-by-character input actions into single `FillAsync` calls
3. **Added Proper Class Name**: Fixed the missing class name issue
4. **Added Assertions**: Included proper test assertions using Playwright's `Expect` API
5. **Improved Structure**: Added multiple test scenarios for better coverage
6. **Better Resource Management**: Improved cleanup in TearDown method
7. **Added Wait Strategies**: Included proper wait conditions for page loads
8. **Added ViewportSize**: Set consistent viewport for reliable testing

## Debugging Tests

If tests fail, you can debug using:

1. **Run in headed mode** to see the browser:
   ```bash
   HEADED=1 dotnet test
   ```

2. **Use Playwright Inspector**:
   ```bash
   PWDEBUG=1 dotnet test
   ```

3. **Add screenshots on failure**: The test can be modified to capture screenshots when assertions fail.

## Troubleshooting

- **Port conflicts**: Ensure React app is running on port 3000
- **Browser issues**: Run `playwright install chromium` if browser is not found
- **Timeout issues**: Increase timeout values in test if pages load slowly
- **Element not found**: Check that data-automation-id attributes match between test and application