import { useState, useContext } from "react";
import { saveAgency } from "../api/agencyApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";

const AgencyAddPage = ({ project_id, onClose, setAgencies }) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    agency_id: "",
    agency_name: "",
    agency_url: "",
    agency_timezone: "",
    agency_lang: "",
    agency_phone: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.agency_id ||
      !formData.agency_name ||
      !formData.agency_url ||
      !formData.agency_timezone
    ) {
      Swal.fire(
        "Error!",
        "Agency ID, agenc name, URL ve timezone is required!",
        "error"
      );
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to add this agency?",
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
        const agencyData = { project_id, ...formData };
        const response = await saveAgency(agencyData, token);
        const agency_id = response.agency_id;
        setAgencies((prev) => ({
          ...prev,
          data: [...prev.data, { ...agencyData, agency_id }],
        }));
        Swal.fire("Added!", "Agency successfully added.", "success");
        onClose();
      } catch (error) {
        Swal.fire(
          "Error!",
          `Error adding an agency: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="form-container">
      <h5>Add New Agency</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="agency_id" className="form-label">
            Agency ID (*)
          </label>
          <input
            type="text"
            className="form-control"
            id="agency_id"
            name="agency_id"
            value={formData.agency_id}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="agency_name" className="form-label">
            Agency Name (*)
          </label>
          <input
            type="text"
            className="form-control"
            id="agency_name"
            name="agency_name"
            value={formData.agency_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="agency_url" className="form-label">
            Agency URL (*)
          </label>
          <input
            type="url"
            className="form-control"
            id="agency_url"
            name="agency_url"
            value={formData.agency_url}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="agency_timezone" className="form-label">
            Timezone (*)
          </label>
          <input
            type="text"
            className="form-control"
            id="agency_timezone"
            name="agency_timezone"
            value={formData.agency_timezone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="agency_lang" className="form-label">
            Language (Optional)
          </label>
          <input
            type="text"
            className="form-control"
            id="agency_lang"
            name="agency_lang"
            value={formData.agency_lang}
            onChange={handleChange}
          />
        </div>
        <div className="mb-2">
          <label htmlFor="agency_phone" className="form-label">
            Phone (Optional)
          </label>
          <input
            type="text"
            className="form-control"
            id="agency_phone"
            name="agency_phone"
            value={formData.agency_phone}
            onChange={handleChange}
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Added..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
};

AgencyAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  setAgencies: PropTypes.func.isRequired,
};

export default AgencyAddPage;
