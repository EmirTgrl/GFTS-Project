import { useState, useContext } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import { addFareMedia } from "../api/fareApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";

const FareMediaAddPage = ({ project_id, onClose, onAdd }) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    fare_media_id: "",
    fare_media_name: "",
    fare_media_type: "0",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fare_media_id || !formData.fare_media_type) {
      Swal.fire("Error!", "Payment method ID and type are required!", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to add this payment method?",
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
          fare_media_id: formData.fare_media_id,
          fare_media_name: formData.fare_media_name,
          fare_media_type: parseInt(formData.fare_media_type),
        };

        const response = await addFareMedia(project_id, token, payload);

        Swal.fire("Success!", "Payment method added successfully.", "success");

        if (onAdd) {
          onAdd(response);
        }

        setFormData({
          fare_media_id: "",
          fare_media_name: "",
          fare_media_type: "0",
        });
        onClose();
      } catch (error) {
        console.error("Error:", error);
        Swal.fire(
          "Error!",
          `An error occurred while adding the payment method: ${
            error.message || "An unknown error occurred."
          }`,
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
        <div className="mb-2">
          <label htmlFor="fare_media_id" className="form-label">
            Payment Method ID (*)
          </label>
          <input
            type="text"
            className="form-control"
            id="fare_media_id"
            name="fare_media_id"
            value={formData.fare_media_id}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="fare_media_name" className="form-label">
            Payment Method Name
          </label>
          <input
            type="text"
            className="form-control"
            id="fare_media_name"
            name="fare_media_name"
            value={formData.fare_media_name}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="fare_media_type" className="form-label">
            Payment Method Type (*)
          </label>
          <select
            className="form-control"
            id="fare_media_type"
            name="fare_media_type"
            value={formData.fare_media_type}
            onChange={handleChange}
            required
          >
            <option value="0">Cash Payment</option>
            <option value="1">Physical Paper Ticket</option>
            <option value="2">Physical Transit Card</option>
            <option value="3">
              cEMV (contactless Europay, Mastercard and Visa)
            </option>
            <option value="4">Mobile App</option>
          </select>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
};

FareMediaAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func,
};

export default FareMediaAddPage;
