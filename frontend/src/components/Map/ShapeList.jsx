import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { PencilSquare, Trash } from "react-bootstrap-icons";
import PropTypes from "prop-types";
import Swal from "sweetalert2";
import { deleteShape } from "../../api/shapeApi";

const ShapeList = ({ token, shapes, setShapes, openForm }) => {
  const renderTooltip = (text) => <Tooltip id="tooltip">{text}</Tooltip>;

  const handleDeleteShape = async (shapeId, shapePtSequence) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu şekli silmek istediğinize emin misiniz? Bu işlem geri alınamaz!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        await deleteShape(shapeId, shapePtSequence, token);
        setShapes((prevShapes) =>
          prevShapes.filter(
            (shape) => shape.shape_pt_sequence !== shapePtSequence
          )
        );
        Swal.fire("Silindi!", "Şekil başarıyla silindi.", "success");
      } catch (error) {
        console.error("Error deleting shape:", error);
        Swal.fire("Hata!", "Şekil silinirken bir hata oluştu.", "error");
      }
    }
  };

  return (
    <div className="tab-pane fade show active h-100">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Shapes</h5>
      </div>
      <div>
        {shapes.length > 0 ? (
          shapes.map((shape) => (
            <div key={shape.shape_pt_sequence} className="card mb-2">
              <div className="card-body p-2">
                <div className="d-flex justify-content-between align-items-center">
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip(
                      shape ? shape.shape_pt_sequence : "Bilinmeyen Şekil"
                    )}
                  >
                    <h6
                      className="card-title mb-0 text-truncate"
                      style={{ maxWidth: "60%" }}
                    >
                      {shape ? shape.shape_pt_sequence : "Bilinmeyen Şekil"}
                    </h6>
                  </OverlayTrigger>
                  <div>
                    <button
                      className="btn btn-outline-primary btn-sm me-1"
                      onClick={() => openForm("edit", shape.shape_pt_sequence)}
                    >
                      <PencilSquare size="16" />
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() =>
                        handleDeleteShape(
                          shape.shape_id,
                          shape.shape_pt_sequence
                        )
                      }
                    >
                      <Trash size="16" />
                    </button>
                  </div>
                </div>
                <p className="card-text small mt-1">
                  Lat: {shape.shape_pt_lat || "Bilinmiyor"} <br />
                  Lon: {shape.shape_pt_lon || "Bilinmiyor"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted text-center">Şekil bulunamadı.</p>
        )}
      </div>
    </div>
  );
};

ShapeList.propTypes = {
  token: PropTypes.string.isRequired,
  shapes: PropTypes.arrayOf(PropTypes.object).isRequired,
  setShapes: PropTypes.func.isRequired,
  openForm: PropTypes.func.isRequired,
};

export default ShapeList;
