// src/pages/admin/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { showAlert, showToast } from '../../services/notificationService';
import {
  FaKey,
  FaLock,
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaShieldAlt,
  FaCog,
  FaArchive,
  FaTrash,
  FaCalendarAlt,
  FaDatabase,
  FaExclamationTriangle,
  FaSync,
  FaUser,
  FaCogs
} from "react-icons/fa";

const AdminSettings = () => {
  const { user, token, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState("password");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Archived incidents state
  const [archivedIncidents, setArchivedIncidents] = useState([]);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cleanupSchedule, setCleanupSchedule] = useState({
    schedule_type: 'monthly',
    auto_delete: true
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  // Theme colors matching the primary scheme
  const theme = {
    primary: "#2d5a27",
    primaryDark: "#1f451c",
    primaryLight: "#3a6f32",
    accent: "#4a7c40",
    accentLight: "#5a8c50",
    textPrimary: "#1a2a1a",
    textSecondary: "#4a5c4a",
    inputBg: "#f8faf8",
    inputText: "#1a2a1a",
    inputBorder: "#c8d0c8",
  };

  // Fetch archived incidents on component mount
  useEffect(() => {
    fetchArchivedIncidents();
  }, []);

  const fetchArchivedIncidents = async () => {
    setIsLoadingArchived(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_LARAVEL_API}/admin/archived-incidents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setArchivedIncidents(data.incidents || []);
      } else {
        showAlert.error('Error', data.message || 'Failed to fetch archived incidents');
      }
    } catch (error) {
      console.error('Fetch archived incidents error:', error);
      showAlert.error('Network Error', 'Unable to connect to server.');
    } finally {
      setIsLoadingArchived(false);
    }
  };

  const handleDeleteAllArchived = async () => {
    const result = await showAlert.confirm(
      "Delete All Archived Incidents",
      `This will permanently delete ${archivedIncidents.length} archived incidents. This action cannot be undone!`,
      "Yes, Delete All",
      "Cancel",
      "warning"
    );

    if (!result.isConfirmed) return;

    showAlert.loading("Deleting Archived Incidents...", "Please wait while we securely remove all archived incidents", {
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
    });

    setIsDeleting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_LARAVEL_API}/admin/archived-incidents/delete-all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      showAlert.close();

      if (response.ok) {
        showToast.success(`Successfully deleted ${data.total_deleted} archived incidents!`);
        setArchivedIncidents([]);
      } else {
        showAlert.error('Deletion Failed', data.message || 'Failed to delete archived incidents');
      }
    } catch (error) {
      showAlert.close();
      showAlert.error('Network Error', 'Unable to connect to server.');
      console.error('Delete all archived error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleScheduleCleanup = async () => {
    const result = await showAlert.confirm(
      "Schedule Automatic Cleanup",
      `This will set up automatic ${cleanupSchedule.schedule_type} deletion of archived incidents. Are you sure?`,
      "Yes, Schedule",
      "Cancel"
    );

    if (!result.isConfirmed) return;

    showAlert.loading("Scheduling Cleanup...", "Please wait while we set up the automatic cleanup schedule", {
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_LARAVEL_API}/admin/archived-incidents/schedule-cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(cleanupSchedule)
      });

      const data = await response.json();
      showAlert.close();

      if (response.ok) {
        showToast.success(`Automatic ${cleanupSchedule.schedule_type} cleanup scheduled successfully!`);
      } else {
        showAlert.error('Scheduling Failed', data.message || 'Failed to schedule cleanup');
      }
    } catch (error) {
      showAlert.close();
      showAlert.error('Network Error', 'Unable to connect to server.');
      console.error('Schedule cleanup error:', error);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.current_password) {
      errors.current_password = ['Current password is required.'];
    }

    if (!passwordForm.new_password) {
      errors.new_password = ['New password is required.'];
    } else if (passwordForm.new_password.length < 6) {
      errors.new_password = ['Password must be at least 6 characters long.'];
    }

    if (!passwordForm.new_password_confirmation) {
      errors.new_password_confirmation = ['Please confirm your new password.'];
    } else if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      errors.new_password_confirmation = ['Passwords do not match.'];
    }

    return errors;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showAlert.error('Validation Error', 'Please check the form for errors.');
      return;
    }

    const result = await showAlert.confirm(
      "Change Password",
      "Are you sure you want to change your password?",
      "Yes, Change Password",
      "Cancel"
    );

    if (!result.isConfirmed) return;

    showAlert.loading("Changing Password...", "Please wait while we securely update your password", {
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
    });

    setIsPasswordLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_LARAVEL_API}/profile/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
          confirm_password: passwordForm.new_password_confirmation
        })
      });

      const data = await response.json();
      showAlert.close();

      if (response.ok) {
        showToast.success('Password changed successfully!');
        setPasswordForm({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });
        setFormErrors({});
        await refreshUserData();
      } else {
        if (data.errors) {
          setFormErrors(data.errors);
          const errorMessages = Object.values(data.errors).flat().join('\n');
          showAlert.error('Password Change Failed', errorMessages);
        } else if (data.message) {
          if (data.message.includes('current password')) {
            setFormErrors({ current_password: ['Current password is incorrect.'] });
          }
          showAlert.error('Password Change Failed', data.message);
        } else {
          showAlert.error('Password Change Failed', 'An unknown error occurred.');
        }
      }
    } catch (error) {
      showAlert.close();
      showAlert.error('Network Error', 'Unable to connect to server. Please try again.');
      console.error('Password change error:', error);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Clear errors when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFormErrors({});
  };

  return (
    <div className="container-fluid px-1 py-3 fadeIn">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="d-flex justify-content-center align-items-center mb-3">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #2d5a27 0%, #3a6f32 100%)",
              color: "white",
              boxShadow: "0 4px 15px rgba(45, 89, 48, 0.4)",
            }}
          >
            <FaCog size={32} />
          </div>
          <div className="text-start">
            <h1 className="h3 mb-1 fw-bold" style={{ color: theme.textPrimary }}>
              Administrator Settings
            </h1>
            <p className="text-muted mb-0">
              {user?.name} • System Administrator
            </p>
            <small className="text-muted">
              System maintenance and security settings
            </small>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {/* Sidebar Navigation */}
        <div className="col-12 col-lg-3">
          <div
            className="card border-0 h-100"
            style={{ boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
          >
            <div className="card-header bg-transparent border-0 py-3 px-3">
              <h6 className="mb-0 fw-bold" style={{ color: theme.textPrimary }}>
                Settings Menu
              </h6>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-2">
                {/* Password Change Tab */}
                <button
                  className={`btn text-start p-3 d-flex align-items-center border-0 position-relative overflow-hidden ${
                    activeTab === "password" ? "active" : ""
                  }`}
                  onClick={() => handleTabChange("password")}
                  style={{
                    background:
                      activeTab === "password"
                        ? "linear-gradient(135deg, #2d5a27 0%, #3a6f32 100%)"
                        : "#f8f9fa",
                    border:
                      activeTab === "password" ? "none" : "1px solid #dee2e6",
                    borderRadius: "8px",
                    color: activeTab === "password" ? "white" : "#495057",
                    fontWeight: activeTab === "password" ? "600" : "500",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== "password") {
                      e.target.style.background = "#e9ecef";
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== "password") {
                      e.target.style.background = "#f8f9fa";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }
                  }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                    style={{
                      width: "36px",
                      height: "36px",
                      background:
                        activeTab === "password"
                          ? "rgba(255, 255, 255, 0.2)"
                          : "linear-gradient(135deg, #2d5a27 0%, #3a6f32 100%)",
                      color: activeTab === "password" ? "white" : "white",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <FaShieldAlt size={16} />
                  </div>
                  <div className="text-start">
                    <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                      Change Password
                    </div>
                    <small
                      style={{
                        opacity: activeTab === "password" ? 0.9 : 0.7,
                        fontSize: "0.75rem",
                      }}
                    >
                      Update administrator password
                    </small>
                  </div>
                </button>

                {/* Archived Incidents Tab */}
                <button
                  className={`btn text-start p-3 d-flex align-items-center border-0 position-relative overflow-hidden ${
                    activeTab === "incidents" ? "active" : ""
                  }`}
                  onClick={() => handleTabChange("incidents")}
                  style={{
                    background:
                      activeTab === "incidents"
                        ? "linear-gradient(135deg, #2d5a27 0%, #3a6f32 100%)"
                        : "#f8f9fa",
                    border:
                      activeTab === "incidents" ? "none" : "1px solid #dee2e6",
                    borderRadius: "8px",
                    color: activeTab === "incidents" ? "white" : "#495057",
                    fontWeight: activeTab === "incidents" ? "600" : "500",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== "incidents") {
                      e.target.style.background = "#e9ecef";
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== "incidents") {
                      e.target.style.background = "#f8f9fa";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "none";
                    }
                  }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                    style={{
                      width: "36px",
                      height: "36px",
                      background:
                        activeTab === "incidents"
                          ? "rgba(255, 255, 255, 0.2)"
                          : "linear-gradient(135deg, #4a7c40 0%, #5a8c50 100%)",
                      color: activeTab === "incidents" ? "white" : "white",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <FaArchive size={16} />
                  </div>
                  <div className="text-start">
                    <div className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                      Archived Incidents
                    </div>
                    <small
                      style={{
                        opacity: activeTab === "incidents" ? 0.9 : 0.7,
                        fontSize: "0.75rem",
                      }}
                    >
                      Manage database storage
                    </small>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-12 col-lg-9">
          {/* Password Change Tab */}
          {activeTab === "password" && (
            <div
              className="card border-0 h-100"
              style={{ boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
            >
              <div className="card-header bg-transparent border-0 py-3 px-3">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-2"
                    style={{
                      width: "28px",
                      height: "28px",
                      background: "linear-gradient(135deg, #2d5a27 0%, #3a6f32 100%)",
                      color: "white",
                    }}
                  >
                    <FaShieldAlt size={14} />
                  </div>
                  <h6 className="mb-0 fw-bold" style={{ color: theme.textPrimary }}>
                    Change Administrator Password
                  </h6>
                </div>
              </div>
              <div className="card-body p-3">
                <div className="alert alert-info mb-4 border-0" style={{
                  backgroundColor: 'rgba(114, 170, 135, 0.1)',
                  borderColor: theme.primaryLight,
                  color: theme.textPrimary
                }}>
                  <strong>Administrator Note:</strong> As a system administrator, you can only change your password. 
                  Personal information modifications are restricted for security reasons.
                </div>

                <form onSubmit={handlePasswordChange}>
                  <div className="row g-3">
                    {/* Current Password */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold mb-2" style={{ color: theme.textPrimary }}>
                        Current Password *
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-transparent border-end-0" style={{
                          borderColor: formErrors.current_password ? '#dc3545' : theme.inputBorder,
                        }}>
                          <FaLock style={{ color: formErrors.current_password ? '#dc3545' : theme.textSecondary }} />
                        </span>
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="current_password"
                          className={`form-control border-start-0 ps-2 fw-semibold ${formErrors.current_password ? 'is-invalid' : ''}`}
                          style={{
                            backgroundColor: theme.inputBg,
                            color: theme.inputText,
                            borderColor: formErrors.current_password ? '#dc3545' : theme.inputBorder,
                          }}
                          value={passwordForm.current_password}
                          onChange={handlePasswordInputChange}
                          placeholder="Enter current password"
                          disabled={isPasswordLoading}
                          required
                        />
                        <span className="input-group-text bg-transparent border-start-0" style={{
                          borderColor: formErrors.current_password ? '#dc3545' : theme.inputBorder,
                        }}>
                          <button
                            type="button"
                            className="btn btn-sm p-0 border-0 bg-transparent"
                            style={{ color: formErrors.current_password ? '#dc3545' : theme.textSecondary }}
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            disabled={isPasswordLoading}
                          >
                            {showCurrentPassword ? <FaEyeSlash style={{ fontSize: "0.875rem" }} /> : <FaEye style={{ fontSize: "0.875rem" }} />}
                          </button>
                        </span>
                      </div>
                      {formErrors.current_password && <div className="invalid-feedback d-block small mt-1">{formErrors.current_password[0]}</div>}
                    </div>

                    {/* New Password */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold mb-2" style={{ color: theme.textPrimary }}>
                        New Password *
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-transparent border-end-0" style={{
                          borderColor: formErrors.new_password ? '#dc3545' : theme.inputBorder,
                        }}>
                          <FaLock style={{ color: formErrors.new_password ? '#dc3545' : theme.textSecondary }} />
                        </span>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="new_password"
                          className={`form-control border-start-0 ps-2 fw-semibold ${formErrors.new_password ? 'is-invalid' : ''}`}
                          style={{
                            backgroundColor: theme.inputBg,
                            color: theme.inputText,
                            borderColor: formErrors.new_password ? '#dc3545' : theme.inputBorder,
                          }}
                          value={passwordForm.new_password}
                          onChange={handlePasswordInputChange}
                          placeholder="Enter new password"
                          disabled={isPasswordLoading}
                          required
                          minLength={6}
                        />
                        <span className="input-group-text bg-transparent border-start-0" style={{
                          borderColor: formErrors.new_password ? '#dc3545' : theme.inputBorder,
                        }}>
                          <button
                            type="button"
                            className="btn btn-sm p-0 border-0 bg-transparent"
                            style={{ color: formErrors.new_password ? '#dc3545' : theme.textSecondary }}
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            disabled={isPasswordLoading}
                          >
                            {showNewPassword ? <FaEyeSlash style={{ fontSize: "0.875rem" }} /> : <FaEye style={{ fontSize: "0.875rem" }} />}
                          </button>
                        </span>
                      </div>
                      {formErrors.new_password && <div className="invalid-feedback d-block small mt-1">{formErrors.new_password[0]}</div>}
                      <div className="form-text small mt-1" style={{ color: theme.textSecondary }}>Password must be at least 6 characters long</div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold mb-2" style={{ color: theme.textPrimary }}>
                        Confirm New Password *
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-transparent border-end-0" style={{
                          borderColor: formErrors.new_password_confirmation ? '#dc3545' : theme.inputBorder,
                        }}>
                          <FaLock style={{ color: formErrors.new_password_confirmation ? '#dc3545' : theme.textSecondary }} />
                        </span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="new_password_confirmation"
                          className={`form-control border-start-0 ps-2 fw-semibold ${formErrors.new_password_confirmation ? 'is-invalid' : ''}`}
                          style={{
                            backgroundColor: theme.inputBg,
                            color: theme.inputText,
                            borderColor: formErrors.new_password_confirmation ? '#dc3545' : theme.inputBorder,
                          }}
                          value={passwordForm.new_password_confirmation}
                          onChange={handlePasswordInputChange}
                          placeholder="Confirm new password"
                          disabled={isPasswordLoading}
                          required
                          minLength={6}
                        />
                        <span className="input-group-text bg-transparent border-start-0" style={{
                          borderColor: formErrors.new_password_confirmation ? '#dc3545' : theme.inputBorder,
                        }}>
                          <button
                            type="button"
                            className="btn btn-sm p-0 border-0 bg-transparent"
                            style={{ color: formErrors.new_password_confirmation ? '#dc3545' : theme.textSecondary }}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isPasswordLoading}
                          >
                            {showConfirmPassword ? <FaEyeSlash style={{ fontSize: "0.875rem" }} /> : <FaEye style={{ fontSize: "0.875rem" }} />}
                          </button>
                        </span>
                      </div>
                      {formErrors.new_password_confirmation && <div className="invalid-feedback d-block small mt-1">{formErrors.new_password_confirmation[0]}</div>}
                    </div>

                    {/* Submit Button */}
                    <div className="col-12">
                      <button
                        type="submit"
                        className="btn w-100 d-flex align-items-center justify-content-center py-2 border-0"
                        disabled={isPasswordLoading}
                        style={{
                          background: "linear-gradient(135deg, #2d5a27 0%, #3a6f32 100%)",
                          color: "white",
                          borderRadius: "6px",
                          fontWeight: "600",
                          fontSize: "0.875rem",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isPasswordLoading) {
                            e.target.style.background = "linear-gradient(135deg, #3a6f32 0%, #4a8c47 100%)";
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isPasswordLoading) {
                            e.target.style.background = "linear-gradient(135deg, #2d5a27 0%, #3a6f32 100%)";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "none";
                          }
                        }}
                      >
                        {isPasswordLoading ? (
                          <>
                            <FaSpinner className="spinner me-2 flex-shrink-0" style={{ fontSize: "0.75rem" }} />
                            Changing Password...
                          </>
                        ) : (
                          <>
                            <FaKey className="me-2 flex-shrink-0" style={{ fontSize: "0.75rem" }} />
                            Change Administrator Password
                            <FaArrowRight className="ms-2 flex-shrink-0" style={{ fontSize: "0.625rem" }} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Archived Incidents Tab */}
          {activeTab === "incidents" && (
            <div
              className="card border-0 h-100"
              style={{ boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)" }}
            >
              <div className="card-header bg-transparent border-0 py-3 px-3">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-2"
                    style={{
                      width: "28px",
                      height: "28px",
                      background: "linear-gradient(135deg, #4a7c40 0%, #5a8c50 100%)",
                      color: "white",
                    }}
                  >
                    <FaArchive size={14} />
                  </div>
                  <h6 className="mb-0 fw-bold" style={{ color: theme.textPrimary }}>
                    Archived Incidents Management
                  </h6>
                </div>
              </div>
              <div className="card-body p-3">
                <div className="alert alert-warning mb-4 border-0" style={{
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  borderColor: '#ffc107',
                  color: theme.textPrimary
                }}>
                  <FaExclamationTriangle className="me-2" />
                  <strong>Database Space Management:</strong> Archived incidents are taking up database space. 
                  You can safely delete them to free up storage.
                </div>

                {/* Archived Incidents Stats */}
                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <div className="text-center p-3 rounded" style={{
                      backgroundColor: 'rgba(108, 117, 125, 0.1)',
                      border: '1px solid rgba(108, 117, 125, 0.2)'
                    }}>
                      <div className="h4 mb-1 fw-bold text-muted">{archivedIncidents.length}</div>
                      <small className="text-muted">Archived Incidents</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 rounded" style={{
                      backgroundColor: 'rgba(220, 53, 69, 0.1)',
                      border: '1px solid rgba(220, 53, 69, 0.2)'
                    }}>
                      <div className="h4 mb-1 fw-bold text-danger">
                        ~{(archivedIncidents.length * 2.5).toFixed(1)} MB
                      </div>
                      <small className="text-muted">Estimated Size</small>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="row g-2 mb-4">
                  <div className="col-12">
                    <button
                      onClick={handleDeleteAllArchived}
                      disabled={isDeleting || archivedIncidents.length === 0}
                      className="btn w-100 d-flex align-items-center justify-content-center py-2 border-0"
                      style={{
                        background: archivedIncidents.length === 0 
                          ? 'linear-gradient(135deg, #6c757d 0%, #495057 100%)' 
                          : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                        color: "white",
                        borderRadius: "6px",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                      }}
                    >
                      {isDeleting ? (
                        <>
                          <FaSpinner className="spinner me-2" style={{ fontSize: "0.75rem" }} />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FaTrash className="me-2" style={{ fontSize: "0.75rem" }} />
                          Delete All Archived ({archivedIncidents.length})
                        </>
                      )}
                    </button>
                  </div>
                  <div className="col-12">
                    <button
                      onClick={fetchArchivedIncidents}
                      disabled={isLoadingArchived}
                      className="btn w-100 d-flex align-items-center justify-content-center py-2 border-0"
                      style={{
                        background: "linear-gradient(135deg, #17a2b8 0%, #138496 100%)",
                        color: "white",
                        borderRadius: "6px",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                      }}
                    >
                      {isLoadingArchived ? (
                        <>
                          <FaSpinner className="spinner me-2" style={{ fontSize: "0.75rem" }} />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <FaSync className="me-2" style={{ fontSize: "0.75rem" }} />
                          Refresh List
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Cleanup Schedule */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold mb-2" style={{ color: theme.textPrimary }}>
                    Automatic Cleanup Schedule
                  </label>
                  <select
                    className="form-select mb-2"
                    value={cleanupSchedule.schedule_type}
                    onChange={(e) => setCleanupSchedule(prev => ({
                      ...prev,
                      schedule_type: e.target.value
                    }))}
                    style={{
                      backgroundColor: theme.inputBg,
                      color: theme.inputText,
                      borderColor: theme.inputBorder,
                    }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={cleanupSchedule.auto_delete}
                      onChange={(e) => setCleanupSchedule(prev => ({
                        ...prev,
                        auto_delete: e.target.checked
                      }))}
                      id="autoDeleteCheck"
                    />
                    <label className="form-check-label small" htmlFor="autoDeleteCheck" style={{ color: theme.textPrimary }}>
                      Enable automatic deletion
                    </label>
                  </div>

                  <button
                    onClick={handleScheduleCleanup}
                    className="btn w-100 d-flex align-items-center justify-content-center py-2 border-0"
                    style={{
                      background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
                      color: "white",
                      borderRadius: "6px",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                    }}
                  >
                    <FaCalendarAlt className="me-2" style={{ fontSize: "0.75rem" }} />
                    Schedule Automatic Cleanup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .fadeIn {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminSettings;