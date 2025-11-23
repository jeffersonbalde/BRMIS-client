// components/admin/UserManagement.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { showAlert, showToast } from "../../../services/notificationService";
import UserDetailsModal from "./UserDetailsModal";

const UserManagement = () => {
  const { user: currentUser, token, refreshPendingApprovals } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionLock, setActionLock] = useState(false);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterActivity, setFilterActivity] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, filterStatus, filterActivity, sortField, sortDirection]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_LARAVEL_API}/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showAlert.error("Error", "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.barangay_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.municipality?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((user) => user.status === filterStatus);
    }

    // Activity filter
    if (filterActivity !== "all") {
      if (filterActivity === "active") {
        filtered = filtered.filter((user) => user.is_active);
      } else if (filterActivity === "inactive") {
        filtered = filtered.filter((user) => !user.is_active);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "created_at" || sortField === "approved_at" || sortField === "last_login_at") {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (actionLock) return;
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Avatar component for consistent rendering
  const UserAvatar = ({ user, size = 40 }) => {
    const [avatarError, setAvatarError] = useState(false);
    
    const handleImageError = () => {
      setAvatarError(true);
    };

    if (user.avatar && !avatarError) {
      return (
        <img
          src={formatAvatarUrl(user.avatar)}
          alt={user.name}
          className="rounded-circle"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: "cover",
          }}
          onError={handleImageError}
        />
      );
    }

    return (
      <div
        className="rounded-circle d-flex align-items-center justify-content-center text-white"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: "var(--primary-color)",
          background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
          fontSize: `${size * 0.4}px`,
        }}
      >
        <i className="fas fa-user"></i>
      </div>
    );
  };

  const handleViewDetails = async (user) => {
    if (actionLock) {
      showToast.warning("Please wait until the current action completes");
      return;
    }

    setActionLock(true);
    setActionLoading(user.id);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_LARAVEL_API}/admin/users/${user.id}/details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.user);
        setShowDetailsModal(true);
      } else {
        throw new Error("Failed to fetch user details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      showToast.error("Failed to load user details");
    } finally {
      setActionLoading(null);
      setActionLock(false);
    }
  };

  // NEW: Handle approve user function
  const handleApprove = async (user) => {
    if (actionLock) {
      showToast.warning("Please wait until the current action completes");
      return;
    }

    const result = await showAlert.confirm(
      "Approve User",
      `Are you sure you want to approve ${user.name}? This action will grant them full access to the system.`,
      "Yes, Approve",
      "Cancel"
    );

    if (!result.isConfirmed) return;

    setActionLock(true);
    setActionLoading(user.id);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_LARAVEL_API}/admin/users/${user.id}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        showToast.success("User approved successfully!");
        
        // Update the user in the local state
        setUsers((prev) =>
          prev.map((u) => 
            u.id === user.id 
              ? { 
                  ...u, 
                  status: 'approved', 
                  is_approved: true,
                  approved_at: new Date().toISOString(),
                  rejected_at: null,
                  rejection_reason: null
                } 
              : u
          )
        );
        
        // Refresh pending approvals count
        if (refreshPendingApprovals) {
          await refreshPendingApprovals();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve user");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      showAlert.error("Approval Failed", error.message || "Failed to approve user. Please try again.");
    } finally {
      setActionLoading(null);
      setActionLock(false);
    }
  };

  const handleDeactivate = async (user) => {
    if (actionLock) {
      showToast.warning("Please wait until the current action completes");
      return;
    }

    // Prevent self-deactivation
    if (user.id === currentUser.id) {
      showAlert.error("Error", "You cannot deactivate your own account");
      return;
    }

    // Ask for deactivation reason first using custom implementation
    const reason = await new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal fade show d-block';
      modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header bg-danger text-white">
              <h5 class="modal-title">Deactivation Reason</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p>Please provide a reason for deactivating ${user.name}'s account:</p>
              <textarea class="form-control" rows="4" placeholder="Enter deactivation reason..." id="deactivationReason"></textarea>
              <div class="text-danger small mt-1" id="errorMessage" style="display: none;">Please provide a deactivation reason</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirmBtn">Deactivate Account</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      document.body.classList.add('modal-open');

      const cleanup = () => {
        document.body.removeChild(modal);
        document.body.classList.remove('modal-open');
      };

      modal.querySelector('#cancelBtn').onclick = () => {
        cleanup();
        resolve(null);
      };

      modal.querySelector('#confirmBtn').onclick = () => {
        const reasonInput = modal.querySelector('#deactivationReason');
        const errorMessage = modal.querySelector('#errorMessage');
        
        if (!reasonInput.value.trim()) {
          errorMessage.style.display = 'block';
          return;
        }

        cleanup();
        resolve(reasonInput.value.trim());
      };

      // Close on backdrop click
      modal.onclick = (e) => {
        if (e.target === modal) {
          cleanup();
          resolve(null);
        }
      };
    });

    if (!reason) {
      showToast.warning("Deactivation cancelled");
      return;
    }

    const confirmation = await showAlert.confirm(
      "Deactivate Account",
      `Are you sure you want to deactivate ${user.name}'s account? They will no longer be able to access the system.`,
      "Yes, Deactivate",
      "Cancel"
    );

    if (!confirmation.isConfirmed) return;

    setActionLock(true);
    setActionLoading(user.id);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_LARAVEL_API}/admin/users/${user.id}/deactivate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            deactivation_reason: reason
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast.success("Account deactivated successfully!");
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? data.user : u))
        );
        
        // Refresh counts in auth context
        if (window.refreshAllCounts) {
          window.refreshAllCounts();
        }
      } else {
        throw new Error(data.message || "Failed to deactivate account");
      }
    } catch (error) {
      console.error("Error deactivating user:", error);
      showAlert.error("Deactivation Failed", error.message || "Failed to deactivate account");
    } finally {
      setActionLoading(null);
      setActionLock(false);
    }
  };

  const handleReactivate = async (user) => {
    if (actionLock) {
      showToast.warning("Please wait until the current action completes");
      return;
    }

    const result = await showAlert.confirm(
      "Reactivate Account",
      `Are you sure you want to reactivate ${user.name}'s account? They will regain access to the system.`,
      "Yes, Reactivate",
      "Cancel"
    );

    if (!result.isConfirmed) return;

    setActionLock(true);
    setActionLoading(user.id);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_LARAVEL_API}/admin/users/${user.id}/reactivate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast.success("Account reactivated successfully!");
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? data.user : u))
        );
      } else {
        throw new Error(data.message || "Failed to reactivate account");
      }
    } catch (error) {
      console.error("Error reactivating user:", error);
      showAlert.error("Reactivation Failed", error.message || "Failed to reactivate account");
    } finally {
      setActionLoading(null);
      setActionLock(false);
    }
  };

  const getStatusBadge = (user) => {
    const statusStyles = {
      pending: "bg-warning text-dark",
      approved: "bg-success text-white",
      rejected: "bg-danger text-white",
    };
    return (
      <span className={`badge ${statusStyles[user.status] || "bg-secondary"}`}>
        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
      </span>
    );
  };

  const getActivityBadge = (user) => {
    if (user.is_active) {
      return <span className="badge bg-success">Active</span>;
    } else {
      return <span className="badge bg-danger">Deactivated</span>;
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return "fas fa-sort";
    return sortDirection === "asc" ? "fas fa-sort-up" : "fas fa-sort-down";
  };

  const isActionDisabled = (userId = null) => {
    return actionLock || (actionLoading && actionLoading !== userId);
  };

  // Format avatar URL
  const formatAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    const filename = avatarPath.split("/").pop();
    return `${import.meta.env.VITE_LARAVEL_API}/avatar/${filename}`;
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Skeleton Loaders
  const TableRowSkeleton = () => (
    <tr className="align-middle">
      <td className="text-center">
        <div
          className="skeleton-box"
          style={{ width: "20px", height: "20px", margin: "0 auto" }}
        ></div>
      </td>
      <td className="text-center">
        <div className="d-flex justify-content-center gap-1">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="skeleton-box"
              style={{ width: "30px", height: "30px" }}
            ></div>
          ))}
        </div>
      </td>
      <td>
        <div className="d-flex align-items-center">
          <div className="skeleton-avatar me-3"></div>
          <div className="flex-grow-1">
            <div className="skeleton-line mb-1"></div>
            <div className="skeleton-line" style={{ width: "60%" }}></div>
          </div>
        </div>
      </td>
      <td>
        <div className="skeleton-line mb-1"></div>
        <div className="skeleton-line" style={{ width: "80%" }}></div>
      </td>
      <td>
        <div className="skeleton-badge"></div>
      </td>
      <td>
        <div className="skeleton-badge"></div>
      </td>
      <td>
        <div className="skeleton-line" style={{ width: "70%" }}></div>
      </td>
      <td className="text-center">
        <div
          className="skeleton-line"
          style={{ width: "80%", margin: "0 auto" }}
        ></div>
      </td>
    </tr>
  );

  const formatLocalDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Date Error";
    }
  };

  return (
    <div className="container-fluid px-1 fadeIn">
      {/* Page Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div className="flex-grow-1">
          <h1 className="h3 mb-1 text-dark">User Management</h1>
          <p className="text-muted mb-0">
            Manage system users and account status
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
            <i className="fas fa-users me-2"></i>
            <span className="d-none d-sm-inline">Total Users:</span>
            <span> {loading ? "..." : users.length}</span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={fetchUsers}
            disabled={isActionDisabled()}
            style={{
              backgroundColor: "var(--btn-primary-bg)",
              borderColor: "var(--btn-primary-bg)",
            }}
          >
            <i className="fas fa-sync-alt me-1"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="card shadow border-0 mb-4">
        <div className="card-body p-3">
          <div className="row g-2 g-md-3 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold mb-1">
                Search Users
              </label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by name, email, barangay..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isActionDisabled()}
                />
                {searchTerm && (
                  <button
                    className="btn btn-outline-secondary border-start-0"
                    type="button"
                    onClick={() => setSearchTerm("")}
                    disabled={isActionDisabled()}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold mb-1">Status</label>
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                disabled={loading || isActionDisabled()}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold mb-1">Activity</label>
              <select
                className="form-select form-select-sm"
                value={filterActivity}
                onChange={(e) => setFilterActivity(e.target.value)}
                disabled={loading || isActionDisabled()}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold mb-1">Items</label>
              <select
                className="form-select form-select-sm"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                disabled={loading || isActionDisabled()}
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="card shadow border-0">
        <div
          className="card-header py-3"
          style={{
            backgroundColor: "var(--primary-color)",
            background: "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
          }}
        >
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
            <h6 className="card-title mb-0 text-white">
              <i className="fas fa-users me-2"></i>
              System Users
              {!loading && (
                <small className="opacity-75 ms-2">
                  ({filteredUsers.length} found
                  {searchTerm || filterStatus !== "all" || filterActivity !== "all"
                    ? " after filtering"
                    : ""}
                  )
                </small>
              )}
            </h6>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            // Loading state
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead style={{ backgroundColor: "var(--background-light)" }}>
                  <tr>
                    <th className="text-center fw-bold" style={{ width: "50px", fontSize: "0.875rem" }}>
                      #
                    </th>
                    <th className="text-center" style={{ width: "100px", fontSize: "0.875rem" }}>
                      Actions
                    </th>
                    <th style={{ fontSize: "0.875rem" }}>User</th>
                    <th style={{ fontSize: "0.875rem" }}>Contact</th>
                    <th style={{ fontSize: "0.875rem" }}>Status</th>
                    <th style={{ fontSize: "0.875rem" }}>Activity</th>
                    <th style={{ fontSize: "0.875rem" }}>Barangay</th>
                    <th className="text-center" style={{ fontSize: "0.875rem" }}>
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, index) => (
                    <TableRowSkeleton key={index} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : currentUsers.length === 0 ? (
            // Empty state
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="fas fa-users fa-4x text-muted opacity-50"></i>
              </div>
              <h5 className="text-muted mb-3">No Users Found</h5>
              <p className="text-muted mb-4">
                {users.length === 0
                  ? "No users registered in the system"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {(searchTerm || filterStatus !== "all" || filterActivity !== "all") && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                    setFilterActivity("all");
                  }}
                  disabled={isActionDisabled()}
                >
                  <i className="fas fa-times me-2"></i>Clear Filters
                </button>
              )}
            </div>
          ) : (
            // Loaded state with data
            <>
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead style={{ backgroundColor: "var(--background-light)" }}>
                    <tr>
                      <th className="text-center fw-bold" style={{ width: "50px", fontSize: "0.875rem" }}>
                        #
                      </th>
                      <th className="text-center" style={{ width: "100px", fontSize: "0.875rem" }}>
                        Actions
                      </th>
                      <th style={{ fontSize: "0.875rem" }}>
                        <button
                          className="btn btn-link p-0 border-0 text-decoration-none text-dark fw-semibold text-start w-100"
                          onClick={() => handleSort("name")}
                          disabled={isActionDisabled()}
                          style={{ fontSize: "0.875rem" }}
                        >
                          <span className="d-flex align-items-center justify-content-between">
                            User
                            <i className={`ms-1 ${getSortIcon("name")}`}></i>
                          </span>
                        </button>
                      </th>
                      <th style={{ fontSize: "0.875rem" }}>Contact</th>
                      <th style={{ fontSize: "0.875rem" }}>
                        <button
                          className="btn btn-link p-0 border-0 text-decoration-none text-dark fw-semibold text-start w-100"
                          onClick={() => handleSort("status")}
                          disabled={isActionDisabled()}
                          style={{ fontSize: "0.875rem" }}
                        >
                          <span className="d-flex align-items-center justify-content-between">
                            Status
                            <i className={`ms-1 ${getSortIcon("status")}`}></i>
                          </span>
                        </button>
                      </th>
                      <th style={{ fontSize: "0.875rem" }}>
                        <button
                          className="btn btn-link p-0 border-0 text-decoration-none text-dark fw-semibold text-start w-100"
                          onClick={() => handleSort("is_active")}
                          disabled={isActionDisabled()}
                          style={{ fontSize: "0.875rem" }}
                        >
                          <span className="d-flex align-items-center justify-content-between">
                            Activity
                            <i className={`ms-1 ${getSortIcon("is_active")}`}></i>
                          </span>
                        </button>
                      </th>
                      <th style={{ fontSize: "0.875rem" }}>
                        <button
                          className="btn btn-link p-0 border-0 text-decoration-none text-dark fw-semibold text-start w-100"
                          onClick={() => handleSort("barangay_name")}
                          disabled={isActionDisabled()}
                          style={{ fontSize: "0.875rem" }}
                        >
                          <span className="d-flex align-items-center justify-content-between">
                            Barangay
                            <i className={`ms-1 ${getSortIcon("barangay_name")}`}></i>
                          </span>
                        </button>
                      </th>
                      <th className="text-center" style={{ fontSize: "0.9rem" }}>
                        <button
                          className="btn btn-link p-0 border-0 text-decoration-none text-dark fw-semibold"
                          onClick={() => handleSort("created_at")}
                          disabled={isActionDisabled()}
                          style={{ fontSize: "0.9rem" }}
                        >
                          <span className="d-flex align-items-center">
                            Registered
                            <i className={`ms-1 ${getSortIcon("created_at")}`}></i>
                          </span>
                        </button>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentUsers.map((user, index) => (
                      <tr key={user.id} className="align-middle">
                        <td className="text-center fw-bold text-muted" style={{ fontSize: "0.9rem" }}>
                          {startIndex + index + 1}
                        </td>
                        
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-1">
                            {/* View Button */}
                            <button
                              className="btn action-btn btn-view"
                              onClick={() => handleViewDetails(user)}
                              disabled={isActionDisabled(user.id)}
                              title="View Details"
                            >
                              {actionLoading === user.id ? (
                                <span
                                  className="spinner-border spinner-border-sm"
                                  role="status"
                                ></span>
                              ) : (
                                <i className="fas fa-eye"></i>
                              )}
                            </button>

                            {/* NEW: Approve Button for rejected users */}
                            {user.status === 'rejected' && (
                              <button
                                className="btn action-btn btn-approve"
                                onClick={() => handleApprove(user)}
                                disabled={isActionDisabled(user.id)}
                                title="Approve User"
                              >
                                {actionLoading === user.id ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                ) : (
                                  <i className="fas fa-check"></i>
                                )}
                              </button>
                            )}

                            {/* Deactivate/Reactivate Button */}
                            {user.is_active ? (
                              <button
                                className="btn action-btn btn-reject"
                                onClick={() => handleDeactivate(user)}
                                disabled={isActionDisabled(user.id) || user.id === currentUser.id}
                                title={user.id === currentUser.id ? "Cannot deactivate your own account" : "Deactivate Account"}
                              >
                                {actionLoading === user.id ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                ) : (
                                  <i className="fas fa-user-slash"></i>
                                )}
                              </button>
                            ) : (
                              <button
                                className="btn action-btn btn-approve"
                                onClick={() => handleReactivate(user)}
                                disabled={isActionDisabled(user.id)}
                                title="Reactivate Account"
                              >
                                {actionLoading === user.id ? (
                                  <span
                                    className="spinner-border spinner-border-sm"
                                    role="status"
                                  ></span>
                                ) : (
                                  <i className="fas fa-user-check"></i>
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="d-flex align-items-center">
                            <div className="me-3 flex-shrink-0">
                              <UserAvatar user={user} size={40} />
                            </div>  
                            <div className="flex-grow-1 min-w-0">
                              <div
                                className="fw-semibold text-dark text-truncate"
                                style={{ fontSize: "0.9rem", lineHeight: "1.3" }}
                                title={user.name}
                              >
                                {user.name}
                              </div>
                              <small
                                className="text-muted d-block text-truncate"
                                style={{ fontSize: "0.8rem", lineHeight: "1.3" }}
                                title={user.email}
                              >
                                {user.email}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div
                            className="fw-semibold text-dark"
                            style={{ fontSize: "0.9rem" }}
                          >
                            {user.contact || "N/A"}
                          </div>
                          <small
                            className="text-muted"
                            style={{ fontSize: "0.8rem" }}
                          >
                            {user.position || "No position"}
                          </small>
                        </td>

                        <td>{getStatusBadge(user)}</td>

                        <td>{getActivityBadge(user)}</td>

                        <td>
                          <div
                            className="fw-semibold text-dark text-truncate"
                            style={{ fontSize: "0.9rem" }}
                            title={user.barangay_name || "N/A"}
                          >
                            {user.barangay_name || "N/A"}
                          </div>
                          <small
                            className="text-muted"
                            style={{ fontSize: "0.8rem" }}
                          >
                            {user.municipality || "N/A"}
                          </small>
                        </td>

                        <td className="text-center">
                          <div
                            className="fw-semibold text-dark"
                            style={{ fontSize: "0.85rem" }}
                            title={formatLocalDateTime(user.created_at)}
                          >
                            {formatLocalDateTime(user.created_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="card-footer bg-white border-top-0 py-3">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div className="text-center text-md-start">
                      <small className="text-muted">
                        Showing{" "}
                        <span className="fw-semibold">
                          {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}
                        </span>{" "}
                        of{" "}
                        <span className="fw-semibold">{filteredUsers.length}</span>{" "}
                        entries
                      </small>
                    </div>

                    <div className="d-flex flex-column flex-sm-row align-items-center gap-2">
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm pagination-btn"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1 || isActionDisabled()}
                          style={{
                            backgroundColor: "transparent",
                            borderColor: "var(--primary-color)",
                            color: "var(--primary-color)",
                            minWidth: "80px",
                          }}
                        >
                          <i className="fas fa-chevron-left me-1 d-none d-sm-inline"></i>
                          <span className="d-none d-sm-inline">Previous</span>
                          <span className="d-sm-none">Prev</span>
                        </button>

                        <div className="d-none d-md-flex gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              if (totalPages <= 7) return true;
                              if (page === 1 || page === totalPages) return true;
                              if (Math.abs(page - currentPage) <= 1) return true;
                              return false;
                            })
                            .map((page, index, array) => {
                              const showEllipsis = index > 0 && page - array[index - 1] > 1;
                              return (
                                <React.Fragment key={page}>
                                  {showEllipsis && (
                                    <span className="px-2 text-muted">...</span>
                                  )}
                                  <button
                                    className={`btn btn-sm pagination-page-btn ${
                                      currentPage === page ? "active" : ""
                                    }`}
                                    onClick={() => setCurrentPage(page)}
                                    disabled={isActionDisabled()}
                                    style={
                                      currentPage === page
                                        ? {
                                            backgroundColor: "var(--btn-primary-bg)",
                                            borderColor: "var(--btn-primary-bg)",
                                            minWidth: "40px",
                                            color: "white",
                                          }
                                        : {
                                            backgroundColor: "transparent",
                                            borderColor: "var(--primary-color)",
                                            color: "var(--primary-color)",
                                            minWidth: "40px",
                                          }
                                    }
                                  >
                                    {page}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>

                        <div className="d-md-none d-flex align-items-center px-3">
                          <small className="text-muted">
                            Page <span className="fw-bold">{currentPage}</span> of{" "}
                            <span className="fw-bold">{totalPages}</span>
                          </small>
                        </div>

                        <button
                          className="btn btn-sm pagination-btn"
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages || isActionDisabled()}
                          style={{
                            backgroundColor: "transparent",
                            borderColor: "var(--primary-color)",
                            color: "var(--primary-color)",
                            minWidth: "80px",
                          }}
                        >
                          <span className="d-none d-sm-inline">Next</span>
                          <span className="d-sm-none">Next</span>
                          <i className="fas fa-chevron-right ms-1 d-none d-sm-inline"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Global Action Lock Overlay */}
      {actionLock && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <div className="bg-white rounded p-3 shadow-sm d-flex align-items-center">
            <div className="spinner-border text-primary me-2" role="status">
              <span className="visually-hidden">Processing...</span>
            </div>
            <span className="text-muted">Processing action...</span>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;