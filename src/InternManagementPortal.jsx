// InternManagementPortal-FINAL-FIXED.jsx
// COMPLETE FIX: Input focus issue + Dashboard redirect working

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Colors (module-level so it never changes identity and can be shared by
// the standalone input components below).
// Professional light theme: white surfaces, soft neutral page background,
// near-black text, and a set of vivid accent colors used for tabs/badges —
// inspired by Vercel/Netlify style dashboards.
const colors = {
  primary: '#6366f1',      // indigo — primary actions / Dashboard accent
  danger: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  background: '#f7f8fa',   // page background (soft off-white)
  surface: '#ffffff',      // card/header background
  border: '#e5e7eb',
  text: '#0f172a',
  textMuted: '#64748b',
  // Section accent colors (colorful tabs/cards, like Vercel/Netlify dashboards)
  accentInterns: '#8b5cf6',     // violet
  accentTasks: '#f59e0b',       // amber
  accentAttendance: '#10b981',  // emerald
  accentInfo: '#3b82f6'         // blue
};

// Status -> color map used for attendance badges & charts
const ATTENDANCE_COLORS = {
  present: '#10b981',
  absent: '#ef4444',
  late: '#f59e0b',
  leave: '#3b82f6'
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', color: colors.primary },
  { key: 'interns', label: 'Interns', color: colors.accentInterns },
  { key: 'tasks', label: 'Tasks', color: colors.accentTasks },
  { key: 'attendance', label: 'Attendance', color: colors.accentAttendance }
];

// Injects global font + hover/focus styles once. Kept outside the React
// render tree (added to <head>) so it doesn't require restructuring every
// page's JSX, and applies consistently across the whole app.
const injectGlobalStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('ip-global-styles')) return;
  const styleEl = document.createElement('style');
  styleEl.id = 'ip-global-styles';
  styleEl.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    .ip-root, .ip-root * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .ip-btn { transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease; }
    .ip-btn:hover { transform: translateY(-1px); filter: brightness(1.06); }
    .ip-btn:active { transform: translateY(0); filter: brightness(0.97); }
    .ip-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
    .ip-card:hover { box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08); }
    .ip-tab { transition: background-color 0.12s ease, color 0.12s ease; }
    .ip-tab:hover { background-color: #f1f5f9; }
    .ip-input:focus, .ip-select:focus, .ip-textarea:focus { outline: none !important; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important; }
  `;
  document.head.appendChild(styleEl);
};

// ============================================================================
// UI COMPONENTS
// ============================================================================
// IMPORTANT: These must be declared OUTSIDE the main component. Previously
// they were defined inside InternManagementPortal, which meant React treated
// them as brand-new component types on every re-render, unmounting and
// remounting the actual <input>/<textarea>/<select> DOM nodes after every
// keystroke. That's what caused inputs to lose focus after a single letter.

const TextInput = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="ip-input"
    style={{
      width: '100%',
      padding: '11px 14px',
      borderRadius: '10px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.surface,
      color: colors.text,
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      fontSize: '14px'
    }}
  />
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className="ip-textarea"
    style={{
      width: '100%',
      padding: '11px 14px',
      borderRadius: '10px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.surface,
      color: colors.text,
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      fontSize: '14px'
    }}
  />
);

const SelectInput = ({ value, onChange, children }) => (
  <select
    value={value}
    onChange={onChange}
    className="ip-select"
    style={{
      width: '100%',
      padding: '11px 14px',
      borderRadius: '10px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.surface,
      color: colors.text,
      boxSizing: 'border-box',
      fontFamily: 'inherit',
      fontSize: '14px'
    }}
  >
    {children}
  </select>
);

const Button = ({ label, onClick, disabled = false, variant = 'primary' }) => {
  const bg = variant === 'danger' ? colors.danger
    : variant === 'success' ? colors.success
    : colors.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="ip-btn"
      style={{
        padding: '10px 20px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: bg,
        color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: '600',
        opacity: disabled ? 0.6 : 1,
        boxShadow: `0 1px 2px rgba(15, 23, 42, 0.08)`
      }}
    >
      {label}
    </button>
  );
};

// Shared top header bar — used by Dashboard / Interns / Tasks / Attendance pages
const PageHeader = ({ currentUser, onLogout }) => (
  <div style={{
    padding: '20px 40px',
    backgroundColor: colors.surface,
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '34px',
        height: '34px',
        borderRadius: '9px',
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.accentInterns})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: '800',
        fontSize: '15px'
      }}>
        IP
      </div>
      <h1 style={{ margin: 0, color: colors.text, fontSize: '20px', fontWeight: '700' }}>Intern Portal</h1>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      {currentUser?.name && (
        <span style={{ color: colors.textMuted, fontSize: '14px' }}>
          Welcome, <strong style={{ color: colors.text }}>{currentUser.name}</strong>
        </span>
      )}
      <button
        onClick={onLogout}
        className="ip-btn"
        style={{
          padding: '8px 16px',
          borderRadius: '10px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
          color: colors.danger,
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  </div>
);

// Shared navigation tab bar — each tab carries its own accent color
const PageNav = ({ currentPage, setCurrentPage }) => (
  <div style={{
    padding: '14px 40px',
    backgroundColor: colors.surface,
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    gap: '8px'
  }}>
    {NAV_ITEMS.map(item => {
      const isActive = currentPage === item.key;
      return (
        <button
          key={item.key}
          onClick={() => setCurrentPage(item.key)}
          className="ip-tab"
          style={{
            padding: '9px 18px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: isActive ? item.color : 'transparent',
            color: isActive ? '#fff' : colors.textMuted,
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);

const InternManagementPortal = () => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Interns State
  const [interns, setInterns] = useState([]);
  const [newInternName, setNewInternName] = useState('');
  const [newInternEmail, setNewInternEmail] = useState('');
  const [newInternDept, setNewInternDept] = useState('');
  const [newInternDate, setNewInternDate] = useState('');

  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [newTaskIntern, setNewTaskIntern] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState('pending');

  // Attendance State
  const [attendance, setAttendance] = useState([]);
  const [newAttIntern, setNewAttIntern] = useState('');
  const [newAttDate, setNewAttDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newAttStatus, setNewAttStatus] = useState('present');
  const [newAttNotes, setNewAttNotes] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    totalInterns: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });

  // API URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Inject global font + hover/focus styles once
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  // ============================================================================
  // CHECK IF ALREADY LOGGED IN
  // ============================================================================

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
      setCurrentPage('dashboard');
      
      // Fetch data
      loadData(savedToken);
    }
  }, []);

  // ============================================================================
  // LOAD DATA (INTERNS, TASKS, STATISTICS)
  // ============================================================================

  const loadData = async (tkn = token) => {
    try {
      // Load statistics
      const statsRes = await fetch(`${API_URL}/statistics`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      // Load interns
      const internsRes = await fetch(`${API_URL}/interns`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      });
      const internsData = await internsRes.json();
      if (internsData.success) {
        setInterns(internsData.data);
      }

      // Load tasks
      const tasksRes = await fetch(`${API_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      });
      const tasksData = await tasksRes.json();
      if (tasksData.success) {
        setTasks(tasksData.data);
      }

      // Load attendance
      const attendanceRes = await fetch(`${API_URL}/attendance`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      });
      const attendanceData = await attendanceRes.json();
      if (attendanceData.success) {
        setAttendance(attendanceData.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // ============================================================================
  // LOGIN HANDLER
  // ============================================================================

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    if (!username || !password) {
      setLoginError('Please enter username and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Save to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Update state
        setToken(data.token);
        setCurrentUser(data.user);
        setIsLoggedIn(true);

        // Clear form
        setUsername('');
        setPassword('');

        // Load data
        loadData(data.token);

        // Set page to dashboard
        setCurrentPage('dashboard');
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (error) {
      setLoginError('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // SIGNUP HANDLER
  // ============================================================================

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    if (!username || !password) {
      setLoginError('Please enter a username and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name: displayName })
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Save to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Update state
        setToken(data.token);
        setCurrentUser(data.user);
        setIsLoggedIn(true);

        // Clear form
        setUsername('');
        setPassword('');
        setDisplayName('');

        // Load data
        loadData(data.token);

        // Set page to dashboard
        setCurrentPage('dashboard');
      } else {
        setLoginError(data.message || 'Signup failed');
      }
    } catch (error) {
      setLoginError('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // LOGOUT HANDLER
  // ============================================================================

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage('login');
    setUsername('');
    setPassword('');
    setDisplayName('');
    setAuthMode('login');
    setInterns([]);
    setTasks([]);
    setStats({
      totalInterns: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0
    });
  };

  // ============================================================================
  // ADD INTERN
  // ============================================================================

  const handleAddIntern = async (e) => {
    e.preventDefault();

    if (!newInternName || !newInternEmail || !newInternDept || !newInternDate) {
      alert('All fields are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/interns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newInternName,
          email: newInternEmail,
          department: newInternDept,
          joining_date: newInternDate
        })
      });

      const data = await response.json();

      if (data.success) {
        setInterns([data.data, ...interns]);
        setNewInternName('');
        setNewInternEmail('');
        setNewInternDept('');
        setNewInternDate('');
        loadData(token);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ============================================================================
  // DELETE INTERN
  // ============================================================================

  const handleDeleteIntern = async (id) => {
    if (!window.confirm('Delete this intern?')) return;

    try {
      const response = await fetch(`${API_URL}/interns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setInterns(interns.filter(i => i.id !== id));
        loadData(token);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ============================================================================
  // ADD TASK
  // ============================================================================

  const handleAddTask = async (e) => {
    e.preventDefault();

    if (!newTaskIntern || !newTaskTitle || !newTaskDesc) {
      alert('All fields are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          intern_id: parseInt(newTaskIntern),
          title: newTaskTitle,
          description: newTaskDesc,
          status: newTaskStatus
        })
      });

      const data = await response.json();

      if (data.success) {
        setTasks([data.data, ...tasks]);
        setNewTaskIntern('');
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskStatus('pending');
        loadData(token);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ============================================================================
  // DELETE TASK
  // ============================================================================

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setTasks(tasks.filter(t => t.id !== id));
        loadData(token);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ============================================================================
  // MARK ATTENDANCE
  // ============================================================================

  const handleMarkAttendance = async (e) => {
    e.preventDefault();

    if (!newAttIntern || !newAttDate || !newAttStatus) {
      alert('Intern, date, and status are required');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          intern_id: parseInt(newAttIntern),
          date: newAttDate,
          status: newAttStatus,
          notes: newAttNotes
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewAttIntern('');
        setNewAttNotes('');
        setNewAttStatus('present');
        loadData(token);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ============================================================================
  // DELETE ATTENDANCE
  // ============================================================================

  const handleDeleteAttendance = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;

    try {
      const response = await fetch(`${API_URL}/attendance/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setAttendance(attendance.filter(a => a.id !== id));
        loadData(token);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ============================================================================
  // LOGIN / SIGNUP PAGE
  // ============================================================================

  if (!isLoggedIn) {
    const isSignup = authMode === 'signup';

    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface
        }}>
          <h1 style={{
            color: colors.primary,
            textAlign: 'center',
            marginBottom: '10px'
          }}>
            Intern Portal
          </h1>
          <p style={{
            textAlign: 'center',
            color: colors.textMuted,
            marginBottom: '30px',
            fontSize: '14px'
          }}>
            {isSignup ? 'Create an account to get started' : 'Log in to your account'}
          </p>

          {loginError && (
            <div style={{
              padding: '12px',
              marginBottom: '20px',
              borderRadius: '6px',
              backgroundColor: '#7f1d1d',
              color: '#fca5a5',
              fontSize: '14px'
            }}>
              {loginError}
            </div>
          )}

          <form onSubmit={isSignup ? handleSignup : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {isSignup && (
              <TextInput
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Full Name (optional)"
              />
            )}
            <TextInput
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
            />
            <TextInput
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />

            {isSignup && (
              <div style={{
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                color: colors.textMuted,
                fontSize: '12px',
                lineHeight: '1.6'
              }}>
                <strong style={{ color: colors.textMuted }}>Account rules:</strong>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                  <li>Username: 3-20 characters, letters/numbers/underscores only, must start with a letter (e.g. <em>john_doe2</em>)</li>
                  <li>Password: at least 6 characters</li>
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: colors.primary,
                color: '#fff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? (isSignup ? 'Creating account...' : 'Logging in...') : (isSignup ? 'Sign Up' : 'Login')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: colors.textMuted }}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setAuthMode(isSignup ? 'login' : 'signup');
                setLoginError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: colors.primary,
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                padding: 0
              }}
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // DASHBOARD PAGE
  // ============================================================================

  if (currentPage === 'dashboard') {
    // Build a small attendance-by-status summary for today's chart card
    const attendanceByStatus = ['present', 'absent', 'late', 'leave'].map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: attendance.filter(a => a.status === status).length,
      status
    })).filter(d => d.value > 0);

    const statCards = [
      { title: 'Total Interns', value: stats.totalInterns, color: colors.accentInterns },
      { title: 'Total Tasks', value: stats.totalTasks, color: colors.accentTasks },
      { title: 'Completed Tasks', value: stats.completedTasks, color: colors.success },
      { title: 'Pending Tasks', value: stats.pendingTasks, color: colors.warning }
    ];

    return (
      <div className="ip-root" style={{ minHeight: '100vh', backgroundColor: colors.background, color: colors.text }}>
        <PageHeader currentUser={currentUser} onLogout={handleLogout} />
        <PageNav currentPage={currentPage} setCurrentPage={setCurrentPage} />

        {/* Content */}
        <div style={{ padding: '40px' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>Dashboard</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {statCards.map((card, idx) => (
              <div
                key={idx}
                className="ip-card"
                style={{
                  padding: '22px',
                  borderRadius: '14px',
                  border: `1px solid ${colors.border}`,
                  borderTop: `4px solid ${card.color}`,
                  backgroundColor: colors.surface,
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
                }}
              >
                <p style={{ color: colors.textMuted, margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.title}</p>
                <h3 style={{ color: colors.text, margin: 0, fontSize: '32px', fontWeight: '800' }}>{card.value}</h3>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: '20px' }}>
            <div
              className="ip-card"
              style={{
                padding: '24px',
                borderRadius: '14px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface
              }}
            >
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700' }}>Welcome</h3>
              <p style={{ color: colors.textMuted, margin: 0 }}>
                You have {interns.length} interns, {tasks.length} tasks, and {attendance.length} attendance records logged.
              </p>
            </div>

            <div
              className="ip-card"
              style={{
                padding: '24px',
                borderRadius: '14px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface
              }}
            >
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>Attendance Overview</h3>
              <p style={{ margin: '0 0 12px 0', color: colors.textMuted, fontSize: '13px' }}>All-time status breakdown</p>
              {attendanceByStatus.length === 0 ? (
                <p style={{ color: colors.textMuted, fontSize: '14px' }}>No attendance records yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={attendanceByStatus}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {attendanceByStatus.map((entry, idx) => (
                        <Cell key={idx} fill={ATTENDANCE_COLORS[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // INTERNS PAGE
  // ============================================================================

  if (currentPage === 'interns') {
    return (
      <div className="ip-root" style={{ minHeight: '100vh', backgroundColor: colors.background, color: colors.text }}>
        <PageHeader currentUser={currentUser} onLogout={handleLogout} />
        <PageNav currentPage={currentPage} setCurrentPage={setCurrentPage} />

        {/* Content */}
        <div style={{ padding: '40px' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>Manage Interns</h2>

          {/* Add Form */}
          <div
            className="ip-card"
            style={{
              padding: '24px',
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              borderTop: `4px solid ${colors.accentInterns}`,
              backgroundColor: colors.surface,
              marginBottom: '30px'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Add New Intern</h3>
            <form onSubmit={handleAddIntern} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <TextInput
                value={newInternName}
                onChange={(e) => setNewInternName(e.target.value)}
                placeholder="Name"
              />
              <TextInput
                value={newInternEmail}
                onChange={(e) => setNewInternEmail(e.target.value)}
                placeholder="Email"
              />
              <SelectInput value={newInternDept} onChange={(e) => setNewInternDept(e.target.value)}>
                <option value="">Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Design">Design</option>
                <option value="Finance">Finance</option>
              </SelectInput>
              <input
                type="date"
                value={newInternDate}
                onChange={(e) => setNewInternDate(e.target.value)}
                className="ip-input"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  color: colors.text,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
              <button
                type="submit"
                className="ip-btn"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: colors.accentInterns,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  gridColumn: '1 / -1'
                }}
              >
                Add Intern
              </button>
            </form>
          </div>

          {/* List */}
          <div
            className="ip-card"
            style={{
              padding: '24px',
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Interns List</h3>
            {interns.length === 0 ? (
              <p style={{ color: colors.textMuted }}>No interns yet</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <th style={{ textAlign: 'left', padding: '10px', color: colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '10px', color: colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '10px', color: colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Department</th>
                      <th style={{ textAlign: 'left', padding: '10px', color: colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interns.map(intern => (
                      <tr key={intern.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '10px', fontWeight: '600' }}>{intern.name}</td>
                        <td style={{ padding: '10px', color: colors.textMuted }}>{intern.email}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            backgroundColor: '#f5f3ff',
                            color: colors.accentInterns,
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {intern.department}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <button
                            onClick={() => handleDeleteIntern(intern.id)}
                            className="ip-btn"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: '#fef2f2',
                              color: colors.danger,
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // TASKS PAGE
  // ============================================================================

  if (currentPage === 'tasks') {
    const statusBadge = {
      completed: { bg: '#ecfdf5', fg: colors.success },
      in_progress: { bg: '#eff6ff', fg: colors.accentInfo },
      pending: { bg: '#fffbeb', fg: colors.warning }
    };

    return (
      <div className="ip-root" style={{ minHeight: '100vh', backgroundColor: colors.background, color: colors.text }}>
        <PageHeader currentUser={currentUser} onLogout={handleLogout} />
        <PageNav currentPage={currentPage} setCurrentPage={setCurrentPage} />

        {/* Content */}
        <div style={{ padding: '40px' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>Manage Tasks</h2>

          {/* Add Form */}
          <div
            className="ip-card"
            style={{
              padding: '24px',
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              borderTop: `4px solid ${colors.accentTasks}`,
              backgroundColor: colors.surface,
              marginBottom: '30px'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Create New Task</h3>
            <form onSubmit={handleAddTask} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <SelectInput value={newTaskIntern} onChange={(e) => setNewTaskIntern(e.target.value)}>
                <option value="">Select Intern</option>
                {interns.map(intern => (
                  <option key={intern.id} value={intern.id}>{intern.name}</option>
                ))}
              </SelectInput>
              <TextInput
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task Title"
              />
              <SelectInput value={newTaskStatus} onChange={(e) => setNewTaskStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </SelectInput>
              <TextArea
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                placeholder="Description"
                rows={3}
              />
              <button
                type="submit"
                className="ip-btn"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: colors.accentTasks,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  gridColumn: '1 / -1'
                }}
              >
                Add Task
              </button>
            </form>
          </div>

          {/* List */}
          <div
            className="ip-card"
            style={{
              padding: '24px',
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Tasks</h3>
            {tasks.length === 0 ? (
              <p style={{ color: colors.textMuted }}>No tasks yet</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                {tasks.map(task => {
                  const intern = interns.find(i => i.id === task.intern_id);
                  const badge = statusBadge[task.status] || statusBadge.pending;
                  return (
                    <div
                      key={task.id}
                      className="ip-card"
                      style={{
                        padding: '18px',
                        borderRadius: '12px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.background
                      }}
                    >
                      <h4 style={{ color: colors.text, margin: '0 0 5px 0', fontSize: '15px', fontWeight: '700' }}>{task.title}</h4>
                      <p style={{ color: colors.textMuted, margin: '0 0 10px 0', fontSize: '12px' }}>
                        {intern?.name || 'Unknown'}
                      </p>
                      <p style={{ margin: '10px 0', color: colors.text }}>{task.description}</p>
                      <p style={{
                        margin: '10px 0',
                        padding: '5px 10px',
                        backgroundColor: badge.bg,
                        color: badge.fg,
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'inline-block'
                      }}>
                        {task.status.toUpperCase()}
                      </p>
                      <br />
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="ip-btn"
                        style={{
                          marginTop: '10px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#fef2f2',
                          color: colors.danger,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ATTENDANCE PAGE
  // ============================================================================

  if (currentPage === 'attendance') {
    const statusBadge = {
      present: { bg: '#ecfdf5', fg: ATTENDANCE_COLORS.present },
      absent: { bg: '#fef2f2', fg: ATTENDANCE_COLORS.absent },
      late: { bg: '#fffbeb', fg: ATTENDANCE_COLORS.late },
      leave: { bg: '#eff6ff', fg: ATTENDANCE_COLORS.leave }
    };

    // Chart 1: overall status distribution (pie)
    const statusDistribution = Object.keys(ATTENDANCE_COLORS).map(status => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: attendance.filter(a => a.status === status).length,
      status
    })).filter(d => d.value > 0);

    // Chart 2: attendance counts per intern (bar)
    const byIntern = interns.map(intern => {
      const records = attendance.filter(a => a.intern_id === intern.id);
      return {
        name: intern.name,
        Present: records.filter(a => a.status === 'present').length,
        Absent: records.filter(a => a.status === 'absent').length,
        Late: records.filter(a => a.status === 'late').length,
        Leave: records.filter(a => a.status === 'leave').length
      };
    }).filter(d => d.Present + d.Absent + d.Late + d.Leave > 0);

    return (
      <div className="ip-root" style={{ minHeight: '100vh', backgroundColor: colors.background, color: colors.text }}>
        <PageHeader currentUser={currentUser} onLogout={handleLogout} />
        <PageNav currentPage={currentPage} setCurrentPage={setCurrentPage} />

        {/* Content */}
        <div style={{ padding: '40px' }}>
          <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>Attendance</h2>

          {/* Mark Attendance Form */}
          <div
            className="ip-card"
            style={{
              padding: '24px',
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              borderTop: `4px solid ${colors.accentAttendance}`,
              backgroundColor: colors.surface,
              marginBottom: '30px'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Mark Attendance</h3>
            <form onSubmit={handleMarkAttendance} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <SelectInput value={newAttIntern} onChange={(e) => setNewAttIntern(e.target.value)}>
                <option value="">Select Intern</option>
                {interns.map(intern => (
                  <option key={intern.id} value={intern.id}>{intern.name}</option>
                ))}
              </SelectInput>
              <input
                type="date"
                value={newAttDate}
                onChange={(e) => setNewAttDate(e.target.value)}
                className="ip-input"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  color: colors.text,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
              <SelectInput value={newAttStatus} onChange={(e) => setNewAttStatus(e.target.value)}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="leave">Leave</option>
              </SelectInput>
              <TextInput
                value={newAttNotes}
                onChange={(e) => setNewAttNotes(e.target.value)}
                placeholder="Notes (optional)"
              />
              <button
                type="submit"
                className="ip-btn"
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: colors.accentAttendance,
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  gridColumn: '1 / -1'
                }}
              >
                Mark Attendance
              </button>
            </form>
            <p style={{ marginTop: '10px', marginBottom: 0, fontSize: '12px', color: colors.textMuted }}>
              Marking attendance again for the same intern and date will update the existing record.
            </p>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: '20px', marginBottom: '30px' }}>
            <div
              className="ip-card"
              style={{
                padding: '24px',
                borderRadius: '14px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface
              }}
            >
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>Status Distribution</h3>
              <p style={{ margin: '0 0 12px 0', color: colors.textMuted, fontSize: '13px' }}>All recorded attendance</p>
              {statusDistribution.length === 0 ? (
                <p style={{ color: colors.textMuted, fontSize: '14px' }}>No attendance records yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {statusDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={ATTENDANCE_COLORS[entry.status]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div
              className="ip-card"
              style={{
                padding: '24px',
                borderRadius: '14px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface
              }}
            >
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>Attendance by Intern</h3>
              <p style={{ margin: '0 0 12px 0', color: colors.textMuted, fontSize: '13px' }}>Status counts per intern</p>
              {byIntern.length === 0 ? (
                <p style={{ color: colors.textMuted, fontSize: '14px' }}>No attendance records yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={byIntern}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: colors.textMuted }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: colors.textMuted }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Present" stackId="a" fill={ATTENDANCE_COLORS.present} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Late" stackId="a" fill={ATTENDANCE_COLORS.late} />
                    <Bar dataKey="Absent" stackId="a" fill={ATTENDANCE_COLORS.absent} />
                    <Bar dataKey="Leave" stackId="a" fill={ATTENDANCE_COLORS.leave} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* List */}
          <div
            className="ip-card"
            style={{
              padding: '24px',
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.surface
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700' }}>Attendance Records</h3>
            {attendance.length === 0 ? (
              <p style={{ color: colors.textMuted }}>No attendance records yet</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <th style={{ textAlign: 'left', padding: '10px', color: colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Intern</th>
                      <th style={{ textAlign: 'left', padding: '10px', color: colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '10px', color: colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '10px', color: colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</th>
                      <th style={{ textAlign: 'left', padding: '10px', color: colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(record => {
                      const badge = statusBadge[record.status] || statusBadge.present;
                      const internName = record.intern_name || interns.find(i => i.id === record.intern_id)?.name || 'Unknown';
                      const dateLabel = typeof record.date === 'string' ? record.date.slice(0, 10) : record.date;
                      return (
                        <tr key={record.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <td style={{ padding: '10px', fontWeight: '600' }}>{internName}</td>
                          <td style={{ padding: '10px', color: colors.textMuted }}>{dateLabel}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              backgroundColor: badge.bg,
                              color: badge.fg,
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              {record.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '10px', color: colors.textMuted }}>{record.notes || '—'}</td>
                          <td style={{ padding: '10px' }}>
                            <button
                              onClick={() => handleDeleteAttendance(record.id)}
                              className="ip-btn"
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#fef2f2',
                                color: colors.danger,
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default InternManagementPortal;