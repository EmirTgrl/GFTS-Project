import { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import Select from "react-select";
import { addNetwork } from "../api/fareApi";
import { fetchRoutesByProjectId } from "../api/routeApi";

// NetworkAddForm component for adding a new network
const NetworkAddForm = ({ project_id, token, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    network_id: "",
    network_name: "",
    route_ids: [],
  });
  const [routes, setRoutes] = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all routes across all pages
  useEffect(() => {
    const fetchAllRoutes = async () => {
      if (!project_id || !token) {
        setError("Project ID or token is missing.");
        return;
      }

      try {
        setRoutesLoading(true);
        let allRoutes = [];
        let page = 1;
        const limit = 8;

        while (true) {
          const response = await fetchRoutesByProjectId(
            project_id,
            token,
            page,
            limit
          );
          const routesData = Array.isArray(response.data) ? response.data : [];

          allRoutes = [...allRoutes, ...routesData];

          if (
            routesData.length < limit ||
            !response.total ||
            allRoutes.length >= response.total
          ) {
            break;
          }
          page++;
        }

        if (allRoutes.length === 0) {
          setError("No routes found. Please create routes first.");
          setRoutes([]);
        } else {
          setRoutes(allRoutes);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching routes:", err);
        setError(`Error loading routes: ${err.message}`);
        setRoutes([]);
      } finally {
        setRoutesLoading(false);
      }
    };

    fetchAllRoutes();
  }, [project_id, token]);

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.network_id || !formData.network_name) {
      Swal.fire("Error!", "Network ID and Network Name are required!", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to add this network?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, add it!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const payload = {
          network_id: formData.network_id,
          network_name: formData.network_name,
          route_ids: selectedRoutes.map((route) => route.value),
        };

        const response = await addNetwork(project_id, token, payload);

        Swal.fire("Success!", "Network added successfully.", "success");

        if (onAdd) {
          onAdd(response);
        }

        setFormData({
          network_id: "",
          network_name: "",
          route_ids: [],
        });
        setSelectedRoutes([]);
        onClose();
      } catch (error) {
        console.error("Error adding network:", error);
        Swal.fire("Error!", `Could not add network: ${error.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  // Prepare route options for react-select
  const routeOptions = routes.map((route) => ({
    value: route.route_id,
    label: route.route_long_name || route.route_short_name || route.route_id,
  }));

  return (
    <div className="form-container">
      <Form onSubmit={handleSubmit} className="add-network-form">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {routesLoading && (
          <div className="loading-text mb-4">Loading routes...</div>
        )}
        <Form.Group className="mb-4">
          <Form.Label htmlFor="network_id" className="form-label">
            Network ID (*)
          </Form.Label>
          <Form.Control
            type="text"
            id="network_id"
            name="network_id"
            value={formData.network_id}
            onChange={handleChange}
            required
            placeholder="Enter unique network ID"
            disabled={loading}
            className="form-control-lg"
          />
        </Form.Group>
        <Form.Group className="mb-4">
          <Form.Label htmlFor="network_name" className="form-label">
            Network Name (*)
          </Form.Label>
          <Form.Control
            type="text"
            id="network_name"
            name="network_name"
            value={formData.network_name}
            onChange={handleChange}
            required
            placeholder="Enter network name"
            disabled={loading}
            className="form-control-lg"
          />
        </Form.Group>
        <Form.Group className="mb-4">
          <Form.Label htmlFor="route_ids" className="form-label">
            Routes (Optional)
          </Form.Label>
          <Select
            isMulti
            name="route_ids"
            options={routeOptions}
            value={selectedRoutes}
            onChange={setSelectedRoutes}
            placeholder="Select routes..."
            className="basic-multi-select"
            classNamePrefix="select"
            noOptionsMessage={() => "No routes available"}
            isSearchable
            isDisabled={loading || routesLoading}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: "48px",
                height: "auto",
                borderColor: "#ced4da",
                boxShadow: "none",
                borderRadius: "6px",
                fontSize: "16px",
                padding: "4px",
                "&:hover": {
                  borderColor: "#007bff",
                },
              }),
              menu: (base) => ({
                ...base,
                zIndex: 9999,
                fontSize: "16px",
                borderRadius: "6px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
              }),
              multiValue: (base) => ({
                ...base,
                backgroundColor: "#e9ecef",
                borderRadius: "4px",
                padding: "2px",
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: "#212529",
                fontSize: "15px",
                padding: "4px 8px",
              }),
              multiValueRemove: (base) => ({
                ...base,
                color: "#dc3545",
                padding: "4px",
                "&:hover": {
                  backgroundColor: "#dc3545",
                  color: "white",
                },
              }),
              placeholder: (base) => ({
                ...base,
                color: "#6c757d",
                fontSize: "16px",
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected
                  ? "#007bff"
                  : state.isFocused
                  ? "#f1f3f5"
                  : "white",
                color: state.isSelected ? "white" : "#212529",
                padding: "10px 12px",
                fontSize: "16px",
                "&:active": {
                  backgroundColor: "#e9ecef",
                },
              }),
              input: (base) => ({
                ...base,
                fontSize: "16px",
                padding: "4px",
              }),
            }}
          />
        </Form.Group>
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Adding..." : "Add Network"}
          </button>
        </div>
      </Form>
    </div>
  );
};

NetworkAddForm.propTypes = {
  project_id: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func,
};

export default NetworkAddForm;
