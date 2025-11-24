// services/dashboardService.js - ONLY ADDING ADMIN METHOD, KEEPING BARANGAY LOGIC INTACT
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

  // ADD ONLY THIS NEW METHOD FOR ADMIN - DON'T TOUCH EXISTING ONES
  getAdminDashboardData: async () => {
    try {
      const requests = [
        api.get('/admin/pending-users-count'),
        api.get('/admin/barangays/population-data'),
        api.get('/incidents/stats'),
        api.get('/notifications?limit=5'),
        api.get('/incidents?limit=5')
      ];

      const [
        pendingCountRes,
        barangaysRes,
        incidentsRes,
        notificationsRes,
        recentIncidentsRes
      ] = await Promise.allSettled(requests);

      // Handle responses with proper error handling
      const pendingCount = pendingCountRes.status === 'fulfilled' ? pendingCountRes.value : { pending_count: 0 };
      const barangays = barangaysRes.status === 'fulfilled' ? barangaysRes.value : { barangays: [], total_barangays: 0 };
      const incidents = incidentsRes.status === 'fulfilled' ? incidentsRes.value : { stats: {} };
      const notifications = notificationsRes.status === 'fulfilled' ? notificationsRes.value : { notifications: [] };
      const recentIncidents = recentIncidentsRes.status === 'fulfilled' ? recentIncidentsRes.value : { incidents: [] };

      console.log('Admin Dashboard API Responses:', {
        pendingCount: pendingCount.pending_count,
        barangays: barangays.barangays?.length,
        incidents: incidents.stats,
        notifications: notifications.notifications?.length,
        recentIncidents: recentIncidents.incidents?.length
      });

      return {
        pendingApprovals: pendingCount.pending_count || 0,
        totalBarangays: barangays.total_barangays || 0,
        activeIncidents: incidents.stats?.total || 0,
        highCriticalIncidents: incidents.stats?.high_critical || 0,
        barangays: barangays.barangays || [],
        analytics: {}, // You can add analytics data here if needed
        recentNotifications: notifications.notifications || [],
        recentIncidents: recentIncidents.incidents?.slice(0, 5) || [],
      };
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
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
