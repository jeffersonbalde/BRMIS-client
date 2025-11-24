// components/dashboards/AdminDashboard.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    pendingApprovals: 0,
    totalBarangays: 0,
    activeIncidents: 0,
    highCriticalIncidents: 0,
    barangays: [],
    analytics: {},
    recentNotifications: [],
    recentIncidents: [],
    loading: true,
    error: null
  });

  // Make sure you're destructuring token from useAuth
  const { user, token, refreshPendingApprovals, refreshNotifications } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      
      // Pass the token to the service function
      const data = await dashboardService.getAdminDashboardData(token);
      
      setDashboardData({
        ...data,
        loading: false,
        error: null
      });

      if (refreshPendingApprovals) {
        refreshPendingApprovals();
      }
      if (refreshNotifications) {
        refreshNotifications();
      }
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data. Please check your connection and try again.'
      }));
    }
  };

  const handleMarkNotificationAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    const success = await dashboardService.markNotificationAsRead(notificationId);
    if (success) {
      setDashboardData(prev => ({
        ...prev,
        recentNotifications: prev.recentNotifications.filter(n => n.id !== notificationId)
      }));
      refreshNotifications();
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkNotificationAsRead(notification.id);
    if (notification.data?.incident_id) {
      navigate(`/incidents/${notification.data.incident_id}`);
    } else if (notification.type === 'registration_approved' || notification.type === 'registration_rejected') {
      navigate('/approvals');
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'incident_reported': 'fas fa-exclamation-triangle text-warning',
      'incident_status_changed': 'fas fa-sync-alt text-info',
      'registration_approved': 'fas fa-user-check text-success',
      'registration_rejected': 'fas fa-user-times text-danger',
      'admin_alert': 'fas fa-bell text-primary',
      'population_data_added': 'fas fa-users text-info',
      'infrastructure_status_added': 'fas fa-road text-warning'
    };
    return icons[type] || 'fas fa-bell text-secondary';
  };

  // Skeleton Loaders - Only for data content
  const StatsCardSkeleton = () => (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="card bg-primary text-white h-100 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <h6 className="card-title small fw-normal mb-1">Total Barangays</h6>
              <div className="skeleton-line mb-1" style={{ width: "60%", height: "32px", backgroundColor: 'rgba(255,255,255,0.8)' }}></div>
              <div className="skeleton-line" style={{ width: "80%", height: "14px", backgroundColor: 'rgba(255,255,255,0.6)' }}></div>
            </div>
            <div className="align-self-center flex-shrink-0 ms-2">
              <div className="skeleton-avatar" style={{ width: "40px", height: "40px", backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ListItemSkeleton = () => (
    <div className="list-group-item">
      <div className="d-flex align-items-start">
        <div className="flex-shrink-0 mt-1">
          <div className="skeleton-avatar" style={{ width: "20px", height: "20px" }}></div>
        </div>
        <div className="flex-grow-1 ms-3">
          <div className="skeleton-line mb-2" style={{ width: "70%", height: "16px" }}></div>
          <div className="skeleton-line mb-1" style={{ width: "90%", height: "14px" }}></div>
          <div className="skeleton-line" style={{ width: "40%", height: "12px" }}></div>
        </div>
      </div>
    </div>
  );

  const totalPopulation = dashboardData.barangays.reduce((total, b) => {
    return total + (b.population_data?.total_population || 0);
  }, 0);

  return (
    <div className="container-fluid px-1 fadeIn">
      {/* Page Header - ALWAYS VISIBLE (No skeleton) */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="flex-grow-1">
          <h1 className="h3 mb-1 text-dark">Municipal Administration Dashboard</h1>
          <p className="text-muted mb-0">
            Comprehensive overview of municipal operations and incident management
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {dashboardData.error && (
            <div
              className="badge px-3 py-2 text-white bg-warning"
              style={{
                background: "linear-gradient(135deg, #ffc107 0%, #ffb300 100%)",
              }}
            >
              <i className="fas fa-exclamation-triangle me-2"></i>
              Partial data loaded
            </div>
          )}
          <button 
            className="btn btn-primary btn-sm"
            onClick={loadDashboardData}
            disabled={dashboardData.loading}
            style={{
              backgroundColor: "var(--btn-primary-bg)",
              borderColor: "var(--btn-primary-bg)",
            }}
          >
            <i className={`fas fa-sync-alt ${dashboardData.loading ? 'fa-spin' : ''} me-1`}></i>
            <span className="d-none d-sm-inline">Refresh</span>
            <span className="d-sm-none">Refresh</span>
          </button>
        </div>
      </div>

      {/* Municipal Overview Cards - Show skeleton when loading */}
      <div className="row g-3 g-md-4">
        {dashboardData.loading ? (
          <>
            {[...Array(4)].map((_, index) => (
              <StatsCardSkeleton key={index} />
            ))}
          </>
        ) : (
          <>
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card bg-primary text-white h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="card-title small fw-normal mb-1">Total Barangays</h6>
                      <h3 className="fw-bold mb-0">{formatNumber(dashboardData.totalBarangays)}</h3>
                      <small className="opacity-75">
                        {dashboardData.barangays.filter(b => b.has_population_data).length} with data
                      </small>
                    </div>
                    <div className="align-self-center flex-shrink-0 ms-2">
                      <i className="fas fa-map-marker-alt fa-2x opacity-75"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card bg-success text-white h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="card-title small fw-normal mb-1">Pending Approvals</h6>
                      <h3 className="fw-bold mb-0">{formatNumber(dashboardData.pendingApprovals)}</h3>
                      <small className="opacity-75">Awaiting review</small>
                    </div>
                    <div className="align-self-center flex-shrink-0 ms-2">
                      <i className="fas fa-user-clock fa-2x opacity-75"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card bg-warning text-white h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="card-title small fw-normal mb-1">Active Incidents</h6>
                      <h3 className="fw-bold mb-0">{formatNumber(dashboardData.activeIncidents)}</h3>
                      <small className="opacity-75">
                        {formatNumber(dashboardData.highCriticalIncidents)} high/critical
                      </small>
                    </div>
                    <div className="align-self-center flex-shrink-0 ms-2">
                      <i className="fas fa-exclamation-triangle fa-2x opacity-75"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
// In your AdminDashboard component - Update the total population card
<div className="col-12 col-sm-6 col-xl-3">
  <div className="card bg-info text-white h-100 shadow-sm">
    <div className="card-body">
      <div className="d-flex justify-content-between align-items-start">
        <div className="flex-grow-1">
          <h6 className="card-title small fw-normal mb-1">Total Population</h6>
          <h3 className="fw-bold mb-0">{formatNumber(dashboardData.totalPopulation)}</h3>
          <small className="opacity-75">
            Across all barangays
          </small>
        </div>
        <div className="align-self-center flex-shrink-0 ms-2">
          <i className="fas fa-users fa-2x opacity-75"></i>
        </div>
      </div>
    </div>
  </div>
</div>
          </>
        )}
      </div>

      {/* Recent Activity Section - Show skeleton when loading */}
      <div className="row mt-4 g-3 g-md-4">
        {/* Recent Notifications */}
        <div className="col-12 col-lg-6">
          <div className="card shadow border-0 h-100">
            <div className="card-header py-3" style={{
              backgroundColor: "var(--primary-color)",
              background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
            }}>
              <h6 className="card-title mb-0 text-white">
                <i className="fas fa-bell me-2"></i>
                Recent Notifications
              </h6>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {dashboardData.loading ? (
                  <>
                    {[...Array(3)].map((_, index) => (
                      <ListItemSkeleton key={index} />
                    ))}
                  </>
                ) : (
                  <>
                    {dashboardData.recentNotifications.map((notification, index) => (
                      <div 
                        key={notification.id || index}
                        className={`list-group-item list-group-item-action cursor-pointer ${notification.is_read ? '' : 'unread-notification'}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="d-flex align-items-start">
                          <div className="flex-shrink-0 mt-1">
                            <i className={`${getNotificationIcon(notification.type)} fa-lg`}></i>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <h6 className="mb-1 fw-semibold">{notification.title}</h6>
                            <p className="mb-1 small text-muted">{notification.message}</p>
                            <small className="text-muted">
                              <i className="fas fa-clock me-1"></i>
                              {getTimeAgo(notification.created_at)}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                    {dashboardData.recentNotifications.length === 0 && (
                      <div className="list-group-item text-center py-4 text-muted">
                        <i className="fas fa-bell-slash fa-2x mb-2 d-block"></i>
                        No recent notifications
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {!dashboardData.loading && (
              <div className="card-footer bg-transparent border-top-0">
                <Link 
                  to="/notifications" 
                  className="btn btn-outline-primary btn-sm w-100 view-all-btn"
                >
                  View All Notifications
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="col-12 col-lg-6">
          <div className="card shadow border-0 h-100">
            <div className="card-header py-3" style={{
              backgroundColor: "var(--primary-color)",
              background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
            }}>
              <h6 className="card-title mb-0 text-white">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Recent Incidents
              </h6>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {dashboardData.loading ? (
                  <>
                    {[...Array(3)].map((_, index) => (
                      <ListItemSkeleton key={index} />
                    ))}
                  </>
                ) : (
                  <>
                    {dashboardData.recentIncidents.map((incident, index) => (
                      <div key={incident.id || index} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-semibold">{incident.title}</h6>
                            <small className="text-muted d-block">
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {incident.location}
                            </small>
                            <small className="text-muted">
                              <i className="fas fa-clock me-1"></i>
                              {getTimeAgo(incident.created_at)}
                            </small>
                          </div>
                          <span className={`badge ${incident.severity === 'Critical' ? 'bg-danger' : incident.severity === 'High' ? 'bg-warning' : 'bg-info'}`}>
                            {incident.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dashboardData.recentIncidents.length === 0 && (
                      <div className="list-group-item text-center py-4 text-muted">
                        <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                        No recent incidents
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {!dashboardData.loading && (
              <div className="card-footer bg-transparent border-top-0">
                <Link 
                  to="/incidents" 
                  className="btn btn-outline-primary btn-sm w-100 view-all-btn"
                >
                  View All Incidents
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {dashboardData.error && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="alert alert-warning d-flex align-items-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              <div>
                <strong>Warning:</strong> {dashboardData.error}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .unread-notification {
          background-color: rgba(51, 107, 49, 0.03);
          border-left: 4px solid var(--primary-color);
        }
        
        .view-all-btn {
          background-color: rgba(51, 107, 49, 0.08) !important;
          border-color: var(--primary-color) !important;
          color: var(--primary-color) !important;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .view-all-btn:hover {
          background-color: var(--primary-color) !important;
          color: white !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(51, 107, 49, 0.2);
        }
        
        .skeleton-line {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
        }
        
        .skeleton-avatar {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 50%;
        }
        
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;