import React, { useState, useEffect } from 'react';

const InternManagementPortal = () => {
  // Color scheme - Dark mode with professional colors
  const colors = {
    primary: '#1e40af',
    secondary: '#0f172a',
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    hover: '#1e3a8a'
  };

  // API Configuration
  const API_BASE_URL = 'http://localhost:5000/api';

  // State management
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [interns, setInterns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [statistics, setStatistics] = useState({
    totalInterns: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInternForm, setShowInternForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterTaskStatus, setFilterTaskStatus] = useState('All');
  const [searchIntern, setSearchIntern] = useState('');

  // Form state
  const [internFormData, setInternFormData] = useState({
    name: '',
    email: '',
    department: '',
    joining_date: ''
  });

  const [taskFormData, setTaskFormData] = useState({
    intern_id: '',
    title: '',
    description: '',
    status: 'pending'
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchInterns();
    fetchTasks();
    fetchStatistics();
  }, []);

  // API Calls
  const fetchInterns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/interns`);
      if (!response.ok) throw new Error('Failed to fetch interns');
      const data = await response.json();
      setInterns(data.data || []);
      setError('');
    } catch (err) {
      setError('Error fetching interns: ' + err.message);
      console.error('Error fetching interns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data.data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics`);
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStatistics(data.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateInternForm = () => {
    if (!internFormData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!internFormData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!validateEmail(internFormData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!internFormData.department) {
      setError('Department is required');
      return false;
    }
    if (!internFormData.joining_date) {
      setError('Joining date is required');
      return false;
    }
    return true;
  };

  const validateTaskForm = () => {
    if (!taskFormData.intern_id) {
      setError('Please select an intern');
      return false;
    }
    if (!taskFormData.title.trim()) {
      setError('Task title is required');
      return false;
    }
    if (!taskFormData.description.trim()) {
      setError('Task description is required');
      return false;
    }
    return true;
  };

  // Intern operations
  const handleAddIntern = () => {
    setEditingIntern(null);
    setInternFormData({ name: '', email: '', department: '', joining_date: '' });
    setShowInternForm(true);
    setError('');
  };

  const handleEditIntern = (intern) => {
    setEditingIntern(intern);
    setInternFormData(intern);
    setShowInternForm(true);
    setError('');
  };

  const handleSaveIntern = async () => {
    if (!validateInternForm()) return;

    setLoading(true);
    try {
      const url = editingIntern
        ? `${API_BASE_URL}/interns/${editingIntern.id}`
        : `${API_BASE_URL}/interns`;

      const method = editingIntern ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(internFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save intern');
      }

      setShowInternForm(false);
      setError('');
      fetchInterns();
      fetchStatistics();
    } catch (err) {
      setError(err.message);
      console.error('Error saving intern:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntern = async (id) => {
    if (window.confirm('Are you sure you want to delete this intern?')) {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/interns/${id}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to delete intern');
        }

        fetchInterns();
        fetchTasks();
        fetchStatistics();
      } catch (err) {
        setError(err.message);
        console.error('Error deleting intern:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Task operations
  const handleAddTask = () => {
    setEditingTask(null);
    setTaskFormData({ intern_id: '', title: '', description: '', status: 'pending' });
    setShowTaskForm(true);
    setError('');
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskFormData(task);
    setShowTaskForm(true);
    setError('');
  };

  const handleSaveTask = async () => {
    if (!validateTaskForm()) return;

    setLoading(true);
    try {
      const url = editingTask
        ? `${API_BASE_URL}/tasks/${editingTask.id}`
        : `${API_BASE_URL}/tasks`;

      const method = editingTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...taskFormData,
          intern_id: parseInt(taskFormData.intern_id)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save task');
      }

      setShowTaskForm(false);
      setError('');
      fetchTasks();
      fetchStatistics();
    } catch (err) {
      setError(err.message);
      console.error('Error saving task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (id, newStatus) => {
    try {
      const task = tasks.find(t => t.id === id);
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...task,
          status: newStatus
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update task');
      }

      fetchTasks();
      fetchStatistics();
    } catch (err) {
      setError(err.message);
      console.error('Error updating task:', err);
    }
  };

  // Filtering and searching
  const filteredInterns = interns.filter(intern => {
    const matchesDepartment = filterDepartment === 'All' || intern.department === filterDepartment;
    const matchesSearch = intern.name.toLowerCase().includes(searchIntern.toLowerCase());
    return matchesDepartment && matchesSearch;
  });

  const filteredTasks = tasks.filter(task => {
    return filterTaskStatus === 'All' || task.status === filterTaskStatus;
  });

  // Get department list
  const departments = ['All', ...new Set(interns.map(i => i.department))];

  // UI Components
  const StatCard = ({ label, value, icon }) => (
    <div style={{
      backgroundColor: colors.surface,
      border: `2px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '15px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>{value}</div>
    </div>
  );

  const Button = ({ onClick, label, variant = 'primary', disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.success,
        color: colors.text,
        border: 'none',
        padding: '10px 16px',
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        marginRight: '8px',
        marginBottom: '8px',
        opacity: disabled ? 0.6 : 1,
        transition: 'background-color 0.3s'
      }}
      onMouseEnter={(e) => !disabled && (e.target.style.backgroundColor = colors.hover)}
      onMouseLeave={(e) => (e.target.style.backgroundColor = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.success)}
    >
      {label}
    </button>
  );

  const LoadingIndicator = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '30px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: `3px solid ${colors.border}`,
        borderTop: `3px solid ${colors.primary}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
    </div>
  );

  const ErrorMessage = ({ message }) => (
    <div style={{
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: `1px solid ${colors.danger}`,
      color: colors.danger,
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '16px',
      fontSize: '14px'
    }}>
      {message}
    </div>
  );

  // Page components
  const DashboardPage = () => (
    <div>
      <h1 style={{ color: colors.text, marginBottom: '30px', fontSize: '32px', fontWeight: '600' }}>
        Dashboard
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        <StatCard label="Total Interns" value={statistics.totalInterns} icon="" />
        <StatCard label="Total Tasks" value={statistics.totalTasks} icon="" />
        <StatCard label="Completed Tasks" value={statistics.completedTasks} icon="" />
        <StatCard label="Pending Tasks" value={statistics.pendingTasks} icon="" />
      </div>

      <div style={{
        backgroundColor: colors.surface,
        border: `2px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h2 style={{ color: colors.text, marginBottom: '20px', fontSize: '20px' }}>Recent Activity</h2>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {interns.length === 0 ? (
            <p style={{ color: colors.textSecondary }}>No interns added yet. Create your first intern to get started.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {interns.slice(-5).reverse().map(intern => (
                <li key={intern.id} style={{
                  padding: '12px',
                  borderBottom: `1px solid ${colors.border}`,
                  color: colors.textSecondary,
                  fontSize: '14px'
                }}>
                  <strong style={{ color: colors.text }}>{intern.name}</strong> joined as {intern.department} intern
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  const InternsPage = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: colors.text, fontSize: '32px', fontWeight: '600', margin: 0 }}>
          Interns
        </h1>
        <Button onClick={handleAddIntern} label="+ Add Intern" variant="primary" />
      </div>

      {error && <ErrorMessage message={error} />}

      {showInternForm && (
        <div style={{
          backgroundColor: colors.surface,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: colors.text, marginBottom: '20px' }}>
            {editingIntern ? 'Edit Intern' : 'Add New Intern'}
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: colors.text, marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
              Name *
            </label>
            <input
              type="text"
              value={internFormData.name}
              onChange={(e) => setInternFormData({ ...internFormData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter intern name"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: colors.text, marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
              Email *
            </label>
            <input
              type="email"
              value={internFormData.email}
              onChange={(e) => setInternFormData({ ...internFormData, email: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter email address"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: colors.text, marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
              Department *
            </label>
            <select
              value={internFormData.department}
              onChange={(e) => setInternFormData({ ...internFormData, department: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select Department</option>
              <option value="Engineering">Engineering</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
              <option value="Design">Design</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: colors.text, marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
              Joining Date *
            </label>
            <input
              type="date"
              value={internFormData.joining_date}
              onChange={(e) => setInternFormData({ ...internFormData, joining_date: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <Button onClick={handleSaveIntern} label={loading ? "Saving..." : "Save Intern"} variant="primary" disabled={loading} />
            <button
              onClick={() => setShowInternForm(false)}
              style={{
                backgroundColor: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                padding: '10px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && <LoadingIndicator />}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          backgroundColor: colors.surface,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '12px'
        }}>
          <label style={{ color: colors.text, fontWeight: '500', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
            Filter by Department
          </label>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              color: colors.text,
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div style={{
          backgroundColor: colors.surface,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '12px'
        }}>
          <label style={{ color: colors.text, fontWeight: '500', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
            Search by Name
          </label>
          <input
            type="text"
            value={searchIntern}
            onChange={(e) => setSearchIntern(e.target.value)}
            placeholder="Enter intern name"
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              color: colors.text,
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {filteredInterns.length === 0 ? (
        <div style={{
          backgroundColor: colors.surface,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: colors.textSecondary
        }}>
          No interns found
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {filteredInterns.map(intern => (
            <div key={intern.id} style={{
              backgroundColor: colors.surface,
              border: `2px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '20px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.boxShadow = `0 0 20px rgba(30, 64, 175, 0.2)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <h3 style={{ color: colors.text, marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>
                {intern.name}
              </h3>
              <p style={{ color: colors.textSecondary, fontSize: '13px', margin: '8px 0' }}>
                <strong style={{ color: colors.text }}>Email:</strong> {intern.email}
              </p>
              <p style={{ color: colors.textSecondary, fontSize: '13px', margin: '8px 0' }}>
                <strong style={{ color: colors.text }}>Department:</strong> {intern.department}
              </p>
              <p style={{ color: colors.textSecondary, fontSize: '13px', margin: '8px 0' }}>
                <strong style={{ color: colors.text }}>Joined:</strong> {new Date(intern.joining_date).toLocaleDateString()}
              </p>
              <div style={{ marginTop: '16px' }}>
                <Button onClick={() => handleEditIntern(intern)} label="Edit" variant="primary" />
                <Button onClick={() => handleDeleteIntern(intern.id)} label="Delete" variant="danger" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const TasksPage = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: colors.text, fontSize: '32px', fontWeight: '600', margin: 0 }}>
          Tasks
        </h1>
        <Button onClick={handleAddTask} label="+ Add Task" variant="primary" />
      </div>

      {error && <ErrorMessage message={error} />}

      {showTaskForm && (
        <div style={{
          backgroundColor: colors.surface,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: colors.text, marginBottom: '20px' }}>
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: colors.text, marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
              Select Intern *
            </label>
            <select
              value={taskFormData.intern_id}
              onChange={(e) => setTaskFormData({ ...taskFormData, intern_id: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Choose an intern</option>
              {interns.map(intern => (
                <option key={intern.id} value={intern.id}>
                  {intern.name} ({intern.department})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: colors.text, marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
              Task Title *
            </label>
            <input
              type="text"
              value={taskFormData.title}
              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter task title"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: colors.text, marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
              Description *
            </label>
            <textarea
              value={taskFormData.description}
              onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box',
                minHeight: '100px',
                fontFamily: 'inherit'
              }}
              placeholder="Enter task description"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: colors.text, marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
              Status
            </label>
            <select
              value={taskFormData.status}
              onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <Button onClick={handleSaveTask} label={loading ? "Saving..." : "Save Task"} variant="primary" disabled={loading} />
            <button
              onClick={() => setShowTaskForm(false)}
              style={{
                backgroundColor: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                padding: '10px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && <LoadingIndicator />}

      <div style={{
        backgroundColor: colors.surface,
        border: `2px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '30px'
      }}>
        <label style={{ color: colors.text, fontWeight: '500', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
          Filter by Status
        </label>
        <select
          value={filterTaskStatus}
          onChange={(e) => setFilterTaskStatus(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            color: colors.text,
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        >
          <option value="All">All</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredTasks.length === 0 ? (
        <div style={{
          backgroundColor: colors.surface,
          border: `2px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: colors.textSecondary
        }}>
          No tasks found
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {filteredTasks.map(task => {
            const intern = interns.find(i => i.id === task.intern_id);
            const statusColors = {
              pending: colors.warning,
              in_progress: colors.primary,
              completed: colors.success
            };

            return (
              <div key={task.id} style={{
                backgroundColor: colors.surface,
                border: `2px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '20px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = `0 0 20px rgba(30, 64, 175, 0.2)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ color: colors.text, margin: 0, fontSize: '18px' }}>
                    {task.title}
                  </h3>
                  <span style={{
                    backgroundColor: statusColors[task.status],
                    color: colors.text,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <p style={{ color: colors.textSecondary, fontSize: '13px', margin: '8px 0' }}>
                  <strong style={{ color: colors.text }}>Assigned to:</strong> {intern ? intern.name : 'Unknown'}
                </p>
                <p style={{ color: colors.textSecondary, fontSize: '13px', margin: '8px 0' }}>
                  <strong style={{ color: colors.text }}>Description:</strong> {task.description}
                </p>
                <p style={{ color: colors.textSecondary, fontSize: '13px', margin: '12px 0' }}>
                  <strong style={{ color: colors.text }}>Created:</strong> {new Date(task.created_at).toLocaleDateString()}
                </p>

                <div style={{ marginTop: '16px' }}>
                  {task.status !== 'completed' && (
                    <Button 
                      onClick={() => handleUpdateTaskStatus(task.id, task.status === 'pending' ? 'in_progress' : 'completed')} 
                      label={task.status === 'pending' ? 'Start Task' : 'Mark Complete'} 
                      variant="success" 
                    />
                  )}
                  <Button onClick={() => handleEditTask(task)} label="Edit" variant="primary" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Main render
  return (
    <div style={{
      backgroundColor: colors.background,
      color: colors.text,
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: ${colors.primary} !important;
          box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1) !important;
        }
      `}</style>

      {/* Navigation Bar */}
      <nav style={{
        backgroundColor: colors.secondary,
        borderBottom: `2px solid ${colors.border}`,
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: colors.primary, margin: 0 }}>
            Intern Portal
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['dashboard', 'interns', 'tasks'].map(page => (
              <button
                key={page}
                onClick={() => {
                  setCurrentPage(page);
                  setShowInternForm(false);
                  setShowTaskForm(false);
                  setError('');
                }}
                style={{
                  backgroundColor: currentPage === page ? colors.primary : 'transparent',
                  color: colors.text,
                  border: 'none',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  transition: 'all 0.3s',
                  textTransform: 'capitalize'
                }}
                onMouseEnter={(e) => currentPage !== page && (e.target.style.backgroundColor = colors.surface)}
                onMouseLeave={(e) => currentPage !== page && (e.target.style.backgroundColor = 'transparent')}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'interns' && <InternsPage />}
        {currentPage === 'tasks' && <TasksPage />}
      </main>
    </div>
  );
};

export default InternManagementPortal;