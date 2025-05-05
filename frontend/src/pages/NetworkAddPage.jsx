import { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { addNetwork } from "../api/fareApi";
import { fetchRoutesByProjectId } from "../api/routeApi";

const NetworkAddForm = ({ project_id, token, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    network_id: "",
    network_name: "",
    route_ids: [],
  });
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [error, setError] = useState(null);

  // Rotaları çek
  useEffect(() => {
    const fetchData = async () => {
      if (!project_id || !token) {
        setError("Project ID or token is missing.");
        return;
      }

      try {
        setRoutesLoading(true);
        const response = await fetchRoutesByProjectId(project_id, token);
        console.log("fetchRoutesByProjectId response:", response); // Hata ayıklama için

        // response.data'nın bir dizi olduğundan emin ol
        const routesData = Array.isArray(response.data) ? response.data : [];

        if (routesData.length === 0) {
          setError("No routes found. Please create routes first.");
          setRoutes([]);
        } else {
          setRoutes(routesData);
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

    fetchData();
  }, [project_id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRouteChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setFormData((prev) => ({ ...prev, route_ids: selectedOptions }));
  };

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
          route_ids: formData.route_ids,
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
        onClose();
      } catch (error) {
        console.error("Error adding network:", error);
        Swal.fire(
          "Error!",
          `Could not add network: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      network_id: "",
      network_name: "",
      route_ids: [],
    });
    onClose();
  };

  return (
    <div className="form-container">
      <style>
        {`
          .form-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #333;
          }
          .form-control {
            width: 100%;
            padding: 8px;
            margin-bottom: 16px;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 14px;
          }
          .form-control:focus {
            outline: none;
            border-color: #3085d6;
            box-shadow: 0 0 5px rgba(48, 133, 214, 0.3);
          }
          .form-control[multiple] {
            height: 120px;
          }
          .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          .btn-primary {
            background-color: #3085d6;
            color: white;
          }
          .btn-primary:hover {
            background-color: #2874b5;
          }
          .btn-primary:disabled {
            background-color: #a0c4e8;
            cursor: not-allowed;
          }
          .btn-secondary {
            background-color: #6c757d;
            color: white;
          }
          .btn-secondary:hover {
            background-color: #5a6268;
          }
          .d-flex {
            display: flex;
          }
          .justify-content-end {
            justify-content: flex-end;
          }
          .gap-2 {
            gap: 10px;
          }
          .text-red-500 {
            color: #dc3545;
            margin-bottom: 16px;
          }
          .text-xl {
            font-size: 1.25rem;
          }
          .font-bold {
            font-weight: bold;
          }
          .mb-4 {
            margin-bottom: 16px;
          }
          .mb-2 {
            margin-bottom: 8px;
          }
          .loading-text {
            color: #666;
            font-style: italic;
          }
        `}
      </style>
      <Form onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-4">Add New Network</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {routesLoading && (
          <div className="loading-text mb-4">Loading routes...</div>
        )}
        <Form.Group className="mb-2">
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
          />
        </Form.Group>
        <Form.Group className="mb-2">
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
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label htmlFor="route_ids" className="form-label">
            Routes (Optional)
          </Form.Label>
          <Form.Select
            id="route_ids"
            name="route_ids"
            multiple
            value={formData.route_ids}
            onChange={handleRouteChange}
            disabled={loading || routesLoading}
            className="form-control"
          >
            {Array.isArray(routes) && routes.length > 0 ? (
              routes.map((route) => (
                <option key={route.route_id} value={route.route_id}>
                  {route.route_long_name ||
                    route.route_short_name ||
                    route.route_id}
                </option>
              ))
            ) : (
              <option disabled>No routes available</option>
            )}
          </Form.Select>
        </Form.Group>
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
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