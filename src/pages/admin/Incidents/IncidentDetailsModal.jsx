// components/admin/IncidentDetailsModal.jsx
import React, { useEffect } from "react";
import Portal from "../../../components/Portal";

const IncidentDetailsModal = ({ incident, onClose }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleEscapeKey);
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "auto";
    };
  }, []);

  const getSeverityBadge = (severity) => {
    const severityStyles = {
      Low: "bg-success text-white",
      Medium: "bg-warning text-dark",
      High: "bg-danger text-white",
      Critical: "bg-dark text-white",
    };
    return severityStyles[severity] || "bg-secondary text-white";
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      Reported: "bg-primary text-white",
      Investigating: "bg-info text-white",
      Resolved: "bg-success text-white",
      Closed: "bg-secondary text-white",
    };
    return statusStyles[status] || "bg-secondary text-white";
  };

  const getTypeIcon = (type) => {
    const typeIcons = {
      Flood: "fa-water",
      Landslide: "fa-mountain",
      Fire: "fa-fire",
      Earthquake: "fa-house-damage",
      Vehicular: "fa-car-crash",
    };
    return typeIcons[type] || "fa-exclamation-triangle";
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } catch (error) {
      return "Date Error";
    }
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Time";

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Time Error";
    }
  };

  const getVulnerableGroupsBadges = (groups) => {
    if (!groups || groups.length === 0) return null;

    return groups.map((group, index) => (
      <span
        key={index}
        className="badge bg-info me-1 mb-1"
        style={{ fontSize: "0.7rem" }}
      >
        {group}
      </span>
    ));
  };

  const getCasualtyBadge = (casualty) => {
    if (!casualty) return null;

    const styles = {
      Dead: "bg-dark text-white",
      "Injured/ill": "bg-warning text-dark",
      Missing: "bg-secondary text-white",
    };

    return (
      <span
        className={`badge ${styles[casualty]}`}
        style={{ fontSize: "0.7rem" }}
      >
        {casualty}
      </span>
    );
  };

  const getRoadStatusBadge = (status) => {
    const styles = {
      PASSABLE: "bg-success text-white",
      NOT_PASSABLE: "bg-danger text-white",
    };
    return (
      <span className={`badge ${styles[status] || "bg-secondary"}`}>
        {status?.replace("_", " ") || "Unknown"}
      </span>
    );
  };

  // Helper function to render assistance badges for families
  const renderFamilyAssistanceBadges = (family) => {
    const assistanceTypes = [];

    if (family.assistance_received) {
      assistanceTypes.push("Assistance Received");
    }
    if (family.food_assistance) {
      assistanceTypes.push("Food Assistance");
    }
    if (family.non_food_assistance) {
      assistanceTypes.push("Non-Food Assistance");
    }
    if (family.shelter_assistance) {
      assistanceTypes.push("Shelter Assistance");
    }
    if (family.medical_assistance) {
      assistanceTypes.push("Medical Assistance");
    }

    if (assistanceTypes.length === 0) {
      return <span className="badge bg-secondary">No Assistance</span>;
    }

    return assistanceTypes.map((type, index) => (
      <span key={index} className="badge bg-success me-1 mb-1">
        <i className="fas fa-check-circle me-1"></i>
        {type}
      </span>
    ));
  };

  // Helper function to render assistance badges for members
  const renderMemberAssistanceBadges = (member) => {
    const assistanceTypes = [];

    if (member.assistance_received) {
      assistanceTypes.push("Assistance Received");
    }
    if (member.food_assistance) {
      assistanceTypes.push("Food Assistance");
    }
    if (member.non_food_assistance) {
      assistanceTypes.push("Non-Food Assistance");
    }
    if (member.medical_attention) {
      assistanceTypes.push("Medical Attention");
    }
    if (member.psychological_support) {
      assistanceTypes.push("Psychological Support");
    }

    if (assistanceTypes.length === 0) {
      return <span className="badge bg-secondary">No Assistance</span>;
    }

    return assistanceTypes.map((type, index) => (
      <span
        key={index}
        className="badge bg-success me-1 mb-1"
        style={{ fontSize: "0.65rem" }}
      >
        <i className="fas fa-check-circle me-1"></i>
        {type}
      </span>
    ));
  };

  return (
    <Portal>
      <div
        className="modal fade show d-block"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
        onClick={handleBackdropClick}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered modal-xl mx-3 mx-sm-auto">
          <div
            className="modal-content border-0"
            style={{
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div
              className="modal-header border-0 text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)",
              }}
            >
              <h5 className="modal-title fw-bold">
                <i className="fas fa-eye me-2"></i>
                Incident Details
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            <div
              className="modal-body bg-light"
              style={{
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <div className="row g-3">
                {/* Incident Header */}
                <div className="col-12">
                  <div className="card border-0 bg-white">
                    <div className="card-body p-3">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: "50px",
                              height: "50px",
                              background:
                                "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)",
                            }}
                          >
                            <i
                              className={`fas ${getTypeIcon(
                                incident.incident_type
                              )} text-white`}
                            ></i>
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <h4 className="mb-2 text-dark fw-bold">
                            {incident.title}
                          </h4>
                          <div className="d-flex flex-wrap gap-2">
                            <span
                              className={`badge ${getSeverityBadge(
                                incident.severity
                              )}`}
                            >
                              {incident.severity}
                            </span>
                            <span
                              className={`badge ${getStatusBadge(
                                incident.status
                              )}`}
                            >
                              {incident.status}
                            </span>
                            <span className="badge bg-light text-dark border">
                              <i
                                className={`fas ${getTypeIcon(
                                  incident.incident_type
                                )} me-1`}
                              ></i>
                              {incident.incident_type}
                            </span>
                            {incident.completeness_score && (
                              <span
                                className={`badge ${
                                  incident.completeness_score >= 80
                                    ? "bg-success"
                                    : incident.completeness_score >= 60
                                    ? "bg-warning"
                                    : "bg-secondary"
                                } text-white`}
                              >
                                Data: {incident.completeness_score}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="col-12 col-md-6">
                  <div
                    className="card border-0 bg-white"
                    style={{ height: "100%" }}
                  >
                    <div className="card-header border-bottom bg-white py-2">
                      <h6 className="mb-0 fw-semibold text-dark">
                        <i className="fas fa-info-circle me-2 text-primary"></i>
                        Basic Information
                      </h6>
                    </div>
                    <div className="card-body p-2">
                      <table className="table table-sm table-borderless mb-0">
                        <tbody>
                          <tr>
                            <td
                              className="fw-semibold text-muted"
                              style={{ width: "40%" }}
                            >
                              Location:
                            </td>
                            <td>{incident.location}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold text-muted">
                              Barangay:
                            </td>
                            <td>{incident.barangay}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold text-muted">Purok:</td>
                            <td>{incident.purok || "N/A"}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold text-muted">
                              Incident Date:
                            </td>
                            <td>{formatDateTime(incident.incident_date)}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold text-muted">
                              Reported Date:
                            </td>
                            <td>{formatDateTime(incident.created_at)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Reporter Information */}
                <div className="col-12 col-md-6">
                  <div
                    className="card border-0 bg-white"
                    style={{ height: "100%" }}
                  >
                    <div className="card-header border-bottom bg-white py-2">
                      <h6 className="mb-0 fw-semibold text-dark">
                        <i className="fas fa-user me-2 text-dark"></i>
                        Reporter Information
                      </h6>
                    </div>
                    <div className="card-body p-2">
                      <table className="table table-sm table-borderless mb-0">
                        <tbody>
                          <tr>
                            <td
                              className="fw-semibold text-muted"
                              style={{ width: "40%" }}
                            >
                              Reported By:
                            </td>
                            <td>{incident.reporter?.name || "N/A"}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold text-muted">
                              Barangay:
                            </td>
                            <td>
                              {incident.reporter?.barangay_name || "N/A"},{" "}
                              {incident.reporter?.municipality || "N/A"}
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-semibold text-muted">Contact:</td>
                            <td>{incident.reporter?.email || "N/A"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Impact Summary */}
                <div className="col-12 col-md-6">
                  <div
                    className="card border-0 bg-white"
                    style={{ height: "100%" }}
                  >
                    <div className="card-header border-bottom bg-white py-2">
                      <h6 className="mb-0 fw-semibold text-dark">
                        <i className="fas fa-chart-bar me-2 text-warning"></i>
                        Impact Summary
                      </h6>
                    </div>
                    <div className="card-body p-2">
                      <div className="row text-center g-2">
                        <div className="col-6">
                          <div className="h5 mb-0 fw-bold text-primary">
                            {incident.affected_families}
                          </div>
                          <small className="text-muted">Families</small>
                        </div>
                        <div className="col-6">
                          <div className="h5 mb-0 fw-bold text-info">
                            {incident.affected_individuals}
                          </div>
                          <small className="text-muted">Persons</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

{/* Casualties Summary */}
<div className="col-12 col-md-6">
  <div
    className="card border-0 bg-white"
    style={{ height: "100%" }}
  >
    <div className="card-header border-bottom bg-white py-2">
      <h6 className="mb-0 fw-semibold text-dark">
        <i className="fas fa-heartbeat me-2 text-danger"></i>
        Casualties Summary
      </h6>
    </div>
    <div className="card-body p-2">
      <div className="row text-center g-2">
        <div className="col-4">
          <div className="h5 mb-0 fw-bold text-dark">
            {incident.calculated_casualties?.dead || 
             incident.casualties?.dead || 0}
          </div>
          <small className="text-muted">Deceased</small>
        </div>
        <div className="col-4">
          <div className="h5 mb-0 fw-bold text-warning">
            {incident.calculated_casualties?.injured || 
             incident.casualties?.injured || 0}
          </div>
          <small className="text-muted">Injured</small>
        </div>
        <div className="col-4">
          <div className="h5 mb-0 fw-bold text-secondary">
            {incident.calculated_casualties?.missing || 
             incident.casualties?.missing || 0}
          </div>
          <small className="text-muted">Missing</small>
        </div>
      </div>
    </div>
  </div>
</div>

                {/* Description */}
                <div className="col-12">
                  <div className="card border-0 bg-white">
                    <div className="card-header border-bottom bg-white py-2">
                      <h6 className="mb-0 fw-semibold text-dark">
                        <i className="fas fa-align-left me-2 text-success"></i>
                        Description
                      </h6>
                    </div>
                    <div className="card-body p-2">
                      <p
                        className="mb-0 text-dark"
                        style={{ lineHeight: "1.6" }}
                      >
                        {incident.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Infrastructure Status */}
                {incident.infrastructure_status && (
                  <div className="col-12">
                    <div className="card border-0 bg-white">
                      <div className="card-header border-bottom bg-white py-2">
                        <h6 className="mb-0 fw-semibold text-dark">
                          <i className="fas fa-road me-2 text-warning"></i>
                          Infrastructure Status
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          {/* Roads and Bridges */}
                          <div className="col-12 col-md-6 mb-4">
                            <h6 className="fw-semibold text-primary mb-3">
                              <i className="fas fa-road me-2"></i>
                              Roads & Bridges
                            </h6>
                            <div className="row g-2">
                              <div className="col-12">
                                <span className="fw-semibold text-muted">
                                  Status:{" "}
                                </span>
                                {getRoadStatusBadge(
                                  incident.infrastructure_status
                                    .roads_bridges_status
                                )}
                              </div>
                              {incident.infrastructure_status
                                .roads_reported_not_passable && (
                                <div className="col-12">
                                  <span className="fw-semibold text-muted">
                                    Reported Not Passable:{" "}
                                  </span>
                                  <span className="text-dark">
                                    {formatDateTime(
                                      incident.infrastructure_status
                                        .roads_reported_not_passable
                                    )}
                                  </span>
                                </div>
                              )}
                              {incident.infrastructure_status
                                .roads_reported_passable && (
                                <div className="col-12">
                                  <span className="fw-semibold text-muted">
                                    Reported Passable:{" "}
                                  </span>
                                  <span className="text-dark">
                                    {formatDateTime(
                                      incident.infrastructure_status
                                        .roads_reported_passable
                                    )}
                                  </span>
                                </div>
                              )}
                              {incident.infrastructure_status.roads_remarks && (
                                <div className="col-12">
                                  <span className="fw-semibold text-muted">
                                    Remarks:{" "}
                                  </span>
                                  <span className="text-dark">
                                    {
                                      incident.infrastructure_status
                                        .roads_remarks
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Power Supply */}
                          <div className="col-12 col-md-6 mb-4">
                            <h6 className="fw-semibold text-primary mb-3">
                              <i className="fas fa-bolt me-2"></i>
                              Power Supply
                            </h6>
                            <div className="row g-2">
                              {incident.infrastructure_status
                                .power_outage_time && (
                                <div className="col-12">
                                  <span className="fw-semibold text-muted">
                                    Outage Time:{" "}
                                  </span>
                                  <span className="text-dark">
                                    {formatDateTime(
                                      incident.infrastructure_status
                                        .power_outage_time
                                    )}
                                  </span>
                                </div>
                              )}
                              {incident.infrastructure_status
                                .power_restored_time && (
                                <div className="col-12">
                                  <span className="fw-semibold text-muted">
                                    Restored Time:{" "}
                                  </span>
                                  <span className="text-dark">
                                    {formatDateTime(
                                      incident.infrastructure_status
                                        .power_restored_time
                                    )}
                                  </span>
                                </div>
                              )}
                              {incident.infrastructure_status.power_remarks && (
                                <div className="col-12">
                                  <span className="fw-semibold text-muted">
                                    Remarks:{" "}
                                  </span>
                                  <span className="text-dark">
                                    {
                                      incident.infrastructure_status
                                        .power_remarks
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Communication Lines */}
                          <div className="col-12 col-md-6 mb-4">
                            <h6 className="fw-semibold text-primary mb-3">
                              <i className="fas fa-signal me-2"></i>
                              Communication Lines
                            </h6>
                            <div className="row g-2">
                              {incident.infrastructure_status
                                .communication_interruption_time && (
                                <div className="col-12">
                                  <span className="fw-semibold text-muted">
                                    Interruption Time:{" "}
                                  </span>
                                  <span className="text-dark">
                                    {formatDateTime(
                                      incident.infrastructure_status
                                        .communication_interruption_time
                                    )}
                                  </span>
                                </div>
                              )}
                              {incident.infrastructure_status
                                .communication_restored_time && (
                                <div className="col-12">
                                  <span className="fw-semibold text-muted">
                                    Restored Time:{" "}
                                  </span>
                                  <span className="text-dark">
                                    {formatDateTime(
                                      incident.infrastructure_status
                                        .communication_restored_time
                                    )}
                                  </span>
                                </div>
                              )}
                              {incident.infrastructure_status
                                .communication_remarks && (
                                <div className="col-12">
                                  <span className="fw-semibold text-muted">
                                    Remarks:{" "}
                                  </span>
                                  <span className="text-dark">
                                    {
                                      incident.infrastructure_status
                                        .communication_remarks
                                    }
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Population Data Summary */}
                {incident.population_data && (
                  <div className="col-12">
                    <div className="card border-0 bg-white">
                      <div className="card-header border-bottom bg-white py-2">
                        <h6 className="mb-0 fw-semibold text-dark">
                          <i className="fas fa-chart-pie me-2 text-primary"></i>
                          Population Data Summary
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-12 col-md-6 mb-3">
                            <h6 className="fw-semibold text-primary mb-2">
                              Displacement & Assistance
                            </h6>
                            <div className="row text-center">
                              <div className="col-6 mb-2">
                                <div className="h5 mb-1 fw-bold text-warning">
                                  {incident.population_data.displaced_families}
                                </div>
                                <small className="text-muted">
                                  Displaced Families
                                </small>
                              </div>
                              <div className="col-6 mb-2">
                                <div className="h5 mb-1 fw-bold text-warning">
                                  {incident.population_data.displaced_persons}
                                </div>
                                <small className="text-muted">
                                  Displaced Persons
                                </small>
                              </div>
                            </div>
                          </div>
                          <div className="col-12 col-md-6 mb-3">
                            <h6 className="fw-semibold text-primary mb-2">
                              Gender Distribution
                            </h6>
                            <div className="row text-center">
                              <div className="col-4 mb-2">
                                <div className="h5 mb-1 fw-bold text-primary">
                                  {incident.population_data.male_count}
                                </div>
                                <small className="text-muted">Male</small>
                              </div>
                              <div className="col-4 mb-2">
                                <div className="h5 mb-1 fw-bold text-danger">
                                  {incident.population_data.female_count}
                                </div>
                                <small className="text-muted">Female</small>
                              </div>
                              <div className="col-4 mb-2">
                                <div className="h5 mb-1 fw-bold text-success">
                                  {incident.population_data.lgbtqia_count}
                                </div>
                                <small className="text-muted">LGBTQIA+</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Family Information - ADDED FROM BARANGAY VIEW */}
                {incident.families && incident.families.length > 0 && (
                  <div className="col-12">
                    <div className="card border-0 bg-white">
                      <div className="card-header border-bottom bg-white py-2">
                        <h6 className="mb-0 fw-semibold text-dark">
                          <i className="fas fa-users me-2 text-info"></i>
                          Family Details ({
                            incident.families.length
                          } families, {incident.affected_individuals} persons)
                        </h6>
                      </div>
                      <div className="card-body p-0">
                        {incident.families.map((family, familyIndex) => (
                          <div
                            key={family.id}
                            className="family-section border-bottom"
                          >
                            <div className="p-3 bg-light">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0 fw-bold text-dark">
                                  <span className="badge bg-primary me-2">
                                    {familyIndex + 1}
                                  </span>
                                  Family {family.family_number} (
                                  {family.members.length} members)
                                </h6>
                                <div className="d-flex gap-2">
                                  {family.evacuation_center && (
                                    <span className="badge bg-warning text-dark">
                                      <i className="fas fa-home me-1"></i>
                                      {family.evacuation_center}
                                    </span>
                                  )}
                                  {/* Family Assistance Badges */}
                                  <div className="d-flex flex-wrap gap-1">
                                    {renderFamilyAssistanceBadges(family)}
                                  </div>
                                </div>
                              </div>

                              {/* Family Other Remarks */}
                              {family.other_remarks && (
                                <div className="mb-2">
                                  <small className="text-muted fw-semibold">
                                    Admin Remarks:{" "}
                                  </small>
                                  <small className="text-dark">
                                    {family.other_remarks}
                                  </small>
                                </div>
                              )}
                            </div>

                            <div className="table-responsive">
                              <table className="table table-sm table-striped mb-0">
                                <thead className="bg-light">
                                  <tr>
                                    <th style={{ width: "50px" }}>#</th>
                                    <th>Name</th>
                                    <th>Position</th>
                                    <th>Gender</th>
                                    <th>Age</th>
                                    <th>Category</th>
                                    <th>Civil Status</th>
                                    <th>Ethnicity</th>
                                    <th>Vulnerable</th>
                                    <th>Status</th>
                                    <th>Displaced</th>
                                    <th>Assistance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {family.members.map((member, memberIndex) => (
                                    <tr key={member.id}>
                                      <td className="fw-bold text-muted">
                                        {memberIndex + 1}
                                      </td>
                                      <td>
                                        <div
                                          className="fw-semibold text-dark"
                                          style={{
                                            fontSize: "0.85rem",
                                            lineHeight: "1.2",
                                          }}
                                        >
                                          {member.first_name}{" "}
                                          {member.middle_name
                                            ? `${member.middle_name} `
                                            : ""}
                                          {member.last_name}
                                        </div>
                                      </td>
                                      <td>
                                        <span
                                          className="badge bg-primary"
                                          style={{ fontSize: "0.7rem" }}
                                        >
                                          {member.position_in_family}
                                        </span>
                                      </td>
                                      <td>{member.sex_gender_identity}</td>
                                      <td>{member.age}</td>
                                      <td>
                                        <span
                                          className="badge bg-secondary"
                                          style={{ fontSize: "0.7rem" }}
                                        >
                                          {member.category}
                                        </span>
                                      </td>
                                      <td>{member.civil_status}</td>
                                      <td>{member.ethnicity}</td>
                                      <td>
                                        <div style={{ maxWidth: "150px" }}>
                                          {getVulnerableGroupsBadges(
                                            member.vulnerable_groups
                                          )}
                                          {member.pwd_type && (
                                            <span
                                              className="badge bg-dark me-1 mb-1"
                                              style={{ fontSize: "0.6rem" }}
                                            >
                                              {member.pwd_type}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td>
                                        {getCasualtyBadge(member.casualty)}
                                      </td>
                                      <td>
                                        <span
                                          className={`badge ${
                                            member.displaced === "Y"
                                              ? "bg-danger"
                                              : "bg-success"
                                          }`}
                                        >
                                          {member.displaced === "Y"
                                            ? "Yes"
                                            : "No"}
                                        </span>
                                      </td>
                                      {/* Assistance Column */}
                                      <td>
                                        <div style={{ maxWidth: "200px" }}>
                                          {renderMemberAssistanceBadges(member)}
                                          {member.other_remarks && (
                                            <div className="mt-1">
                                              <small
                                                className="text-muted d-block"
                                                style={{ fontSize: "0.65rem" }}
                                              >
                                                <i className="fas fa-sticky-note me-1"></i>
                                                {member.other_remarks}
                                              </small>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                {incident.admin_notes && (
                  <div className="col-12">
                    <div className="card border-0 bg-white">
                      <div className="card-header border-bottom bg-white py-2">
                        <h6 className="mb-0 fw-semibold text-dark">
                          <i className="fas fa-sticky-note me-2 text-info"></i>
                          Admin Notes
                        </h6>
                      </div>
                      <div className="card-body p-2">
                        <p
                          className="mb-0 text-dark"
                          style={{ lineHeight: "1.6" }}
                        >
                          {incident.admin_notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Response Actions */}
                {incident.response_actions && (
                  <div className="col-12">
                    <div className="card border-0 bg-white">
                      <div className="card-header border-bottom bg-white py-2">
                        <h6 className="mb-0 fw-semibold text-dark">
                          <i className="fas fa-tasks me-2 text-primary"></i>
                          Response Actions
                        </h6>
                      </div>
                      <div className="card-body p-2">
                        <p
                          className="mb-0 text-dark"
                          style={{ lineHeight: "1.6" }}
                        >
                          {incident.response_actions}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer border-top bg-white">
              <button
                type="button"
                className="btn btn-primary text-white fw-semibold"
                onClick={onClose}
              >
                <i className="fas fa-times me-2"></i>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default IncidentDetailsModal;
