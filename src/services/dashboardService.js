// services/dashboardService.js - CORRECTED VERSION
import api from './api';

export const dashboardService = {
  // Barangay Dashboard Data - KEEP EXISTING LOGIC UNCHANGED
  getBarangayDashboardData: async () => {
    try {
      const requests = [
        api.get('/incidents/stats'),
        api.get('/population/barangay-overview'),
        api.get('/analytics/barangay'),
        api.get('/notifications?limit=5'),
        api.get('/incidents?limit=10')
      ];

      const [
        incidentsRes,
        populationRes,
        analyticsRes,
        notificationsRes,
        incidentsListRes
      ] = await Promise.allSettled(requests);

      // Handle responses with proper error handling
      const incidents = incidentsRes.status === 'fulfilled' ? incidentsRes.value : { stats: {} };
      const population = populationRes.status === 'fulfilled' ? populationRes.value : { data: {} };
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : { data: {} };
      const notifications = notificationsRes.status === 'fulfilled' ? notificationsRes.value : { notifications: [] };
      const incidentsList = incidentsListRes.status === 'fulfilled' ? incidentsListRes.value : { incidents: [] };

      console.log('Dashboard API Responses:', {
        incidents: incidents.stats,
        population: population.data,
        analytics: analytics.data,
        notifications: notifications.notifications,
        incidentsList: incidentsList.incidents
      });

      return {
        incidents: incidents.stats || {},
        population: population.data || {},
        analytics: analytics.data || {},
        recentNotifications: notifications.notifications || [],
        recentIncidents: incidentsList.incidents?.slice(0, 5) || [], // Show only 5 most recent
      };
    } catch (error) {
      console.error('Error fetching barangay dashboard data:', error);
      return {
        incidents: {},
        population: {},
        analytics: {},
        recentNotifications: [],
        recentIncidents: [],
      };
    }
  },

  // Get recent incidents for barangay - KEEP EXISTING
  getRecentIncidents: async () => {
    try {
      const response = await api.get('/incidents?limit=5');
      return response.incidents || response.data?.incidents || [];
    } catch (error) {
      console.error('Error fetching recent incidents:', error);
      return [];
    }
  },

  // Mark notification as read - KEEP EXISTING
  markNotificationAsRead: async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  // CORRECTED: Admin Dashboard Data - COMPLETELY REMOVE the problematic endpoint
  getAdminDashboardData: async (token) => {
    try {
      if (!token) {
        throw new Error('No authentication token provided');
      }

      console.log('🔄 Starting admin dashboard data fetch...');

      // ONLY include endpoints that work - completely remove the problematic one
      const requests = [
        fetch(`${import.meta.env.VITE_LARAVEL_API}/admin/pending-users-count`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }),
        fetch(`${import.meta.env.VITE_LARAVEL_API}/incidents/stats`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }),
        fetch(`${import.meta.env.VITE_LARAVEL_API}/notifications?limit=5`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }),
        fetch(`${import.meta.env.VITE_LARAVEL_API}/incidents?limit=5`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        })
      ];

      const [
        pendingCountRes,
        incidentsRes,
        notificationsRes,
        recentIncidentsRes
      ] = await Promise.allSettled(requests);

      console.log('📊 All admin API responses received');

      // Process responses
      let pendingCount = { pending_count: 0 };
      if (pendingCountRes.status === 'fulfilled' && pendingCountRes.value.ok) {
        pendingCount = await pendingCountRes.value.json();
        console.log('👥 Pending users count:', pendingCount);
      } else {
        console.warn('Pending users API failed:', pendingCountRes);
      }

      let incidents = { stats: {} };
      if (incidentsRes.status === 'fulfilled' && incidentsRes.value.ok) {
        incidents = await incidentsRes.value.json();
        console.log('📈 Incidents stats:', incidents);
      }

      let notifications = { notifications: [] };
      if (notificationsRes.status === 'fulfilled' && notificationsRes.value.ok) {
        notifications = await notificationsRes.value.json();
        console.log('🔔 Notifications:', notifications);
      }

      let recentIncidents = { incidents: [] };
      if (recentIncidentsRes.status === 'fulfilled' && recentIncidentsRes.value.ok) {
        recentIncidents = await recentIncidentsRes.value.json();
        console.log('🚨 Recent incidents:', recentIncidents);
      }

      console.log('✅ Admin dashboard data processed successfully');

      // Return data WITHOUT barangays information
      return {
        pendingApprovals: pendingCount.pending_count || 0,
        totalBarangays: 0, // Hardcoded as 0 since we can't fetch this data
        activeIncidents: incidents.stats?.total || 0,
        highCriticalIncidents: incidents.stats?.high_critical || 0,
        barangays: [], // Empty array since we can't fetch this data
        analytics: {},
        recentNotifications: notifications.notifications || [],
        recentIncidents: recentIncidents.incidents?.slice(0, 5) || [],
      };
    } catch (error) {
      console.error('❌ Error fetching admin dashboard data:', error);
      
      return {
        pendingApprovals: 0,
        totalBarangays: 0,
        activeIncidents: 0,
        highCriticalIncidents: 0,
        barangays: [],
        analytics: {},
        recentNotifications: [],
        recentIncidents: [],
      };
    }
  }
};