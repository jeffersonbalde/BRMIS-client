// components/incident/IncidentReportModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { showAlert, showToast } from "../../../services/notificationService";
import Portal from "../../../components/Portal";

const IncidentReportModal = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    // Basic Incident Information
    incident_type: "Flood",
    title: "",
    description: "",
    location: "",
    barangay: "",
    purok: "",
    incident_date: new Date().toISOString().slice(0, 16),
    severity: "Medium",

    // Families Data
    families: [],

    // Summary for quick entry
    total_families: 1,
  });

  // Complete dropdown data from Excel third tab - REMOVED assistance_given
  const dropdownData = {
    incident_types: ["Flood", "Landslide", "Fire", "Earthquake", "Vehicular"],
    barangays: [
      "BOGAYO",
      "BOLISONG",
      "BOYUGAN East",
      "BOYUGAN West",
      "BUALAN",
      "DIPLO",
      "GAWIL",
      "GUSOM",
      "KITAANG DAGAT",
      "LANTAWAN",
      "LIMAMAWAN",
      "MAHAYAHAY",
      "PANGI",
      "PICANAN",
      "POBLACION",
      "SALAGMANOK",
      "SICADE",
      "SUMINALOM",
    ],
    sex_gender_identity: [
      "Male",
      "Female",
      "LGBTQIA+ / Other (self-identified)",
      "Prefer not to say",
    ],
    civil_status: [
      "Single",
      "Married",
      "Widowed",
      "Separated",
      "Live-In/Cohabiting",
    ],
    position_in_family: [
      "Head (Father)",
      "Head (Mother)",
      "Head (Solo Parent)",
      "Head (Single)",
      "Head (Child)",
      "Member",
    ],
    categories: [
      "Infant (0-6 mos)",
      "Toddlers (7 mos- 2 y/o)",
      "Preschooler (3-5 y/o)",
      "School Age (6-12 y/o)",
      "Teen Age (13-17 y/o)",
      "Adult (18-59 y/o)",
      "Elderly (60 and above)",
    ],
    ethnicity: ["CHRISTIAN", "SUBANEN (IPs)", "MORO"],
    vulnerable_groups: [
      "PWD",
      "Pregnant",
      "Elderly",
      "Lactating Mother",
      "Solo parent",
      "Indigenous People",
      "LGBTQIA+ Persons",
      "Child-Headed Household",
      "Victim of Gender-Based Violence (GBV)",
      "4Ps Beneficiaries",
      "Single Headed Family",
    ],
    casualty: ["Dead", "Injured/ill", "Missing"],
    pwd_types: [
      "Psychosocial Disability",
      "Hearing Disability",
      "Visual Disability",
      "Orthopedic Disability",
      "Intellectual Disability",
      "Speech and Language Disability",
      "Learning Disability",
      "Multiple Disability",
    ],
  };

  // Initialize families based on total_families
  useEffect(() => {
    const familiesCount = parseInt(form.total_families) || 1;
    const currentFamilies = form.families || [];

    if (familiesCount > currentFamilies.length) {
      // Add new families
      const newFamilies = [];
      for (let i = currentFamilies.length; i < familiesCount; i++) {
        newFamilies.push({
          family_number: i + 1,
          family_size: 1, // Start with 1 member per family
          evacuation_center: "",
          alternative_location: "",
          // REMOVED: assistance_given and remarks for barangay side
          members: [
            {
              last_name: "",
              first_name: "",
              middle_name: "",
              position_in_family: "",
              sex_gender_identity: "",
              age: "",
              category: "",
              civil_status: "",
              ethnicity: "",
              vulnerable_groups: [],
              casualty: "",
              displaced: "N",
              pwd_type: "",
            },
          ],
        });
      }
      setForm((prev) => ({
        ...prev,
        families: [...currentFamilies, ...newFamilies],
      }));
    } else if (familiesCount < currentFamilies.length) {
      // Remove extra families
      setForm((prev) => ({
        ...prev,
        families: currentFamilies.slice(0, familiesCount),
      }));
    }
  }, [form.total_families]);

  const handleBasicInfoChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFamilyChange = (familyIndex, field, value) => {
    setForm((prev) => ({
      ...prev,
      families: prev.families.map((family, index) =>
        index === familyIndex ? { ...family, [field]: value } : family
      ),
    }));
  };

  const handleMemberChange = (familyIndex, memberIndex, field, value) => {
    setForm((prev) => ({
      ...prev,
      families: prev.families.map((family, fIndex) =>
        fIndex === familyIndex
          ? {
              ...family,
              members: family.members.map((member, mIndex) =>
                mIndex === memberIndex ? { ...member, [field]: value } : member
              ),
            }
          : family
      ),
    }));
  };

  const addFamilyMember = (familyIndex) => {
    setForm((prev) => ({
      ...prev,
      families: prev.families.map((family, index) =>
        index === familyIndex
          ? {
              ...family,
              members: [
                ...family.members,
                {
                  last_name: "",
                  first_name: "",
                  middle_name: "",
                  position_in_family: "",
                  sex_gender_identity: "",
                  age: "",
                  category: "",
                  civil_status: "",
                  ethnicity: "",
                  vulnerable_groups: [],
                  casualty: "",
                  displaced: "N",
                  pwd_type: "",
                },
              ],
              family_size: family.members.length + 1,
            }
          : family
      ),
    }));
  };

  const removeFamilyMember = (familyIndex, memberIndex) => {
    setForm((prev) => ({
      ...prev,
      families: prev.families.map((family, index) =>
        index === familyIndex
          ? {
              ...family,
              members: family.members.filter(
                (_, mIndex) => mIndex !== memberIndex
              ),
              family_size: family.members.length - 1,
            }
          : family
      ),
    }));
  };

  const updateFamilySize = (familyIndex) => {
    setForm((prev) => ({
      ...prev,
      families: prev.families.map((family, index) =>
        index === familyIndex
          ? { ...family, family_size: family.members.length }
          : family
      ),
    }));
  };

  const validateForm = () => {
    // Basic incident information validation
    const basicFields = [
      { field: "title", label: "Incident Title" },
      { field: "location", label: "Location" },
      { field: "barangay", label: "Barangay" },
      { field: "incident_type", label: "Incident Type" },
    ];

    const missingBasicFields = basicFields.filter(
      ({ field, label }) => !form[field] || form[field].toString().trim() === ""
    );

    if (missingBasicFields.length > 0) {
      const fieldNames = missingBasicFields.map((f) => f.label).join(", ");
      showAlert.error(
        "Missing Basic Information",
        `Please fill in the following required fields:\n\n${fieldNames}`
      );
      return false;
    }

    // Validate each family and member
    for (const family of form.families) {
      // Check if family has at least 1 member
      if (!family.members || family.members.length === 0) {
        showAlert.error(
          "Family Member Required",
          `Family ${family.family_number} must have at least 1 member. Please add family members.`
        );
        return false;
      }

      // Validate each family member
      for (const [memberIndex, member] of family.members.entries()) {
        const memberNumber = memberIndex + 1;

        // Define required fields for each member
        const requiredMemberFields = [
          { field: "last_name", label: "Last Name" },
          { field: "first_name", label: "First Name" },
          { field: "position_in_family", label: "Position in Family" },
          { field: "sex_gender_identity", label: "Sex/Gender Identity" },
          { field: "age", label: "Age" },
          { field: "category", label: "Category" },
          { field: "civil_status", label: "Civil Status" },
          { field: "ethnicity", label: "Ethnicity" },
        ];

        // Check for missing required fields
        const missingFields = requiredMemberFields.filter(
          ({ field, label }) =>
            !member[field] || member[field].toString().trim() === ""
        );

        if (missingFields.length > 0) {
          const fieldNames = missingFields.map((f) => f.label).join(", ");
          showAlert.error(
            "Missing Family Member Information",
            `Family ${family.family_number}, Member ${memberNumber} (${
              member.first_name || "Unnamed"
            } ${
              member.last_name || ""
            }):\n\nPlease fill in the following required fields:\n${fieldNames}`
          );
          return false;
        }

        // Validate age range
        if (member.age < 0 || member.age > 120) {
          showAlert.error(
            "Invalid Age",
            `Family ${family.family_number}, Member ${memberNumber} (${member.first_name} ${member.last_name}):\n\nAge must be between 0 and 120 years.`
          );
          return false;
        }

        // Validate age is a number
        if (isNaN(member.age) || member.age === "") {
          showAlert.error(
            "Invalid Age",
            `Family ${family.family_number}, Member ${memberNumber} (${member.first_name} ${member.last_name}):\n\nAge must be a valid number.`
          );
          return false;
        }
      }
    }

    return true;
  };

  const validateField = (field, value, fieldName) => {
    if (!value || value.toString().trim() === "") {
      return `${fieldName} is required`;
    }

    if (field === "age") {
      const age = parseInt(value);
      if (isNaN(age)) return "Age must be a number";
      if (age < 0 || age > 120) return "Age must be between 0 and 120";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const totalPersons = form.families.reduce(
      (total, family) => total + family.members.length,
      0
    );

    const confirmation = await showAlert.confirm(
      "Confirm Incident Report",
      `Are you sure you want to report this incident?\n\nSummary:\n• ${form.total_families} families affected\n• ${totalPersons} total persons\n• Location: ${form.location}, ${form.barangay}\n• Type: ${form.incident_type}`,
      "Yes, Report Incident",
      "Review Details"
    );

    if (!confirmation.isConfirmed) return;

    setIsSubmitting(true);

    try {
      showAlert.processing(
        "Reporting Incident",
        "Please wait while we save your incident report..."
      );

      const submissionData = {
        ...form,
        incident_date: new Date(form.incident_date).toISOString(),
        affected_families: form.families.length,
        affected_individuals: totalPersons,
        // Remove temporary fields
        total_families: undefined,
      };

      console.log("Submitting data:", submissionData); // Debug log

      const response = await fetch(
        `${import.meta.env.VITE_LARAVEL_API}/incidents/with-families`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        }
      );

      const data = await response.json();
      console.log("Response:", data); // Debug log
      showAlert.close();

      if (response.ok) {
        await showAlert.customSuccess(
          "Incident Reported Successfully!",
          `Your incident has been reported with detailed family information.`,
          "Okay, Got It"
        );
        onSuccess();
      } else {
        console.error("Server error details:", data); // Debug log

        if (response.status === 422 && data.errors) {
          const errorMessages = Object.values(data.errors).flat();
          const errorMessage =
            errorMessages.length > 0
              ? errorMessages.join("\n")
              : "Please check all required fields and try again.";
          showAlert.error("Validation Error", errorMessage);
        } else if (data.validation_errors) {
          const errorMessages = data.validation_errors.map(
            (error) => `${error.field}: ${error.messages.join(", ")}`
          );
          showAlert.error("Validation Error", errorMessages.join("\n"));
        } else {
          // Show more detailed error message
          const errorDetail =
            data.error || data.message || "Unknown error occurred";
          showAlert.error("Error", `Failed to report incident: ${errorDetail}`);
        }
      }
    } catch (error) {
      console.error("Network error:", error); // Debug log
      showAlert.close();
      showAlert.error(
        "Connection Error",
        "Failed to connect to server. Please check your internet connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Validate basic information before proceeding to step 2
    const basicFields = [
      { field: "title", label: "Incident Title" },
      { field: "location", label: "Location" },
      { field: "barangay", label: "Barangay" },
      { field: "incident_type", label: "Incident Type" },
    ];

    const missingBasicFields = basicFields.filter(
      ({ field, label }) => !form[field] || form[field].toString().trim() === ""
    );

    if (missingBasicFields.length > 0) {
      const fieldNames = missingBasicFields.map((f) => f.label).join(", ");
      showAlert.error(
        "Missing Information",
        `Please fill in the following required fields before proceeding:\n\n${fieldNames}`
      );
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const renderStep1 = () => (
    <div className="row g-3">
      <div className="col-12">
        <h6 className="text-primary mb-3">
          <i className="fas fa-info-circle me-2"></i>
          Basic Incident Information
        </h6>
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Incident Type *</label>
        <select
          value={form.incident_type}
          onChange={(e) =>
            handleBasicInfoChange("incident_type", e.target.value)
          }
          className="form-select"
          required
        >
          <option value="">Select Incident Type</option>
          {dropdownData.incident_types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Severity Level *</label>
        <select
          value={form.severity}
          onChange={(e) => handleBasicInfoChange("severity", e.target.value)}
          className="form-select"
          required
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
      </div>

      <div className="col-12">
        <label className="form-label fw-semibold">Incident Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => handleBasicInfoChange("title", e.target.value)}
          className="form-control"
          placeholder="Brief title describing the incident"
          required
        />
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Barangay *</label>
        <input
          type="text"
          value={form.barangay}
          onChange={(e) => handleBasicInfoChange("barangay", e.target.value)}
          className="form-control"
          placeholder="Enter barangay name"
          required
        />
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Purok</label>
        <input
          type="text"
          value={form.purok}
          onChange={(e) => handleBasicInfoChange("purok", e.target.value)}
          className="form-control"
          placeholder="Specific purok/area"
        />
      </div>

      <div className="col-12">
        <label className="form-label fw-semibold">Location *</label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => handleBasicInfoChange("location", e.target.value)}
          className="form-control"
          placeholder="Specific location within barangay"
          required
        />
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Incident Date & Time *</label>
        <input
          type="datetime-local"
          value={form.incident_date}
          onChange={(e) =>
            handleBasicInfoChange("incident_date", e.target.value)
          }
          className="form-control"
          required
        />
      </div>

      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Number of Families *</label>
        <input
          type="number"
          value={form.total_families}
          onChange={(e) =>
            handleBasicInfoChange(
              "total_families",
              parseInt(e.target.value) || 1
            )
          }
          className="form-control"
          min="1"
          max="100"
          required
        />
      </div>

      <div className="col-12">
        <label className="form-label fw-semibold">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => handleBasicInfoChange("description", e.target.value)}
          className="form-control"
          rows="3"
          placeholder="Detailed description of the incident..."
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div className="row mb-4">
        <div className="col-12">
          <h6 className="text-primary">
            <i className="fas fa-users me-2"></i>
            Family Information ({form.families.length} families)
          </h6>
          <p className="text-muted small">
            Please provide detailed information for each affected family member
          </p>
        </div>
      </div>

      <div
        className="families-container"
        style={{ maxHeight: "500px", overflowY: "auto" }}
      >
        {form.families.map((family, familyIndex) => (
          <div key={familyIndex} className="card mb-4 border-primary">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="fas fa-home me-2"></i>
                Family {family.family_number} ({family.members.length} members)
              </h6>
              <span className="badge bg-light text-dark">
                {family.members.filter((m) => m.displaced === "Y").length}{" "}
                displaced
              </span>
            </div>

            <div className="card-body">
              {/* Family-level information - REMOVED assistance_given and remarks */}
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">Family Size</label>
                  <input
                    type="number"
                    value={family.family_size}
                    onChange={(e) =>
                      handleFamilyChange(
                        familyIndex,
                        "family_size",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="form-control"
                    min="1"
                    disabled
                  />
                </div>
              </div>

              {/* Family Members */}
              <h6 className="text-secondary mb-3">
                Family Members
                <button
                  type="button"
                  className="btn btn-sm btn-success ms-2"
                  onClick={() => addFamilyMember(familyIndex)}
                >
                  <i className="fas fa-plus me-1"></i>
                  Add Member
                </button>
              </h6>

              {family.members.map((member, memberIndex) => (
                <div
                  key={memberIndex}
                  className="member-card border rounded p-3 mb-3"
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 text-dark">
                      Member {memberIndex + 1}
                      {member.position_in_family &&
                        ` - ${member.position_in_family}`}
                    </h6>
                    {family.members.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          removeFamilyMember(familyIndex, memberIndex);
                          updateFamilySize(familyIndex);
                        }}
                      >
                        <i className="fas fa-times"></i> Remove
                      </button>
                    )}
                  </div>

                  <div className="row g-2">
                    {/* Name Fields */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={member.last_name}
                        onChange={(e) =>
                          handleMemberChange(
                            familyIndex,
                            memberIndex,
                            "last_name",
                            e.target.value
                          )
                        }
                        className={`form-control form-control-sm ${
                          !member.last_name ? "is-invalid" : "is-valid"
                        }`}
                        required
                      />
                      {!member.last_name && (
                        <div className="invalid-feedback">
                          Last name is required
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={member.first_name}
                        onChange={(e) =>
                          handleMemberChange(
                            familyIndex,
                            memberIndex,
                            "first_name",
                            e.target.value
                          )
                        }
                        className={`form-control form-control-sm ${
                          !member.first_name ? "is-invalid" : "is-valid"
                        }`}
                        required
                      />
                      {!member.first_name && (
                        <div className="invalid-feedback">
                          First name is required
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={member.middle_name}
                        onChange={(e) =>
                          handleMemberChange(
                            familyIndex,
                            memberIndex,
                            "middle_name",
                            e.target.value
                          )
                        }
                        className="form-control form-control-sm"
                      />
                    </div>

                    {/* Basic Information */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">
                        Position in Family *
                      </label>
                      <select
                        value={member.position_in_family}
                        onChange={(e) =>
                          handleMemberChange(
                            familyIndex,
                            memberIndex,
                            "position_in_family",
                            e.target.value
                          )
                        }
                        className={`form-select form-select-sm ${
                          !member.position_in_family ? "is-invalid" : "is-valid"
                        }`}
                        required
                      >
                        <option value="">Select Position</option>
                        {dropdownData.position_in_family.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                      {!member.position_in_family && (
                        <div className="invalid-feedback">
                          Please select position in family
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">
                        Sex/Gender Identity *
                      </label>
                      <select
                        value={member.sex_gender_identity}
                        onChange={(e) =>
                          handleMemberChange(
                            familyIndex,
                            memberIndex,
                            "sex_gender_identity",
                            e.target.value
                          )
                        }
                        className={`form-select form-select-sm ${
                          !member.sex_gender_identity
                            ? "is-invalid"
                            : "is-valid"
                        }`}
                        required
                      >
                        <option value="">Select Gender</option>
                        {dropdownData.sex_gender_identity.map((gender) => (
                          <option key={gender} value={gender}>
                            {gender}
                          </option>
                        ))}
                      </select>
                      {!member.sex_gender_identity && (
                        <div className="invalid-feedback">
                          Please select gender identity
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold">
                        Age *
                      </label>
                      <input
                        type="number"
                        value={member.age}
                        onChange={(e) =>
                          handleMemberChange(
                            familyIndex,
                            memberIndex,
                            "age",
                            parseInt(e.target.value) || ""
                          )
                        }
                        className={`form-control form-control-sm ${
                          !member.age || member.age < 0 || member.age > 120
                            ? "is-invalid"
                            : "is-valid"
                        }`}
                        min="0"
                        max="120"
                        required
                      />
                      {(!member.age || member.age < 0 || member.age > 120) && (
                        <div className="invalid-feedback">
                          {!member.age
                            ? "Age is required"
                            : "Age must be between 0 and 120"}
                        </div>
                      )}
                    </div>

                    {/* Category and Civil Status */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        Category *
                      </label>
                      <select
                        value={member.category}
                        onChange={(e) =>
                          handleMemberChange(
                            familyIndex,
                            memberIndex,
                            "category",
                            e.target.value
                          )
                        }
                        className={`form-select form-select-sm ${
                          !member.category ? "is-invalid" : "is-valid"
                        }`}
                        required
                      >
                        <option value="">Select Category</option>
                        {dropdownData.categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      {!member.category && (
                        <div className="invalid-feedback">
                          Please select a category
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        Civil Status *
                      </label>
                      <select
                        value={member.civil_status}
                        onChange={(e) =>
                          handleMemberChange(
                            familyIndex,
                            memberIndex,
                            "civil_status",
                            e.target.value
                          )
                        }
                        className={`form-select form-select-sm ${
                          !member.civil_status ? "is-invalid" : "is-valid"
                        }`}
                        required
                      >
                        <option value="">Select Status</option>
                        {dropdownData.civil_status.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {!member.civil_status && (
                        <div className="invalid-feedback">
                          Please select civil status
                        </div>
                      )}
                    </div>

                    {/* Ethnicity Field with validation */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        Ethnicity *
                      </label>
                      <select
                        value={member.ethnicity}
                        onChange={(e) =>
                          handleMemberChange(
                            familyIndex,
                            memberIndex,
                            "ethnicity",
                            e.target.value
                          )
                        }
                        className={`form-select form-select-sm ${
                          !member.ethnicity ? "is-invalid" : "is-valid"
                        }`}
                        required
                      >
                        <option value="">Select Ethnicity</option>
                        {dropdownData.ethnicity.map((eth) => (
                          <option key={eth} value={eth}>
                            {eth}
                          </option>
                        ))}
                      </select>
                      {!member.ethnicity && (
                        <div className="invalid-feedback">
                          Please select an ethnicity
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        Displaced?
                      </label>
                      <select
                        value={member.displaced}
                        onChange={(e) => {
                          handleMemberChange(
                            familyIndex,
                            memberIndex,
                            "displaced",
                            e.target.value
                          );
                          if (e.target.value === "Y") {
                            handleFamilyChange(
                              familyIndex,
                              "evacuation_center",
                              ""
                            );
                          } else {
                            handleFamilyChange(
                              familyIndex,
                              "alternative_location",
                              ""
                            );
                          }
                        }}
                        className="form-select form-select-sm"
                      >
                        <option value="N">No</option>
                        <option value="Y">Yes</option>
                      </select>
                    </div>

                    {/* Location based on displacement */}
                    {member.displaced === "Y" ? (
                      <div className="col-12">
                        <label className="form-label small fw-semibold">
                          Evacuation Center/Location
                        </label>
                        <input
                          type="text"
                          value={family.evacuation_center}
                          onChange={(e) =>
                            handleFamilyChange(
                              familyIndex,
                              "evacuation_center",
                              e.target.value
                            )
                          }
                          className="form-control form-control-sm"
                          placeholder="Name of evacuation center or location"
                        />
                      </div>
                    ) : (
                      <div className="col-12">
                        <label className="form-label small fw-semibold">
                          Current Location
                        </label>
                        <input
                          type="text"
                          value={family.alternative_location}
                          onChange={(e) =>
                            handleFamilyChange(
                              familyIndex,
                              "alternative_location",
                              e.target.value
                            )
                          }
                          className="form-control form-control-sm"
                          placeholder="Location where family is staying"
                        />
                      </div>
                    )}

                    {/* Casualty Status */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold">
                        Casualty Status
                      </label>
                      <select
                        value={member.casualty}
                        onChange={(e) =>
                          handleMemberChange(
                            familyIndex,
                            memberIndex,
                            "casualty",
                            e.target.value
                          )
                        }
                        className="form-select form-select-sm"
                      >
                        <option value="">None</option>
                        {dropdownData.casualty.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vulnerable Groups */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Vulnerable Groups
                      </label>
                      <div className="row g-1">
                        {dropdownData.vulnerable_groups.map((group) => (
                          <div key={group} className="col-12 col-md-4 col-lg-3">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={
                                  member.vulnerable_groups?.includes(group) ||
                                  false
                                }
                                onChange={(e) => {
                                  const currentGroups =
                                    member.vulnerable_groups || [];
                                  const newGroups = e.target.checked
                                    ? [...currentGroups, group]
                                    : currentGroups.filter((g) => g !== group);
                                  handleMemberChange(
                                    familyIndex,
                                    memberIndex,
                                    "vulnerable_groups",
                                    newGroups
                                  );
                                }}
                              />
                              <label className="form-check-label small">
                                {group}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PWD Type if PWD is selected */}
                    {member.vulnerable_groups?.includes("PWD") && (
                      <div className="col-12">
                        <label className="form-label small fw-semibold">
                          PWD Type
                        </label>
                        <select
                          value={member.pwd_type}
                          onChange={(e) =>
                            handleMemberChange(
                              familyIndex,
                              memberIndex,
                              "pwd_type",
                              e.target.value
                            )
                          }
                          className="form-select form-select-sm"
                        >
                          <option value="">Select PWD Type</option>
                          {dropdownData.pwd_types.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Portal>
      <div
        className="modal fade show d-block"
        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div
            className="modal-content border-0"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <div
              className="modal-header border-0 text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%)",
              }}
            >
              <h5 className="modal-title fw-bold">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Report New Incident
                <small className="ms-2 opacity-75">
                  Step {currentStep} of 2
                </small>
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                disabled={isSubmitting}
              ></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div
                className="modal-body bg-light"
                style={{ maxHeight: "70vh", overflowY: "auto" }}
              >
                {currentStep === 1 ? renderStep1() : renderStep2()}
              </div>

              <div className="modal-footer border-top bg-white">
                {currentStep === 1 ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={nextStep}
                    >
                      Next <i className="fas fa-arrow-right ms-2"></i>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={prevStep}
                    >
                      <i className="fas fa-arrow-left me-2"></i> Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Reporting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          Report Incident
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default IncidentReportModal;
