import { useState, useEffect, useContext } from "react";


const ShapeAddPage = (
    {project_id,
    onClose}
) => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = ()=>{
        console.log("submit handle")
    }


    return (
        <div className="form-container">
            <h5>Add New Shape</h5>
            <form onSubmit={handleSubmit}>

            </form>
            <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Ekleniyor..." : "Ekle"}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            İptal
          </button>
        </div>
        </div>
    )
}

export default ShapeAddPage;