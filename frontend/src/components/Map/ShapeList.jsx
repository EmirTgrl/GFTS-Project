import { OverlayTrigger, Tooltip} from "react-bootstrap";
import { PencilSquare, Trash} from "react-bootstrap-icons";
import Swal from 'sweetalert2';
import {deleteShape} from "../../api/shapeApi"


const ShapeList = ({
  token,
  project_id,
  shapes,
  setShapes,
  openForm
}) => {

 
  


  const renderTooltip = (text) => <Tooltip id="tooltip">{text}</Tooltip>;


  const handleDeleteShape = async (shapeId, shapePtSequence) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to delete this shape? This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel",
    });
  
    if (result.isConfirmed) {
      try {
        console.log("SHAPE SEQUENCE: ", shapePtSequence)
        await deleteShape(shapeId, shapePtSequence, token)
        setShapes((prevShapes) =>
          prevShapes.filter((shape) => shape.shape_pt_sequence !== shapePtSequence)
        );
  
        Swal.fire("Deleted!", "Shape deleted successfully.", "success");
      } catch (error) {
        console.error("Error deleting shape:", error);
        Swal.fire("Error!", "An error occurred while deleting the shape.", "error");
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
            <div
              key={shape.shape_pt_sequence}
              className="card mb-2"
            >
              <div className="card-body p-2">
                <div className="d-flex justify-content-between align-items-center">
                  <OverlayTrigger
                    placement="top"
                    overlay={renderTooltip(
                      shape ? shape.shape_pt_sequence : "Unknown Stop"
                    )}
                  >
                    <h6
                      className="card-title mb-0 text-truncate"
                      style={{ maxWidth: "60%" }}
                    >
                      {shape ? shape.shape_pt_sequence : "Unknown Stop"}
                    </h6>
                  </OverlayTrigger>
                  <div>
                    <button
                      className="btn btn-outline-primary btn-sm me-1"
                      onClick={() =>console.log("Edit Shape Trigerred")}
                    >
                      <PencilSquare size="16"/>
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() =>
                        handleDeleteShape(shape.shape_id, shape.shape_pt_sequence)
                      }
                    >
                      <Trash  size="16"/>
                    </button>
                  </div>
                </div>
                <p className="card-text small mt-1">
                  Lat: {shape.shape_pt_lat || "Unknown"} <br />
                  Lon: {shape.shape_pt_lon || "Unknown"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted text-center">No shapes found.</p>
        )}
      </div>
    </div>
  );
};

export default ShapeList;