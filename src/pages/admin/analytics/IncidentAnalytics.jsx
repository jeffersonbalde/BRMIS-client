// pages/admin/IncidentAnalytics.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { showToast } from "../../../services/notificationService";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const IncidentAnalytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState("last_6_months");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${import.meta.env.VITE_LARAVEL_API}/analytics/municipal?date_range=${dateRange}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError(error.message);
      showToast.error('Failed to load analytics data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Safe number formatting
  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return 0;
    return num;
  };

  // Fixed safeArray function to handle objects with numeric keys
  const safeArray = (array) => {
    if (Array.isArray(array)) return array;
    
    // Handle objects with numeric keys (like {0: {...}, 1: {...}, ...})
    if (array && typeof array === 'object') {
      const keys = Object.keys(array);
      
      // Check if this is an object that should be an array (has numeric keys)
      if (keys.length > 0 && keys.every(key => !isNaN(parseInt(key)))) {
        return Object.values(array);
      }
      
      // If it's a single object, wrap it in an array
      return [array];
    }
    
    return [];
  };

  // Chart options and data configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Prepare chart data with fixed array handling
  const getIncidentsByTypeChartData = () => {
    const incidentsByType = safeArray(analytics?.incidents_by_type);
    
    return {
      labels: incidentsByType.map(item => item.incident_type || 'Unknown'),
      datasets: [
        {
          label: 'Number of Incidents',
          data: incidentsByType.map(item => item.count || 0),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
          ],
          borderColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getSeverityDistributionChartData = () => {
    const severityDistribution = safeArray(analytics?.severity_distribution);
    const severityColors = {
      'Low': '#28a745',
      'Medium': '#ffc107',
      'High': '#fd7e14',
      'Critical': '#dc3545',
      'Not Specified': '#6c757d'
    };

    return {
      labels: severityDistribution.map(item => item.severity || 'Unknown'),
      datasets: [
        {
          label: 'Severity Distribution',
          data: severityDistribution.map(item => item.count || 0),
          backgroundColor: severityDistribution.map(item => 
            severityColors[item.severity] || '#6c757d'
          ),
          borderColor: severityDistribution.map(item => 
            severityColors[item.severity] || '#6c757d'
          ),
          borderWidth: 2,
        },
      ],
    };
  };

  const getStatusDistributionChartData = () => {
    const statusDistribution = safeArray(analytics?.status_distribution);
    const statusColors = {
      'Reported': '#17a2b8',
      'Investigating': '#ffc107',
      'Resolved': '#28a745',
      'Archived': '#6c757d'
    };

    return {
      labels: statusDistribution.map(item => item.status || 'Unknown'),
      datasets: [
        {
          label: 'Status Distribution',
          data: statusDistribution.map(item => item.count || 0),
          backgroundColor: statusDistribution.map(item => 
            statusColors[item.status] || '#6c757d'
          ),
          borderColor: statusDistribution.map(item => 
            statusColors[item.status] || '#6c757d'
          ),
          borderWidth: 2,
        },
      ],
    };
  };

  const getMonthlyTrendsChartData = () => {
    const monthlyTrends = safeArray(analytics?.monthly_trends);
    
    return {
      labels: monthlyTrends.map(item => item.month || 'Unknown'),
      datasets: [
        {
          label: 'Monthly Incidents',
          data: monthlyTrends.map(item => item.incidents || 0),
          borderColor: '#4e73df',
          backgroundColor: 'rgba(78, 115, 223, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const getBarangayDistributionChartData = () => {
    const incidentsByBarangay = safeArray(analytics?.incidents_by_barangay);
    
    return {
      labels: incidentsByBarangay.map(item => item.barangay_name || 'Unknown'),
      datasets: [
        {
          label: 'Total Incidents',
          data: incidentsByBarangay.map(item => item.count || 0),
          backgroundColor: 'rgba(78, 115, 223, 0.8)',
          borderColor: 'rgba(78, 115, 223, 1)',
          borderWidth: 1,
        },
        {
          label: 'High/Critical',
          data: incidentsByBarangay.map(item => item.high_critical_count || 0),
          backgroundColor: 'rgba(220, 53, 69, 0.8)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 1,
        },
        {
          label: 'Resolved',
          data: incidentsByBarangay.map(item => item.resolved_count || 0),
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const getPopulationStatsChartData = () => {
    const populationStats = analytics?.population_stats || {};
    
    return {
      labels: ['Affected Population', 'Displaced Families', 'Displaced Persons', 'Families Assisted'],
      datasets: [
        {
          label: 'Population Statistics',
          data: [
            populationStats.total_affected || 0,
            populationStats.total_displaced_families || 0,
            populationStats.total_displaced_persons || 0,
            populationStats.total_families_assisted || 0,
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Skeleton Loaders
  const StatsCardSkeleton = () => (
    <div className="col-6 col-md-3">
      <div className="card border-left-primary shadow-sm h-100">
        <div className="card-body p-3">
          <div className="d-flex align-items-center">
            <div className="flex-grow-1">
              <div
                className="skeleton-line mb-2"
                style={{ width: "80%", height: "12px" }}
              ></div>
              <div
                className="skeleton-line"
                style={{ width: "50%", height: "20px" }}
              ></div>
            </div>
            <div className="col-auto">
              <div
                className="skeleton-avatar"
                style={{ width: "30px", height: "30px" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ChartSkeleton = () => (
    <div className="card shadow border-0 h-100">
      <div className="card-header py-3" style={{
        backgroundColor: "var(--primary-color)",
        background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
      }}>
        <h6 className="card-title mb-0 text-white">
          <i className="fas fa-chart-bar me-2"></i>
          Loading Chart...
        </h6>
      </div>
      <div className="card-body">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Check if we have data for specific charts
  const hasChartData = (dataKey) => {
    const data = safeArray(analytics?.[dataKey]);
    return data.length > 0;
  };

  if (error) {
    return (
      <div className="container-fluid px-1 fadeIn">
        <div className="card shadow border-0">
          <div className="card-body text-center py-5">
            <i className="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
            <h5 className="text-danger mb-3">Failed to Load Analytics</h5>
            <p className="text-muted mb-4">{error}</p>
            <button 
              className="btn btn-primary"
              onClick={fetchAnalytics}
              style={{
                backgroundColor: "var(--btn-primary-bg)",
                borderColor: "var(--btn-primary-bg)",
              }}
            >
              <i className="fas fa-redo me-2"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics && !loading) {
    return (
      <div className="container-fluid px-1 fadeIn">
        <div className="card shadow border-0">
          <div className="card-body text-center py-5">
            <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
            <h5 className="text-muted mb-3">No Analytics Data Available</h5>
            <p className="text-muted mb-4">
              Analytics data will appear here once incidents are reported in the system.
            </p>
            <button 
              className="btn btn-primary"
              onClick={fetchAnalytics}
              style={{
                backgroundColor: "var(--btn-primary-bg)",
                borderColor: "var(--btn-primary-bg)",
              }}
            >
              <i className="fas fa-redo me-2"></i>
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { 
    overall_stats, 
    population_stats 
  } = analytics || {};

  // Add safe fallbacks for missing data
  const safeOverallStats = overall_stats || {
    total_incidents: 0,
    resolved_incidents: 0,
    high_critical_incidents: 0,
    avg_response_time_hours: 0,
    resolution_rate: 0
  };

  const safePopulationStats = population_stats || {
    total_affected: 0,
    total_displaced_families: 0,
    total_displaced_persons: 0,
    total_families_assisted: 0,
    total_families_requiring_assistance: 0,
    avg_assistance_coverage: 0
  };

  return (
    <div className="container-fluid px-1 fadeIn">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div className="flex-grow-1">
          <h1 className="h3 mb-1 text-dark">Incident Analytics Dashboard</h1>
          <p className="text-muted mb-0">
            Real-time data visualization and insights from incident reports
          </p>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div
            className="badge px-3 py-2 text-white"
            style={{
              backgroundColor: "var(--primary-color)",
              background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
            }}
          >
            <i className="fas fa-chart-bar me-2"></i>
            <span className="d-none d-sm-inline">Total Incidents:</span>
            <span> {loading ? "..." : formatNumber(safeOverallStats.total_incidents)}</span>
          </div>
          <select 
            className="form-select form-select-sm"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: 'auto' }}
            disabled={loading}
          >
            <option value="last_week">Last Week</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="last_year">Last Year</option>
            <option value="all_time">All Time</option>
          </select>
          <button 
            className="btn btn-primary btn-sm"
            onClick={fetchAnalytics}
            disabled={loading}
            style={{
              backgroundColor: "var(--btn-primary-bg)",
              borderColor: "var(--btn-primary-bg)",
            }}
          >
            <i className="fas fa-sync-alt me-1"></i>
            <span className="d-none d-sm-inline">Refresh</span>
            <span className="d-sm-none">Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4 g-3">
        {loading ? (
          <>
            {[...Array(4)].map((_, index) => (
              <StatsCardSkeleton key={index} />
            ))}
          </>
        ) : (
          <>
            <div className="col-6 col-md-3">
              <div className="card stats-card h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "var(--primary-color)" }}>
                        Total Incidents
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "var(--primary-color)" }}>
                        {formatNumber(safeOverallStats.total_incidents)}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-exclamation-triangle fa-lg" style={{ color: "var(--primary-light)", opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card stats-card h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "var(--accent-color)" }}>
                        High/Critical
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "var(--accent-color)" }}>
                        {formatNumber(safeOverallStats.high_critical_incidents)}
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-exclamation-circle fa-lg" style={{ color: "var(--accent-light)", opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card stats-card h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "#198754" }}>
                        Resolved
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "#198754" }}>
                        {formatNumber(safeOverallStats.resolved_incidents)}
                      </div>
                      <div className="small text-muted">
                        {formatNumber(safeOverallStats.resolution_rate)}% Resolution Rate
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-check-circle fa-lg" style={{ color: "#198754", opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card stats-card h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "#17a2b8" }}>
                        Avg Response Time
                      </div>
                      <div className="h4 mb-0 fw-bold" style={{ color: "#17a2b8" }}>
                        {formatNumber(safeOverallStats.avg_response_time_hours)}h
                      </div>
                    </div>
                    <div className="col-auto">
                      <i className="fas fa-clock fa-lg" style={{ color: "#17a2b8", opacity: 0.7 }}></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Population Stats Cards */}
      {loading ? (
        <div className="row mb-4 g-3">
          {[...Array(4)].map((_, index) => (
            <StatsCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="row mb-4 g-3">
          <div className="col-6 col-md-3">
            <div className="card stats-card h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "#6c757d" }}>
                      Total Affected
                    </div>
                    <div className="h4 mb-0 fw-bold" style={{ color: "#6c757d" }}>
                      {formatNumber(safePopulationStats.total_affected)}
                    </div>
                  </div>
                  <div className="col-auto">
                    <i className="fas fa-users fa-lg" style={{ color: "#6c757d", opacity: 0.7 }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card stats-card h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "#dc3545" }}>
                      Displaced Families
                    </div>
                    <div className="h4 mb-0 fw-bold" style={{ color: "#dc3545" }}>
                      {formatNumber(safePopulationStats.total_displaced_families)}
                    </div>
                  </div>
                  <div className="col-auto">
                    <i className="fas fa-house-damage fa-lg" style={{ color: "#dc3545", opacity: 0.7 }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card stats-card h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "#198754" }}>
                      Families Assisted
                    </div>
                    <div className="h4 mb-0 fw-bold" style={{ color: "#198754" }}>
                      {formatNumber(safePopulationStats.total_families_assisted)}
                    </div>
                    <div className="small text-muted">
                      {formatNumber(safePopulationStats.avg_assistance_coverage)}% Coverage
                    </div>
                  </div>
                  <div className="col-auto">
                    <i className="fas fa-hand-holding-heart fa-lg" style={{ color: "#198754", opacity: 0.7 }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card stats-card h-100">
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="text-xs fw-semibold text-uppercase mb-1" style={{ color: "#ffc107" }}>
                      Displaced Persons
                    </div>
                    <div className="h4 mb-0 fw-bold" style={{ color: "#ffc107" }}>
                      {formatNumber(safePopulationStats.total_displaced_persons)}
                    </div>
                  </div>
                  <div className="col-auto">
                    <i className="fas fa-walking fa-lg" style={{ color: "#ffc107", opacity: 0.7 }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row 1 - Incident Types and Severity */}
      <div className="row mb-4">
        {/* Incidents by Type - Bar Chart */}
        <div className="col-xl-6 mb-4">
          {loading ? (
            <ChartSkeleton />
          ) : !hasChartData('incidents_by_type') ? (
            <div className="card shadow border-0 h-100">
              <div className="card-header py-3" style={{
                backgroundColor: "var(--primary-color)",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
              }}>
                <h6 className="card-title mb-0 text-white">
                  <i className="fas fa-chart-bar me-2"></i>
                  Incidents by Type
                </h6>
              </div>
              <div className="card-body text-center py-5">
                <i className="fas fa-chart-bar fa-2x text-muted mb-3"></i>
                <p className="text-muted">No incident type data available</p>
              </div>
            </div>
          ) : (
            <div className="card shadow border-0 h-100">
              <div className="card-header py-3" style={{
                backgroundColor: "var(--primary-color)",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
              }}>
                <h6 className="card-title mb-0 text-white">
                  <i className="fas fa-chart-bar me-2"></i>
                  Incidents by Type
                </h6>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Bar 
                    data={getIncidentsByTypeChartData()} 
                    options={chartOptions} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Severity Distribution - Pie Chart */}
        <div className="col-xl-6 mb-4">
          {loading ? (
            <ChartSkeleton />
          ) : !hasChartData('severity_distribution') ? (
            <div className="card shadow border-0 h-100">
              <div className="card-header py-3" style={{
                backgroundColor: "var(--primary-color)",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
              }}>
                <h6 className="card-title mb-0 text-white">
                  <i className="fas fa-chart-pie me-2"></i>
                  Severity Distribution
                </h6>
              </div>
              <div className="card-body text-center py-5">
                <i className="fas fa-chart-pie fa-2x text-muted mb-3"></i>
                <p className="text-muted">No severity data available</p>
              </div>
            </div>
          ) : (
            <div className="card shadow border-0 h-100">
              <div className="card-header py-3" style={{
                backgroundColor: "var(--primary-color)",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
              }}>
                <h6 className="card-title mb-0 text-white">
                  <i className="fas fa-chart-pie me-2"></i>
                  Severity Distribution
                </h6>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Doughnut 
                    data={getSeverityDistributionChartData()} 
                    options={pieChartOptions} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 - Monthly Trends and Status Distribution */}
      <div className="row mb-4">
        {/* Monthly Trends - Line Chart */}
        <div className="col-xl-6 mb-4">
          {loading ? (
            <ChartSkeleton />
          ) : !hasChartData('monthly_trends') ? (
            <div className="card shadow border-0 h-100">
              <div className="card-header py-3" style={{
                backgroundColor: "var(--primary-color)",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
              }}>
                <h6 className="card-title mb-0 text-white">
                  <i className="fas fa-chart-line me-2"></i>
                  Monthly Trends
                </h6>
              </div>
              <div className="card-body text-center py-5">
                <i className="fas fa-chart-line fa-2x text-muted mb-3"></i>
                <p className="text-muted">No monthly trend data available</p>
              </div>
            </div>
          ) : (
            <div className="card shadow border-0 h-100">
              <div className="card-header py-3" style={{
                backgroundColor: "var(--primary-color)",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
              }}>
                <h6 className="card-title mb-0 text-white">
                  <i className="fas fa-chart-line me-2"></i>
                  Monthly Trends
                </h6>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Line 
                    data={getMonthlyTrendsChartData()} 
                    options={chartOptions} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Distribution - Pie Chart */}
        <div className="col-xl-6 mb-4">
          {loading ? (
            <ChartSkeleton />
          ) : !hasChartData('status_distribution') ? (
            <div className="card shadow border-0 h-100">
              <div className="card-header py-3" style={{
                backgroundColor: "var(--primary-color)",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
              }}>
                <h6 className="card-title mb-0 text-white">
                  <i className="fas fa-tasks me-2"></i>
                  Status Distribution
                </h6>
              </div>
              <div className="card-body text-center py-5">
                <i className="fas fa-tasks fa-2x text-muted mb-3"></i>
                <p className="text-muted">No status data available</p>
              </div>
            </div>
          ) : (
            <div className="card shadow border-0 h-100">
              <div className="card-header py-3" style={{
                backgroundColor: "var(--primary-color)",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
              }}>
                <h6 className="card-title mb-0 text-white">
                  <i className="fas fa-tasks me-2"></i>
                  Status Distribution
                </h6>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <Pie 
                    data={getStatusDistributionChartData()} 
                    options={pieChartOptions} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 3 - Barangay Distribution and Population Stats */}
      <div className="row mb-4">
        {/* Barangay Distribution - Bar Chart */}
        <div className="col-xl-8 mb-4">
          {loading ? (
            <ChartSkeleton />
          ) : !hasChartData('incidents_by_barangay') ? (
            <div className="card shadow border-0 h-100">
              <div className="card-header py-3" style={{
                backgroundColor: "var(--primary-color)",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
              }}>
                <h6 className="card-title mb-0 text-white">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Incidents by Barangay
                </h6>
              </div>
              <div className="card-body text-center py-5">
                <i className="fas fa-map-marker-alt fa-2x text-muted mb-3"></i>
                <p className="text-muted">No barangay data available</p>
              </div>
            </div>
          ) : (
            <div className="card shadow border-0 h-100">
              <div className="card-header py-3" style={{
                backgroundColor: "var(--primary-color)",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
              }}>
                <h6 className="card-title mb-0 text-white">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Incidents by Barangay
                </h6>
              </div>
              <div className="card-body">
                <div style={{ height: '400px' }}>
                  <Bar 
                    data={getBarangayDistributionChartData()} 
                    options={{
                      ...chartOptions,
                      scales: {
                        ...chartOptions.scales,
                        x: {
                          ticks: {
                            maxRotation: 45,
                            minRotation: 45
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Population Statistics - Bar Chart */}
        <div className="col-xl-4 mb-4">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <div className="card shadow border-0 h-100">
              <div className="card-header py-3" style={{
                backgroundColor: "var(--primary-color)",
                background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
              }}>
                <h6 className="card-title mb-0 text-white">
                  <i className="fas fa-users me-2"></i>
                  Population Statistics
                </h6>
              </div>
              <div className="card-body">
                <div style={{ height: '400px' }}>
                  <Bar 
                    data={getPopulationStatsChartData()} 
                    options={chartOptions} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty State if no data at all */}
      {!loading && safeOverallStats.total_incidents === 0 && (
        <div className="card shadow border-0">
          <div className="card-body text-center py-5">
            <i className="fas fa-chart-bar fa-3x text-muted mb-3"></i>
            <h5 className="text-muted mb-3">No Incident Data Available</h5>
            <p className="text-muted mb-4">
              Analytics will appear here once incidents are reported in the system.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentAnalytics;