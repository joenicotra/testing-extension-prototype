import React, { useState } from 'react';
import './TestLoginPage.css';

const TestLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (username === 'testuser' && password === 'password123') {
      setIsLoggedIn(true);
    } else if (username && password) {
      setError('Invalid credentials. Try username: testuser, password: password123');
    } else {
      setError('Please enter both username and password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setError('');
  };

  if (isLoggedIn) {
    return (
      <div className="dashboard">
        <div className="dashboard-content">
          <h1 data-automation-id="dashboard-title">Dashboard</h1>
          <p data-automation-id="welcome-message">Welcome, {username}!</p>
          <div className="dashboard-cards">
            <div className="card" data-automation-id="stats-card">
              <h3>Statistics</h3>
              <p>Total Users: 1,234</p>
              <p>Active Sessions: 89</p>
            </div>
            <div className="card" data-automation-id="activity-card">
              <h3>Recent Activity</h3>
              <ul>
                <li>Login successful</li>
                <li>Profile updated</li>
                <li>Settings changed</li>
              </ul>
            </div>
          </div>
          <button
            data-automation-id="logout-button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 data-automation-id="login-title">Test Login Page</h2>

          {error && (
            <div className="error-message" data-automation-id="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              data-automation-id="username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-label="Username input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              data-automation-id="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password input"
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            data-automation-id="login-button"
            aria-label="Login button"
          >
            Login
          </button>

          <div className="hint">
            <p>Test credentials:</p>
            <p><strong>Username:</strong> testuser</p>
            <p><strong>Password:</strong> password123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestLoginPage;