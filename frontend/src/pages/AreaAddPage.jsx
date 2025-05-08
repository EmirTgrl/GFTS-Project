import { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import Select from "react-select";
import { addArea } from "../api/fareApi";
import { fetchAllStopsByProjectId } from "../api/stopApi";

const AreaAddPage = ({ project_id, token, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    area_id: "",
    area_name: "",
    stop_ids: [],
  });
  const [stops, setStops] = useState([]);
  const [selectedStops, setSelectedStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!project_id || !token) {
        setError("Project ID or token is missing.");
        return;
      }

      try {
        setStopsLoading(true);
        const response = await fetchAllStopsByProjectId(project_id, token);

        const stopsData = Array.isArray(response.data) ? response.data : [];

        if (stopsData.length === 0) {
          setError("No stops found. Please create stops first.");
          setStops([]);
        } else {
          setStops(stopsData);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching stops:", err);
        setError(`Error loading stops: ${err.message}`);
        setStops([]);
      } finally {
        setStopsLoading(false);
      }
    };

    fetchData();
  }, [project_id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.area_id || !formData.area_name) {
      Swal.fire("Error!", "Area ID and Area Name are required!", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to add this area?",
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
          area_id: formData.area_id,
          area_name: formData.area_name,
          stop_ids: selectedStops.map((stop) => stop.value),
        };

        const response = await addArea(project_id, token, payload);

        Swal.fire("Success!", "Area added successfully.", "success");

        if (onAdd) {
          onAdd(response);
        }

        setFormData({
          area_id: "",
          area_name: "",
          stop_ids: [],
        });
        setSelectedStops([]);
        onClose();
      } catch (error) {
        console.error("Error adding area:", error);
        Swal.fire("Error!", `Could not add area: ${error.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const stopOptions = stops.map((stop) => ({
    value: stop.stop_id,
    label: stop.stop_name || stop.stop_id,
  }));

  return (
    <div className="form-container">
      <Form onSubmit={handleSubmit} className="add-area-form">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {stopsLoading && (
          <div className="loading-text mb-4">Loading stops...</div>
        )}
        <Form.Group className="mb-4">
          <Form.Label htmlFor="area_id" className="form-label">
            Area ID (*)
          </Form.Label>
          <Form.Control
            type="text"
            id="area_id"
            name="area_id"
            value={formData.area_id}
            onChange={handleChange}
            required
            placeholder="Enter unique area ID"
            disabled={loading}
            className="form-control-lg"
          />
        </Form.Group>
        <Form.Group className="mb-4">
          <Form.Label htmlFor="area_name" className="form-label">
            Area Name (*)
          </Form.Label>
          <Form.Control
            type="text"
            id="area_name"
            name="area_name"
            value={formData.area_name}
            onChange={handleChange}
            required
            placeholder="Enter area name"
            disabled={loading}
            className="form-control-lg"
          />
        </Form.Group>
        <Form.Group className="mb-4">
          <Form.Label htmlFor="stop_ids" className="form-label">
            Stops (Optional)
          </Form.Label>
          <Select
            isMulti
            name="stop_ids"
            options={stopOptions}
            value={selectedStops}
            onChange={setSelectedStops}
            placeholder="Select stops..."
            className="basic-multi-select"
            classNamePrefix="select"
            noOptionsMessage={() => "No stops available"}
            isSearchable
            isDisabled={loading || stopsLoading}
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
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Adding..." : "Add Area"}
          </button>
        </div>
      </Form>
    </div>
  );
};

AreaAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func,
};

export default AreaAddPage;
