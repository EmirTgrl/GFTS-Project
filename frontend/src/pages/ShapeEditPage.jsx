import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "../components/Auth/AuthContext";
import { updateShape } from "../api/shapeApi";
import Swal from "sweetalert2";

const ShapeEditPage = ({
  project_id,
  shape_pt_sequence,
  onClose,
  setShapes,
  shapes,
}) => {
  const { token } = useContext(AuthContext);
  const [shapeData, setShapeData] = useState({
    shape_pt_lat: "",
    shape_pt_lon: "",
    shape_pt_sequence: "",
    shape_dist_traveled: "",
    project_id: project_id,
  });

  useEffect(() => {
    const currentShape = shapes.find(
      (shape) => shape.shape_pt_sequence === shape_pt_sequence
    );
    if (currentShape) {
      setShapeData({
        shape_pt_lat: currentShape.shape_pt_lat || "",
        shape_pt_lon: currentShape.shape_pt_lon || "",
        shape_pt_sequence: currentShape.shape_pt_sequence || "",
        shape_dist_traveled: currentShape.shape_dist_traveled || "",
        project_id: currentShape.project_id || project_id,
      });
    } else {
      console.error("Shape not found in shapes array:", shape_pt_sequence);
    }
  }, [shapes, shape_pt_sequence, project_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShapeData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu şekli güncellemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, güncelle!",
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        const updatedShapeData = {
          shape_pt_lat: parseFloat(shapeData.shape_pt_lat),
          shape_pt_lon: parseFloat(shapeData.shape_pt_lon),
          shape_pt_sequence: parseInt(shapeData.shape_pt_sequence),
          shape_dist_traveled: shapeData.shape_dist_traveled
            ? parseFloat(shapeData.shape_dist_traveled)
            : null,
          project_id: project_id,
        };

        await updateShape(shape_pt_sequence, updatedShapeData, token);

        setShapes((prev) =>
          prev.map((shape) =>
            shape.shape_pt_sequence === shape_pt_sequence
              ? { ...shape, ...updatedShapeData }
              : shape
          )
        );

        Swal.fire("Güncellendi!", "Şekil başarıyla güncellendi.", "success");
        onClose();
      } catch (error) {
        Swal.fire(
          "Hata!",
          `Şekil güncellenirken bir hata oluştu: ${error.message}`,
          "error"
        );
      }
    }
  };

  return (
    <div className="form-container">
      <h5>Şekli Düzenle</h5>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-6 mb-2">
            <label htmlFor="shape_pt_lat" className="form-label">
              Enlem
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
              Boylam
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
            Sıra Numarası
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
            id="shape_dist_traveled"
            name="shape_dist_traveled"
            className="form-control"
            value={shapeData.shape_dist_traveled}
            onChange={handleChange}
            step="0.01"
          />
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary">
            Güncelle
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

ShapeEditPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  shape_pt_sequence: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  onClose: PropTypes.func.isRequired,
  setShapes: PropTypes.func.isRequired,
  shapes: PropTypes.array.isRequired,
};

export default ShapeEditPage;
