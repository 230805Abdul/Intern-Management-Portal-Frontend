// InternManagementPortal-JWT-Updated.jsx
// Frontend with Complete JWT Authentication

import React, { useState, useEffect } from 'react';

const InternManagementPortal = () => {
  // State Management
  const [currentPage, setCurrentPage] = useState('login'); // login, dashboard, interns, tasks
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Interns State
  const [interns, setInterns] = useState([]);
  const [filteredInterns, setFilteredInterns] = useState([]);
  const [internSearchTerm, setInternSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [newIntern, setNewIntern] = useState({
    name: '',
    email: '',
    department: '',
    joining_date: ''
  });
  const [editingIntern, setEditingIntern] = useState(null);
  const [internError, setInternError] = useState('');

  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [filterTaskStatus, setFilterTaskStatus] = useState('All');
  const [newTask, setNewTask] = useState({
    intern_id: '',
    title: '',
    description: '',
    status: 'pending'
  });
  const [editingTask, setEditingTask] = useState(null);
  const [taskError, setTaskError] = useState('');

  // Statistics State
  const [statistics, setStatistics] = useState({
    totalInterns: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });

  // Colors
  const colors = {
    primary: '#1e40af',
    danger: '#dc2626',
    success: '#16a34a',
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textMuted: '#cbd5e1'
  };

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // ============================================================================
  // JWT Token Management
  // ============================================================================

  useEffect(() => {
    // Check if token exists in localStorage on mount
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
      setCurrentPage('dashboard');
      verifyToken(savedToken);
    }
  }, []);

  // Verify token with backend
  const verifyToken = async (tkn) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tkn}`
        }
      });

      if (!response.ok) {
        // Token is invalid
        handleLogout();
      }
    } catch (error) {
      console.error('Error verifying token:', error);
    }
  };

  // ============================================================================
  // Login Handler
  // ============================================================================

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    if (!loginUsername || !loginPassword) {
      setLoginError('Please enter both username and password');
      setLoginLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        // Save token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setToken(data.token);
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setCurrentPage('dashboard');

        // Clear form
        setLoginUsername('');
        setLoginPassword('');

        // Fetch initial data
        fetchStatistics(data.token);
        fetchInterns(data.token);
        fetchTasks(data.token);
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Error connecting to server. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ============================================================================
  // Logout Handler
  // ============================================================================

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage('login');
    setInterns([]);
    setTasks([]);
    setStatistics({
      totalInterns: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0
    });
  };

  // ============================================================================
  // API Fetch Helper with Token
  // ============================================================================

  const fetchWithToken = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        handleLogout();
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  };

  // ============================================================================
  // Statistics Handlers
  // ============================================================================

  const fetchStatistics = async (tkn = token) => {
    try {
      const headers = {
        'Authorization': `Bearer ${tkn}`
      };
      const response = await fetch(`${API_BASE_URL}/statistics`, { headers });
      const data = await response.json();

      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // ============================================================================
  // Interns Handlers
  // ============================================================================

  const fetchInterns = async (tkn = token) => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/interns`);
      if (data.success) {
        setInterns(data.data);
        setFilteredInterns(data.data);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
      setInternError('Failed to fetch interns');
    }
  };

  const handleAddIntern = async (e) => {
    e.preventDefault();
    setInternError('');

    if (!newIntern.name || !newIntern.email || !newIntern.department || !newIntern.joining_date) {
      setInternError('All fields are required');
      return;
    }

    try {
      const data = await fetchWithToken(`${API_BASE_URL}/interns`, {
        method: 'POST',
        body: JSON.stringify(newIntern)
      });

      if (data.success) {
        setInterns([data.data, ...interns]);
        setFilteredInterns([data.data, ...interns]);
        setNewIntern({
          name: '',
          email: '',
          department: '',
          joining_date: ''
        });
      }
    } catch (error) {
      setInternError(error.message);
    }
  };

  const handleUpdateIntern = async (e) => {
    e.preventDefault();
    setInternError('');

    try {
      const data = await fetchWithToken(`${API_BASE_URL}/interns/${editingIntern.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingIntern)
      });

      if (data.success) {
        const updatedInterns = interns.map(i => i.id === editingIntern.id ? data.data : i);
        setInterns(updatedInterns);
        setFilteredInterns(updatedInterns);
        setEditingIntern(null);
      }
    } catch (error) {
      setInternError(error.message);
    }
  };

  const handleDeleteIntern = async (id) => {
    if (!window.confirm('Are you sure you want to delete this intern?')) return;

    try {
      const data = await fetchWithToken(`${API_BASE_URL}/interns/${id}`, {
        method: 'DELETE'
      });

      if (data.success) {
        const updatedInterns = interns.filter(i => i.id !== id);
        setInterns(updatedInterns);
        setFilteredInterns(updatedInterns);
      }
    } catch (error) {
      setInternError(error.message);
    }
  };

  // ============================================================================
  // Tasks Handlers
  // ============================================================================

  const fetchTasks = async (tkn = token) => {
    try {
      const data = await fetchWithToken(`${API_BASE_URL}/tasks`);
      if (data.success) {
        setTasks(data.data);
        setFilteredTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTaskError('Failed to fetch tasks');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setTaskError('');

    if (!newTask.intern_id || !newTask.title || !newTask.description) {
      setTaskError('All fields are required');
      return;
    }

    try {
      const data = await fetchWithToken(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          ...newTask,
          intern_id: parseInt(newTask.intern_id)
        })
      });

      if (data.success) {
        setTasks([data.data, ...tasks]);
        setFilteredTasks([data.data, ...tasks]);
        setNewTask({
          intern_id: '',
          title: '',
          description: '',
          status: 'pending'
        });
      }
    } catch (error) {
      setTaskError(error.message);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setTaskError('');

    try {
      const data = await fetchWithToken(`${API_BASE_URL}/tasks/${editingTask.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingTask)
      });

      if (data.success) {
        const updatedTasks = tasks.map(t => t.id === editingTask.id ? data.data : t);
        setTasks(updatedTasks);
        setFilteredTasks(updatedTasks);
        setEditingTask(null);
      }
    } catch (error) {
      setTaskError(error.message);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const data = await fetchWithToken(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...task,
          status: newStatus
        })
      });

      if (data.success) {
        const updatedTasks = tasks.map(t => t.id === taskId ? data.data : t);
        setTasks(updatedTasks);
        setFilteredTasks(updatedTasks);
        fetchStatistics();
      }
    } catch (error) {
      setTaskError(error.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const data = await fetchWithToken(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE'
      });

      if (data.success) {
        const updatedTasks = tasks.filter(t => t.id !== id);
        setTasks(updatedTasks);
        setFilteredTasks(updatedTasks);
        fetchStatistics();
      }
    } catch (error) {
      setTaskError(error.message);
    }
  };

  // ============================================================================
  // Filter Functions
  // ============================================================================

  useEffect(() => {
    let filtered = interns;

    if (internSearchTerm) {
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(internSearchTerm.toLowerCase()) ||
        i.email.toLowerCase().includes(internSearchTerm.toLowerCase())
      );
    }

    if (filterDepartment !== 'All') {
      filtered = filtered.filter(i => i.department === filterDepartment);
    }

    setFilteredInterns(filtered);
  }, [internSearchTerm, filterDepartment, interns]);

  useEffect(() => {
    let filtered = tasks;

    if (taskSearchTerm) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(taskSearchTerm.toLowerCase())
      );
    }

    if (filterTaskStatus !== 'All') {
      filtered = filtered.filter(t => t.status === filterTaskStatus);
    }

    setFilteredTasks(filtered);
  }, [taskSearchTerm, filterTaskStatus, tasks]);

  // ============================================================================
  // Component: StatCard
  // ============================================================================

  const StatCard = ({ title, value }) => (
    <div style={{
      padding: '24px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.surface,
      textAlign: 'center'
    }}>
      <p style={{
        margin: '0 0 12px 0',
        color: colors.textMuted,
        fontSize: '14px',
        fontWeight: '500'
      }}>
        {title}
      </p>
      <h3 style={{
        margin: 0,
        color: colors.primary,
        fontSize: '36px',
        fontWeight: 'bold'
      }}>
        {value}
      </h3>
    </div>
  );

  // ============================================================================
  // Component: Button
  // ============================================================================

  const Button = ({ label, onClick, variant = 'primary', style = {}, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.success,
        color: '#fff',
        transition: 'all 0.3s ease',
        opacity: disabled ? 0.6 : 1,
        ...style
      }}
      onMouseEnter={(e) => !disabled && (e.target.style.opacity = '0.8')}
      onMouseLeave={(e) => !disabled && (e.target.style.opacity = '1')}
    >
      {label}
    </button>
  );

  // ============================================================================
  // Render: Login Page
  // ============================================================================

  const LoginPage = () => (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.background,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
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
          marginBottom: '30px',
          fontSize: '28px'
        }}>
          Intern Portal
        </h1>

        {loginError && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: '#7f1d1d',
            color: '#fca5a5',
            fontSize: '14px'
          }}>
            {loginError}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: colors.text,
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Username
            </label>
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="admin"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: colors.text,
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="admin123"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: colors.primary,
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loginLoading ? 'not-allowed' : 'pointer',
              opacity: loginLoading ? 0.7 : 1
            }}
          >
            {loginLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: colors.background,
          fontSize: '13px',
          color: colors.textMuted,
          lineHeight: '1.6'
        }}>
          <strong>Demo Credentials:</strong>
          <br />
          <br />
          <strong>Admin:</strong>
          <br />
          Username: admin
          <br />
          Password: admin123
          <br />
          <br />
          <strong>Manager:</strong>
          <br />
          Username: manager
          <br />
          Password: manager123
          <br />
          <br />
          <strong>Intern:</strong>
          <br />
          Username: intern
          <br />
          Password: intern123
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // Render: Dashboard Page
  // ============================================================================

  const DashboardPage = () => (
    <div>
      <h2 style={{ color: colors.text, marginBottom: '30px', fontSize: '28px' }}>Dashboard</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <StatCard title="Total Interns" value={statistics.totalInterns} />
        <StatCard title="Total Tasks" value={statistics.totalTasks} />
        <StatCard title="Completed Tasks" value={statistics.completedTasks} />
        <StatCard title="Pending Tasks" value={statistics.pendingTasks} />
      </div>

      <div style={{
        padding: '24px',
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface
      }}>
        <h3 style={{
          color: colors.text,
          marginTop: 0,
          marginBottom: '20px'
        }}>
          Recent Activity
        </h3>
        <p style={{ color: colors.textMuted, margin: 0 }}>
          {interns.length === 0
            ? 'No interns added yet. Create your first intern to get started.'
            : `You have ${interns.length} interns and ${tasks.length} tasks.`}
        </p>
      </div>
    </div>
  );

  // ============================================================================
  // Render: Interns Page
  // ============================================================================

  const InternsPage = () => (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: colors.text, margin: '0 0 20px 0' }}>Manage Interns</h2>

        {internError && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: '#7f1d1d',
            color: '#fca5a5',
            fontSize: '14px'
          }}>
            {internError}
          </div>
        )}

        <form onSubmit={editingIntern ? handleUpdateIntern : handleAddIntern} style={{
          padding: '24px',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
          marginBottom: '30px'
        }}>
          <h3 style={{ color: colors.text, marginTop: 0, marginBottom: '20px' }}>
            {editingIntern ? 'Edit Intern' : 'Add New Intern'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Name"
              value={editingIntern ? editingIntern.name : newIntern.name}
              onChange={(e) => editingIntern
                ? setEditingIntern({ ...editingIntern, name: e.target.value })
                : setNewIntern({ ...newIntern, name: e.target.value })
              }
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text
              }}
            />
            <input
              type="email"
              placeholder="Email"
              value={editingIntern ? editingIntern.email : newIntern.email}
              onChange={(e) => editingIntern
                ? setEditingIntern({ ...editingIntern, email: e.target.value })
                : setNewIntern({ ...newIntern, email: e.target.value })
              }
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text
              }}
            />
            <select
              value={editingIntern ? editingIntern.department : newIntern.department}
              onChange={(e) => editingIntern
                ? setEditingIntern({ ...editingIntern, department: e.target.value })
                : setNewIntern({ ...newIntern, department: e.target.value })
              }
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text
              }}
            >
              <option value="">Select Department</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Design">Design</option>
              <option value="Finance">Finance</option>
            </select>
            <input
              type="date"
              value={editingIntern ? editingIntern.joining_date : newIntern.joining_date}
              onChange={(e) => editingIntern
                ? setEditingIntern({ ...editingIntern, joining_date: e.target.value })
                : setNewIntern({ ...newIntern, joining_date: e.target.value })
              }
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: colors.primary,
                color: '#fff',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {editingIntern ? 'Update Intern' : 'Add Intern'}
            </button>
            {editingIntern && (
              <button
                type="button"
                onClick={() => setEditingIntern(null)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: colors.surface,
                  color: colors.text,
                  cursor: 'pointer',
                  fontWeight: '600',
                  border: `1px solid ${colors.border}`
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{
        padding: '24px',
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface
      }}>
        <h3 style={{ color: colors.text, marginTop: 0, marginBottom: '20px' }}>Interns List</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={internSearchTerm}
            onChange={(e) => setInternSearchTerm(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.text
            }}
          />
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.text
            }}
          >
            <option value="All">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="HR">HR</option>
            <option value="Design">Design</option>
            <option value="Finance">Finance</option>
          </select>
        </div>

        {filteredInterns.length === 0 ? (
          <p style={{ color: colors.textMuted, textAlign: 'center', padding: '20px' }}>
            No interns found.
          </p>
        ) : (
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textMuted, fontWeight: '600' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textMuted, fontWeight: '600' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textMuted, fontWeight: '600' }}>Department</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textMuted, fontWeight: '600' }}>Joining Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: colors.textMuted, fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInterns.map((intern) => (
                  <tr key={intern.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px', color: colors.text }}>{intern.name}</td>
                    <td style={{ padding: '12px', color: colors.text }}>{intern.email}</td>
                    <td style={{ padding: '12px', color: colors.text }}>{intern.department}</td>
                    <td style={{ padding: '12px', color: colors.text }}>{new Date(intern.joining_date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setEditingIntern(intern)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: colors.primary,
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteIntern(intern.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: colors.danger,
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // Render: Tasks Page
  // ============================================================================

  const TasksPage = () => (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: colors.text, margin: '0 0 20px 0' }}>Manage Tasks</h2>

        {taskError && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: '#7f1d1d',
            color: '#fca5a5',
            fontSize: '14px'
          }}>
            {taskError}
          </div>
        )}

        <form onSubmit={editingTask ? handleUpdateTask : handleAddTask} style={{
          padding: '24px',
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
          marginBottom: '30px'
        }}>
          <h3 style={{ color: colors.text, marginTop: 0, marginBottom: '20px' }}>
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <select
              value={editingTask ? editingTask.intern_id : newTask.intern_id}
              onChange={(e) => editingTask
                ? setEditingTask({ ...editingTask, intern_id: parseInt(e.target.value) })
                : setNewTask({ ...newTask, intern_id: e.target.value })
              }
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text
              }}
            >
              <option value="">Select Intern</option>
              {interns.map(intern => (
                <option key={intern.id} value={intern.id}>{intern.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Task Title"
              value={editingTask ? editingTask.title : newTask.title}
              onChange={(e) => editingTask
                ? setEditingTask({ ...editingTask, title: e.target.value })
                : setNewTask({ ...newTask, title: e.target.value })
              }
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text
              }}
            />
            <select
              value={editingTask ? editingTask.status : newTask.status}
              onChange={(e) => editingTask
                ? setEditingTask({ ...editingTask, status: e.target.value })
                : setNewTask({ ...newTask, status: e.target.value })
              }
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text
              }}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <textarea
              placeholder="Task Description"
              value={editingTask ? editingTask.description : newTask.description}
              onChange={(e) => editingTask
                ? setEditingTask({ ...editingTask, description: e.target.value })
                : setNewTask({ ...newTask, description: e.target.value })
              }
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.background,
                color: colors.text,
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: colors.primary,
                color: '#fff',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
            {editingTask && (
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: colors.surface,
                  color: colors.text,
                  cursor: 'pointer',
                  fontWeight: '600',
                  border: `1px solid ${colors.border}`
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{
        padding: '24px',
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface
      }}>
        <h3 style={{ color: colors.text, marginTop: 0, marginBottom: '20px' }}>Tasks List</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search tasks..."
            value={taskSearchTerm}
            onChange={(e) => setTaskSearchTerm(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.text
            }}
          />
          <select
            value={filterTaskStatus}
            onChange={(e) => setFilterTaskStatus(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.text
            }}
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <p style={{ color: colors.textMuted, textAlign: 'center', padding: '20px' }}>
            No tasks found.
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {filteredTasks.map(task => {
              const intern = interns.find(i => i.id === task.intern_id);
              return (
                <div
                  key={task.id}
                  style={{
                    padding: '20px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.background
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <h4 style={{ color: colors.primary, margin: '0 0 8px 0', fontSize: '16px' }}>
                      {task.title}
                    </h4>
                    <p style={{ color: colors.textMuted, margin: 0, fontSize: '13px' }}>
                      {intern ? intern.name : 'Unknown Intern'}
                    </p>
                  </div>

                  <p style={{ color: colors.text, margin: '12px 0', fontSize: '14px' }}>
                    {task.description}
                  </p>

                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: task.status === 'completed' ? '#064e3b' : task.status === 'in_progress' ? '#1e3a8a' : '#3f3f46',
                    color: task.status === 'completed' ? '#86efac' : task.status === 'in_progress' ? '#93c5fd' : '#a1a1aa',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, task.status === 'pending' ? 'in_progress' : 'completed')}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: colors.success,
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        {task.status === 'pending' ? 'Start Task' : 'Mark Complete'}
                      </button>
                    )}
                    <button
                      onClick={() => setEditingTask(task)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: colors.primary,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: colors.danger,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.background,
      color: colors.text
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 40px',
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          margin: 0,
          color: colors.primary,
          fontSize: '24px'
        }}>
          Intern Portal
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '14px', color: colors.textMuted }}>
            Welcome, <strong>{currentUser?.name}</strong> ({currentUser?.role})
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: colors.danger,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        padding: '20px 40px',
        backgroundColor: colors.background,
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        gap: '20px'
      }}>
        {['dashboard', 'interns', 'tasks'].map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: currentPage === page ? colors.primary : 'transparent',
              color: colors.text,
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => currentPage !== page && (e.target.style.backgroundColor = colors.surface)}
            onMouseLeave={(e) => currentPage !== page && (e.target.style.backgroundColor = 'transparent')}
          >
            {page.charAt(0).toUpperCase() + page.slice(1)}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{
        padding: '40px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'interns' && <InternsPage />}
        {currentPage === 'tasks' && <TasksPage />}
      </main>
    </div>
  );
};

export default InternManagementPortal;