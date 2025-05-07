import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import {
  addFareTransferRule,
  fetchAllLegGroups,
  fetchAllFareProducts,
} from "../api/fareApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";

const FareTransferRuleAddForm = ({ project_id, onClose, onAdd }) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    from_leg_group_id: "",
    to_leg_group_id: "",
    transfer_count: 1,
    duration_limit: "",
    duration_limit_type: "",
    fare_transfer_type: "",
    fare_product_id: "",
  });
  const [legGroups, setLegGroups] = useState([]);
  const [fareProducts, setFareProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch leg groups and fare products
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch fare products
        const products = await fetchAllFareProducts(project_id, token);
        if (!products || products.length === 0) {
          setError("Fare products not found.");
        } else {
          setFareProducts(products);
        }

        // Fetch leg groups
        const legGroupsData = await fetchAllLegGroups(project_id, token);
        if (!legGroupsData || legGroupsData.length === 0) {
          setError("No leg groups found. Please create leg groups first.");
        } else {
          setLegGroups(legGroupsData);
        }
      } catch (err) {
        setError("An error occurred while loading data: " + err.message);
      }
    };

    if (project_id && token) {
      fetchData();
    }
  }, [project_id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.from_leg_group_id ||
      !formData.to_leg_group_id ||
      !formData.fare_transfer_type
    ) {
      Swal.fire(
        "Error!",
        "Starting Leg Group, Ending Leg Group and Transfer Type are required!",
        "error"
      );
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to add this transfer rule??",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, add!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const payload = {
          from_leg_group_id: formData.from_leg_group_id,
          to_leg_group_id: formData.to_leg_group_id,
          transfer_count: parseInt(formData.transfer_count) || 1,
          duration_limit: formData.duration_limit
            ? parseInt(formData.duration_limit)
            : null,
          duration_limit_type: formData.duration_limit_type
            ? parseInt(formData.duration_limit_type)
            : null,
          fare_transfer_type: parseInt(formData.fare_transfer_type),
          fare_product_id: formData.fare_product_id || null,
        };

        const response = await addFareTransferRule(project_id, token, payload);

        Swal.fire("Success!", "Transfer rule added successfully.", "success");

        if (onAdd) {
          onAdd(response);
        }

        setFormData({
          from_leg_group_id: "",
          to_leg_group_id: "",
          transfer_count: 1,
          duration_limit: "",
          duration_limit_type: "",
          fare_transfer_type: "",
          fare_product_id: "",
        });
        onClose();
      } catch (error) {
        console.error("Hata:", error);
        Swal.fire(
          "Error!",
          `Transfer rule could not be added: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="mb-2">
          <label htmlFor="from_leg_group_id" className="form-label">
            From Leg Group (*)
          </label>
          <select
            className="form-control"
            id="from_leg_group_id"
            name="from_leg_group_id"
            value={formData.from_leg_group_id}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            {legGroups.map((legGroup) => (
              <option key={legGroup} value={legGroup}>
                {legGroup}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="to_leg_group_id" className="form-label">
            To Leg Group (*)
          </label>
          <select
            className="form-control"
            id="to_leg_group_id"
            name="to_leg_group_id"
            value={formData.to_leg_group_id}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            {legGroups.map((legGroup) => (
              <option key={legGroup} value={legGroup}>
                {legGroup}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="transfer_count" className="form-label">
            Transfer Count
          </label>
          <input
            type="number"
            className="form-control"
            id="transfer_count"
            name="transfer_count"
            value={formData.transfer_count}
            onChange={handleChange}
            min="0"
          />
        </div>
        <div className="mb-2">
          <label htmlFor="duration_limit" className="form-label">
            Duration Limit (second)
          </label>
          <input
            type="number"
            className="form-control"
            id="duration_limit"
            name="duration_limit"
            value={formData.duration_limit}
            onChange={handleChange}
            min="0"
            placeholder="Optional"
          />
        </div>
        <div className="mb-2">
          <label htmlFor="duration_limit_type" className="form-label">
            Duration Limit Type
          </label>
          <select
            className="form-control"
            id="duration_limit_type"
            name="duration_limit_type"
            value={formData.duration_limit_type}
            onChange={handleChange}
          >
            <option value="">Select (Optional)</option>
            <option value="0">Departure to Departure</option>
            <option value="1">Departure to Arrival</option>
            <option value="2">Arrival to Departure</option>
            <option value="3">Arrival to Arrival</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="fare_transfer_type" className="form-label">
            Transfer Type (*)
          </label>
          <select
            className="form-control"
            id="fare_transfer_type"
            name="fare_transfer_type"
            value={formData.fare_transfer_type}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            <option value="0">One Way</option>
            <option value="1">Two Way</option>
            <option value="2">Cyclical</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="fare_product_id" className="form-label">
            Fare Product
          </label>
          <select
            className="form-control"
            id="fare_product_id"
            name="fare_product_id"
            value={formData.fare_product_id}
            onChange={handleChange}
          >
            <option value="">Select (Optional)</option>
            {fareProducts.map((product) => (
              <option
                key={product.fare_product_id}
                value={product.fare_product_id}
              >
                {product.fare_product_name}
              </option>
            ))}
          </select>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Adding..." : "Add Transfer Rule"}
          </button>
        </div>
      </form>
    </div>
  );
};

FareTransferRuleAddForm.propTypes = {
  project_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func,
};

export default FareTransferRuleAddForm;