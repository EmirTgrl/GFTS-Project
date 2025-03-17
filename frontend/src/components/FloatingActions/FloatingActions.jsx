import { PlusLg, Pencil, List, Trash, Map, Floppy, XLg, Triangle, SignStop } from "react-bootstrap-icons";
import PropTypes from "prop-types";
import "../../styles/FloatingActions.css";

const FloatingActions = ({ setAction, editorMode, setEditorMode }) => {
  return (
    <div className="floating-actions">
      <div className="secondary-actions">
        {editorMode === "close" ? (
          <>
            <button className="fab-secondary" onClick={() => setEditorMode("open")}>
              <Map size={20} />
            </button>
            <button className="fab-secondary" onClick={() => setAction("delete")}>
              <Trash size={20} />
            </button>
            <button className="fab-secondary" onClick={() => setAction("edit")}>
              <Pencil size={20} />
            </button>
            <button className="fab-secondary" onClick={() => setAction("add")}>
              <PlusLg size={20} />
            </button>
          </>
        ) : (
          <>
            <button className={`fab-secondary ${editorMode === "add-stop" ? "active":""}`} onClick={() => setEditorMode(editorMode==="add-stop" ? "open":"add-stop")}>
              <SignStop size={20} />
            </button>
            <button className={`fab-secondary ${editorMode === "add-shape" ? "active":""}`} onClick={() => setEditorMode(editorMode==="add-shape" ? "open":"add-shape")}>
              <Triangle size={20} />
            </button> 
            <button className="fab-secondary" onClick={() => setEditorMode("close")}>
              <XLg size={20} />
            </button>
            <button className="fab-secondary" onClick={() => setEditorMode("save")}>
              <Floppy size={20} />
            </button>
          </>
        )}
      </div>
      <div className="main-action">
        <button className="fab-main">
          <List size={24} />
        </button>
      </div>
    </div>
  );
};
FloatingActions.propTypes = {
  setAction: PropTypes.func.isRequired,
};

export default FloatingActions;
