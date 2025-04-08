import {
  PlusLg,
  Pencil,
  List,
  Trash,
  Map,
  Floppy,
  Arrow90degLeft,
  BoundingBoxCircles,
  GeoAlt,
  Copy,
  Link45deg,
} from "react-bootstrap-icons";
import PropTypes from "prop-types";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import "../../styles/FloatingActions.css";

const FloatingActions = ({
  setAction,
  editorMode,
  setEditorMode,
  selectedCategory,
  selectedEntities,
  createLink,
}) => {
  const renderTooltip = (text) => (
    <Tooltip id={`tooltip-${text.toLowerCase()}`}>{text}</Tooltip>
  );

  return (
    <div className="floating-actions">
      <div className="secondary-actions">
        {editorMode === "close" ? (
          <>
            {selectedEntities.trip !== null && (
              <>
                <OverlayTrigger
                  placement="left"
                  overlay={renderTooltip("Edit Mode")}
                  trigger={["hover", "focus"]}
                >
                  <button
                    className="fab-secondary"
                    onClick={() => setEditorMode("open")}
                  >
                    <Map size={20} />
                  </button>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="left"
                  overlay={renderTooltip("Copy Trip")}
                  trigger={["hover", "focus"]}
                >
                  <button
                    className="fab-secondary"
                    onClick={() => setAction("copy")}
                  >
                    <Copy size={20} />
                  </button>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="left"
                  overlay={renderTooltip("Create Link")}
                  trigger={["hover", "focus"]}
                >
                  <button className="fab-secondary" onClick={createLink}>
                    <Link45deg size={20} />
                  </button>
                </OverlayTrigger>
              </>
            )}
            {selectedCategory && selectedCategory !== "" && (
              <>
                <OverlayTrigger
                  placement="left"
                  overlay={renderTooltip("Delete " + selectedCategory)}
                  trigger={["hover", "focus"]}
                >
                  <button
                    className="fab-secondary"
                    onClick={() => setAction("delete")}
                  >
                    <Trash size={20} />
                  </button>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="left"
                  overlay={renderTooltip("Edit " + selectedCategory)}
                  trigger={["hover", "focus"]}
                >
                  <button
                    className="fab-secondary"
                    onClick={() => setAction("edit")}
                  >
                    <Pencil size={20} />
                  </button>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="left"
                  overlay={renderTooltip("Add " + selectedCategory)}
                  trigger={["hover", "focus"]}
                >
                  <button
                    className="fab-secondary"
                    onClick={() => setAction("add")}
                  >
                    <PlusLg size={20} />
                  </button>
                </OverlayTrigger>
              </>
            )}
          </>
        ) : (
          <>
            <OverlayTrigger
              placement="left"
              overlay={renderTooltip("Delete " + selectedCategory)}
              trigger={["hover", "focus"]}
            >
              <button
                className="fab-secondary"
                onClick={() => setAction("delete")}
              >
                <Trash size={20} />
              </button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="left"
              overlay={renderTooltip("Edit " + selectedCategory)}
              trigger={["hover", "focus"]}
            >
              <button
                className="fab-secondary"
                onClick={() => setAction("edit")}
              >
                <Pencil size={20} />
              </button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="left"
              overlay={renderTooltip("Add Stop")}
              trigger={["hover", "focus"]}
            >
              <button
                className={`fab-secondary ${
                  editorMode === "add-stop" ? "active" : ""
                }`}
                onClick={() =>
                  setEditorMode(editorMode === "add-stop" ? "open" : "add-stop")
                }
              >
                <GeoAlt size={20} />
              </button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="left"
              overlay={renderTooltip("Add Shape")}
              trigger={["hover", "focus"]}
            >
              <button
                className={`fab-secondary ${
                  editorMode === "add-shape" ? "active" : ""
                }`}
                onClick={() =>
                  setEditorMode(
                    editorMode === "add-shape" ? "open" : "add-shape"
                  )
                }
              >
                <BoundingBoxCircles size={20} />
              </button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="left"
              overlay={renderTooltip("Save Changes")}
              trigger={["hover", "focus"]}
            >
              <button
                className="fab-secondary"
                onClick={() => setEditorMode("save")}
              >
                <Floppy size={20} />
              </button>
            </OverlayTrigger>
            <OverlayTrigger
              placement="left"
              overlay={renderTooltip("Close Editor")}
              trigger={["hover", "focus"]}
            >
              <button
                className="fab-secondary"
                onClick={() => setEditorMode("close")}
              >
                <Arrow90degLeft size={20} />
              </button>
            </OverlayTrigger>
          </>
        )}
      </div>
      <div className="main-action">
        <OverlayTrigger
          placement="left"
          overlay={renderTooltip("Menu")}
          trigger={["hover", "focus"]}
        >
          <button className="fab-main">
            <List size={24} />
          </button>
        </OverlayTrigger>
      </div>
    </div>
  );
};

FloatingActions.propTypes = {
  setAction: PropTypes.func.isRequired,
  editorMode: PropTypes.string.isRequired,
  setEditorMode: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string,
  selectedEntities: PropTypes.shape({
    trip: PropTypes.any,
  }).isRequired,
  createLink: PropTypes.func.isRequired,
};

export default FloatingActions;
