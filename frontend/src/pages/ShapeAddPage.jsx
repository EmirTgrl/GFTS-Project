import { useState, useEffect, useContext } from "react"; 
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";
import { saveShape } from "../api/shapeApi";
import Swal from "sweetalert2";

const ShapeAddPage = ({
  project_id,
  onClose,
  shape_id,
  setShapes,
  clickedCoords,
}) => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [shapeData, setShapeData] = useState({
    shape_pt_lat: "",
    shape_pt_lon: "",
    shape_pt_sequence: "",
    shape_dist_traveled: "",
    project_id: project_id,
  });

  useEffect(() => {
    if (clickedCoords && clickedCoords.lat && clickedCoords.lng) {
      setShapeData((prev) => ({
        ...prev,
        shape_pt_lat: clickedCoords.lat.toString(),
        shape_pt_lon: clickedCoords.lng.toString(),
      }));
    }
  }, [clickedCoords]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShapeData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu şekli eklemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, ekle!",
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        const newShapeData = {
          shape_pt_lat: parseFloat(shapeData.shape_pt_lat),
          shape_pt_lon: parseFloat(shapeData.shape_pt_lon),
          shape_pt_sequence: parseInt(shapeData.shape_pt_sequence),
          shape_dist_traveled: shapeData.shape_dist_traveled
            ? parseFloat(shapeData.shape_dist_traveled)
            : null,
          project_id: project_id,
          shape_id: shape_id,
        };

        const response = await saveShape(newShapeData, token);

        setShapes((prev) => [
          ...prev,
          { ...newShapeData, shape_id: response?.shape_id || shape_id },
        ]);

        Swal.fire("Eklendi!", "Şekil başarıyla eklendi.", "success");

        setShapeData({
          shape_pt_lat: "",
          shape_pt_lon: "",
          shape_pt_sequence: "",
          shape_dist_traveled: "",
          project_id: project_id,
        });
        onClose();
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Şekil eklenirken bir hata oluştu: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h5>Yeni Şekil Ekle</h5>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-6 mb-2">
            <label htmlFor="shape_pt_lat" className="form-label">
              Enlem (*)
            </label>
            <input
              type="number"
              id="shape_pt_lat"
              name="shape_pt_lat"
              className="form-control"
              value={shapeData.shape_pt_lat}
              onChange={handleChange}
              step="0.000001"
              required
            />
          </div>
          <div className="col-6 mb-2">
            <label htmlFor="shape_pt_lon" className="form-label">
              Boylam (*)
            </label>
            <input
              type="number"
              id="shape_pt_lon"
              name="shape_pt_lon"
              className="form-control"
              value={shapeData.shape_pt_lon}
              onChange={handleChange}
              step="0.000001"
              required
            />
          </div>
        </div>
        <div className="mb-2">
          <label htmlFor="shape_pt_sequence" className="form-label">
            Sıra Numarası (*)
          </label>
          <input
            type="number"
            id="shape_pt_sequence"
            name="shape_pt_sequence"
            className="form-control"
            value={shapeData.shape_pt_sequence}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="shape_dist_traveled" className="form-label">
            Mesafe (Metre)
          </label>
          <input
            type="number"
            id="shape_pt_lon"
            name="shape_dist_traveled"
            className="form-control"
            value={shapeData.shape_dist_traveled}
            onChange={handleChange}
            step="0.01"
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Ekleniyor..." : "Ekle"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

ShapeAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  shape_id: PropTypes.string,
  setShapes: PropTypes.func.isRequired,
  clickedCoords: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
};

export default ShapeAddPage;
