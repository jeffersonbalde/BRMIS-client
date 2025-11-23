// components/dashboards/BarangayDashboard.jsx - FIXED VERSION
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

const BarangayDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    populationData: null,
    incidents: {},
    recentNotifications: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('🔄 Starting dashboard data load...');
      
      // Make all API calls in parallel with proper error handling
      const [populationResponse, incidentsResponse, notificationsResponse] = await Promise.allSettled([
        fetch(
          `${import.meta.env.VITE_LARAVEL_API}/reports/population-detailed`,
          {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              barangay: user?.barangay_name,
              date_from: '',
              date_to: '',
              incident_type: 'all'
            })
          }
        ),
        fetch(
          `${import.meta.env.VITE_LARAVEL_API}/incidents/stats`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
            },
          }
        ),
        fetch(
          `${import.meta.env.VITE_LARAVEL_API}/notifications?limit=5`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
            },
          }
        )
      ]);

      console.log('📊 All API responses received');

      // Process population data with better error handling
      let populationResult = null;
      if (populationResponse.status === 'fulfilled' && populationResponse.value.ok) {
        populationResult = await populationResponse.value.json();
        console.log('🎯 Population data:', populationResult);
        
        if (!populationResult.success) {
          console.warn('Population API returned success: false', populationResult);
        }
      } else {
        console.warn('Population API failed:', populationResponse);
      }

      // Process incidents data
      let incidentsData = { stats: {} };
      if (incidentsResponse.status === 'fulfilled' && incidentsResponse.value.ok) {
        incidentsData = await incidentsResponse.value.json();
        console.log('📈 Incidents data:', incidentsData);
      }

      // Process notifications data
      let notificationsData = { notifications: [] };
      if (notificationsResponse.status === 'fulfilled' && notificationsResponse.value.ok) {
        notificationsData = await notificationsResponse.value.json();
        console.log('🔔 Notifications data:', notificationsData);
      }

      // Use the data structure from the reports API response
      const reportData = populationResult?.data || {};
      
      setDashboardData({
        populationData: reportData,
        incidents: incidentsData.stats || {},
        recentNotifications: notificationsData.notifications || [],
        loading: false,
        error: null
      });
      
      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Failed to load barangay dashboard data:', error);
      
      let errorMessage = 'Failed to load dashboard data. ';
      
      if (error.message.includes('Network Error')) {
        errorMessage += 'Network error. Please check your connection.';
      } else if (error.message.includes('401')) {
        errorMessage += 'Authentication failed. Please log in again.';
      } else if (error.message.includes('404')) {
        errorMessage += 'API endpoint not found. Please contact administrator.';
      } else if (error.message.includes('500')) {
        errorMessage += 'Server error. Please try again later.';
      } else {
        errorMessage += error.message;
      }

      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
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

  // Skeleton Loaders - Only for data content
  const StatsCardSkeleton = () => (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="card bg-primary text-white h-100 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <h6 className="card-title small fw-normal mb-1">Total Population</h6>
              <div className="skeleton-line mb-1" style={{ width: "60%", height: "32px", backgroundColor: 'rgba(255,255,255,0.9)' }}></div>
              <div className="skeleton-line" style={{ width: "80%", height: "14px", backgroundColor: 'rgba(255,255,255,0.7)' }}></div>
            </div>
            <div className="align-self-center flex-shrink-0 ms-2">
              <div className="skeleton-avatar" style={{ width: "40px", height: "40px", backgroundColor: 'rgba(255,255,255,0.4)' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DataItemSkeleton = () => (
    <div className="col-md-4 col-sm-6">
      <div className="border rounded p-3 text-center bg-light">
        <div className="skeleton-line mb-2" style={{ height: "28px", width: "60%", margin: "0 auto", backgroundColor: '#dee2e6' }}></div>
        <div className="skeleton-line" style={{ height: "16px", width: "80%", margin: "0 auto", backgroundColor: '#dee2e6' }}></div>
      </div>
    </div>
  );

  const ListItemSkeleton = () => (
    <div className="list-group-item">
      <div className="d-flex align-items-start">
        <div className="flex-shrink-0 mt-1">
          <div className="skeleton-avatar" style={{ width: "20px", height: "20px", backgroundColor: '#dee2e6' }}></div>
        </div>
        <div className="flex-grow-1 ms-3">
          <div className="skeleton-line mb-2" style={{ width: "70%", height: "16px", backgroundColor: '#dee2e6' }}></div>
          <div className="skeleton-line mb-1" style={{ width: "90%", height: "14px", backgroundColor: '#dee2e6' }}></div>
          <div className="skeleton-line" style={{ width: "40%", height: "12px", backgroundColor: '#dee2e6' }}></div>
        </div>
      </div>
    </div>
  );

  if (dashboardData.loading) {
    return (
      <div className="container-fluid px-1 fadeIn">
        {/* Page Header - NOT in skeleton (static text) */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="flex-grow-1">
            <h1 className="h3 mb-1 text-dark">Barangay {user?.barangay_name} Dashboard</h1>
            <p className="text-muted mb-0">
              Comprehensive Population Affected Overview
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button 
              className="btn btn-primary btn-sm"
              disabled
              style={{
                backgroundColor: "var(--btn-primary-bg)",
                borderColor: "var(--btn-primary-bg)",
              }}
            >
              <i className="fas fa-sync-alt fa-spin me-1"></i>
              Loading Data...
            </button>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="row g-3 g-md-4 mb-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        {/* Population Affected Section - Only data in skeleton */}
        <div className="card shadow border-0 mb-4">
          <div className="card-header py-3 bg-primary text-white">
            <h6 className="card-title mb-0">
              <i className="fas fa-users me-2"></i>
              Population Affected
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {[...Array(7)].map((_, index) => (
                <DataItemSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Gender Breakdown Section */}
        <div className="card shadow border-0 mb-4">
          <div className="card-header py-3 bg-info text-white">
            <h6 className="card-title mb-0">
              <i className="fas fa-venus-mars me-2"></i>
              Gender Breakdown
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {[...Array(3)].map((_, index) => (
                <DataItemSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Civil Status Section */}
        <div className="card shadow border-0 mb-4">
          <div className="card-header py-3 bg-secondary text-white">
            <h6 className="card-title mb-0">
              <i className="fas fa-heart me-2"></i>
              Civil Status
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {[...Array(5)].map((_, index) => (
                <DataItemSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Vulnerable Groups Section */}
        <div className="card shadow border-0 mb-4">
          <div className="card-header py-3 bg-warning text-dark">
            <h6 className="card-title mb-0">
              <i className="fas fa-shield-alt me-2"></i>
              Vulnerable Groups
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {[...Array(11)].map((_, index) => (
                <DataItemSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Age Categories Section */}
        <div className="card shadow border-0 mb-4">
          <div className="card-header py-3 bg-success text-white">
            <h6 className="card-title mb-0">
              <i className="fas fa-child me-2"></i>
              Age Categories
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {[...Array(7)].map((_, index) => (
                <DataItemSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Notifications Skeleton */}
        <div className="card shadow border-0">
          <div className="card-header py-3 bg-primary text-white">
            <h6 className="card-title mb-0">
              <i className="fas fa-bell me-2"></i>
              Recent Notifications
            </h6>
          </div>
          <div className="card-body p-0">
            <div className="list-group list-group-flush">
              {[...Array(3)].map((_, index) => (
                <ListItemSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>

        <style jsx>{`
          .skeleton-line {
            background: linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
            border-radius: 4px;
          }
          
          .skeleton-avatar {
            background: linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%);
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
  }

  if (dashboardData.error) {
    return (
      <div className="container-fluid px-1">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1 text-dark"> Barangay {user?.barangay_name} Dashboard</h1>
          </div>
        </div>

        <div className="alert alert-danger">
          <h5>Error Loading Dashboard</h5>
          <p>{dashboardData.error}</p>
          <button 
            className="btn btn-primary"
            onClick={loadDashboardData}
          >
            <i className="fas fa-sync-alt me-2"></i>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { populationData, incidents, recentNotifications } = dashboardData;

  return (
    <div className="container-fluid px-1 fadeIn">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <div className="flex-grow-1">
          <h1 className="h3 mb-1 text-dark">Barangay {user?.barangay_name} Dashboard</h1>
          <p className="text-muted mb-0">
            Comprehensive Population Affected Overview
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button 
            className="btn btn-primary btn-sm"
            onClick={loadDashboardData}
            style={{
              backgroundColor: "var(--btn-primary-bg)",
              borderColor: "var(--btn-primary-bg)",
            }}
          >
            <i className="fas fa-sync-alt me-1"></i>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 g-md-4 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card bg-primary text-white h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h6 className="card-title small fw-normal mb-1">Total Incidents</h6>
                  <h3 className="fw-bold mb-0">
                    {formatNumber(incidents.total || 0)}
                  </h3>
                  <small className="opacity-75">
                    {formatNumber(incidents.resolved || 0)} resolved
                  </small>
                </div>
                <div className="align-self-center flex-shrink-0 ms-2">
                  <i className="fas fa-exclamation-triangle fa-2x opacity-75"></i>
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
                  <h6 className="card-title small fw-normal mb-1">Total Families</h6>
                  <h3 className="fw-bold mb-0">
                    {formatNumber(populationData?.population_affected?.no_of_families || 0)}
                  </h3>
                  <small className="opacity-75">
                    {formatNumber(populationData?.population_affected?.families_assisted || 0)} assisted
                  </small>
                </div>
                <div className="align-self-center flex-shrink-0 ms-2">
                  <i className="fas fa-home fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card bg-info text-white h-100 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <h6 className="card-title small fw-normal mb-1">Total Persons</h6>
                  <h3 className="fw-bold mb-0">
                    {formatNumber(populationData?.population_affected?.no_of_persons || 0)}
                  </h3>
                  <small className="opacity-75">
                    {formatNumber(populationData?.population_affected?.displaced_persons || 0)} displaced
                  </small>
                </div>
                <div className="align-self-center flex-shrink-0 ms-2">
                  <i className="fas fa-users fa-2x opacity-75"></i>
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
                  <h6 className="card-title small fw-normal mb-1">Assistance Rate</h6>
                  <h3 className="fw-bold mb-0">
                    {populationData?.population_affected?.percentage_families_assisted || 0}%
                  </h3>
                  <small className="opacity-75">
                    Families receiving assistance
                  </small>
                </div>
                <div className="align-self-center flex-shrink-0 ms-2">
                  <i className="fas fa-hand-holding-heart fa-2x opacity-75"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Population Affected Section */}
      <div className="card shadow border-0 mb-4">
        <div className="card-header py-3 bg-primary text-white">
          <h6 className="card-title mb-0">
            <i className="fas fa-users me-2"></i>
            Population Affected
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4 col-sm-6">
              <div className="border rounded p-3 text-center bg-light">
                <h4 className="text-primary mb-1">{formatNumber(populationData?.population_affected?.no_of_families || 0)}</h4>
                <small className="text-muted">No. of Families</small>
              </div>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="border rounded p-3 text-center bg-light">
                <h4 className="text-primary mb-1">{formatNumber(populationData?.population_affected?.no_of_persons || 0)}</h4>
                <small className="text-muted">No. of Persons</small>
              </div>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="border rounded p-3 text-center bg-light">
                <h4 className="text-warning mb-1">{formatNumber(populationData?.population_affected?.displaced_families || 0)}</h4>
                <small className="text-muted">Displaced Families</small>
              </div>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="border rounded p-3 text-center bg-light">
                <h4 className="text-warning mb-1">{formatNumber(populationData?.population_affected?.displaced_persons || 0)}</h4>
                <small className="text-muted">Displaced Persons</small>
              </div>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="border rounded p-3 text-center bg-light">
                <h4 className="text-info mb-1">{formatNumber(populationData?.population_affected?.families_requiring_assistance || 0)}</h4>
                <small className="text-muted">No. of families requiring assistance</small>
              </div>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="border rounded p-3 text-center bg-light">
                <h4 className="text-success mb-1">{formatNumber(populationData?.population_affected?.families_assisted || 0)}</h4>
                <small className="text-muted">No. of Families assisted</small>
              </div>
            </div>
            <div className="col-12">
              <div className="border rounded p-3 text-center bg-success text-white">
                <h4 className="mb-1">{populationData?.population_affected?.percentage_families_assisted || 0}%</h4>
                <small>% of families assisted</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gender Breakdown */}
      <div className="card shadow border-0 mb-4">
        <div className="card-header py-3 bg-info text-white">
          <h6 className="card-title mb-0">
            <i className="fas fa-venus-mars me-2"></i>
            Gender Breakdown
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <h5 className="text-primary mb-1">{formatNumber(populationData?.gender_breakdown?.male || 0)}</h5>
                <small className="text-muted">Male</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <h5 className="text-success mb-1">{formatNumber(populationData?.gender_breakdown?.female || 0)}</h5>
                <small className="text-muted">Female</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <h5 className="text-info mb-1">{formatNumber(populationData?.gender_breakdown?.lgbtqia || 0)}</h5>
                <small className="text-muted">LGBTQIA+ / Other (self-identified)</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Civil Status */}
      <div className="card shadow border-0 mb-4">
        <div className="card-header py-3 bg-secondary text-white">
          <h6 className="card-title mb-0">
            <i className="fas fa-heart me-2"></i>
            Civil Status
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4 col-sm-6">
              <div className="border rounded p-3 text-center">
                <h5 className="text-primary mb-1">{formatNumber(populationData?.civil_status?.single || 0)}</h5>
                <small className="text-muted">Single</small>
              </div>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="border rounded p-3 text-center">
                <h5 className="text-primary mb-1">{formatNumber(populationData?.civil_status?.married || 0)}</h5>
                <small className="text-muted">Married</small>
              </div>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="border rounded p-3 text-center">
                <h5 className="text-primary mb-1">{formatNumber(populationData?.civil_status?.widowed || 0)}</h5>
                <small className="text-muted">Widowed</small>
              </div>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="border rounded p-3 text-center">
                <h5 className="text-primary mb-1">{formatNumber(populationData?.civil_status?.separated || 0)}</h5>
                <small className="text-muted">Separated</small>
              </div>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="border rounded p-3 text-center">
                <h5 className="text-primary mb-1">{formatNumber(populationData?.civil_status?.live_in || 0)}</h5>
                <small className="text-muted">Live-In/Cohabiting</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vulnerable Groups */}
      <div className="card shadow border-0 mb-4">
        <div className="card-header py-3 bg-warning text-dark">
          <h6 className="card-title mb-0">
            <i className="fas fa-shield-alt me-2"></i>
            Vulnerable Groups
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {populationData?.vulnerable_groups && Object.entries(populationData.vulnerable_groups).map(([key, value]) => (
              <div key={key} className="col-md-4 col-sm-6">
                <div className="border rounded p-3 text-center">
                  <h5 className="text-primary mb-1">{formatNumber(value)}</h5>
                  <small className="text-muted text-capitalize">
                    {key.replace(/_/g, ' ')
                        .replace('4ps', '4Ps')
                        .replace('gbv', 'GBV')
                        .replace('pwd', 'PWD')
                        .replace(/\b\w/g, l => l.toUpperCase())}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Age Categories */}
      <div className="card shadow border-0 mb-4">
        <div className="card-header py-3 bg-success text-white">
          <h6 className="card-title mb-0">
            <i className="fas fa-child me-2"></i>
            Age Categories
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {populationData?.age_categories && Object.entries(populationData.age_categories).map(([key, value]) => (
              <div key={key} className="col-md-4 col-sm-6">
                <div className="border rounded p-3 text-center">
                  <h5 className="text-primary mb-1">{formatNumber(value)}</h5>
                  <small className="text-muted text-capitalize">
                    {key === 'infant' && 'Infant (0-6 mos)'}
                    {key === 'toddlers' && 'Toddlers (7 mos-2 y/o)'}
                    {key === 'preschooler' && 'Preschooler (3-5 y/o)'}
                    {key === 'school_age' && 'School Age (6-12 y/o)'}
                    {key === 'teen_age' && 'Teen Age (13-17 y/o)'}
                    {key === 'adult' && 'Adult (18-59 y/o)'}
                    {key === 'elderly_age' && 'Elderly (60 and above)'}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="card shadow border-0">
        <div className="card-header py-3 bg-primary text-white">
          <h6 className="card-title mb-0">
            <i className="fas fa-bell me-2"></i>
            Recent Notifications
          </h6>
        </div>
        <div className="card-body p-0">
          <div className="list-group list-group-flush">
            {recentNotifications.map((notification, index) => (
              <div key={notification.id || index} className="list-group-item">
                <div className="d-flex align-items-start">
                  <div className="flex-shrink-0 mt-1">
                    <i className="fas fa-bell text-warning"></i>
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
            {recentNotifications.length === 0 && (
              <div className="list-group-item text-center py-4 text-muted">
                <i className="fas fa-bell-slash fa-2x mb-2 d-block"></i>
                No recent notifications
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarangayDashboard;