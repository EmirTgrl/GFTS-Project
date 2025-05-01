import { useState, useEffect } from "react";
import { Modal, Tabs, Tab, Table, Button } from "react-bootstrap";
import { Pencil, Trash, PlusLg } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { fetchAllRiderCategories, fetchAllFareMedia } from "../../api/fareApi";
import RiderCategoriesAddPage from "../../pages/RiderCategoriesAddPage";
import FareMediaAddPage from "../../pages/FareMediaAddPage";
import "../../styles/FareSettingsPanel.css";

const FareSettingsPanel = ({
  project_id,
  token,
  show,
  onClose,
  onAddRiderCategory,
  onAddFareMedia,
}) => {
  const [riderCategories, setRiderCategories] = useState([]);
  const [fareMedia, setFareMedia] = useState([]);
  const [activeTab, setActiveTab] = useState("rider_categories");
  const [showRiderForm, setShowRiderForm] = useState(false);
  const [showFareMediaForm, setShowFareMediaForm] = useState(false);

  // Verileri çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categories = await fetchAllRiderCategories(project_id, token);
        setRiderCategories(categories || []);
        const media = await fetchAllFareMedia(project_id, token);
        setFareMedia(media || []);
      } catch (error) {
        console.error("Veri yüklenirken hata:", error);
        Swal.fire("Hata", "Veriler yüklenemedi.", "error");
      }
    };
    if (show) {
      fetchData();
    }
  }, [project_id, token, show]);

  // Rider Category ekleme
  const handleAddRiderCategory = (newCategory) => {
    setRiderCategories((prev) => [...prev, newCategory]);
    onAddRiderCategory(newCategory);
    setShowRiderForm(false); // Formu kapat
    Swal.fire("Başarılı!", "Yolcu kategorisi eklendi.", "success");
  };

  // Fare Media ekleme
  const handleAddFareMedia = (newMedia) => {
    setFareMedia((prev) => [...prev, newMedia]);
    onAddFareMedia(newMedia);
    setShowFareMediaForm(false); // Formu kapat
    Swal.fire("Başarılı!", "Ödeme yöntemi eklendi.", "success");
  };

  // fare_media_type'ı Türkçe'ye çeviren yardımcı fonksiyon
  const getFareMediaTypeLabel = (type) => {
    switch (parseInt(type)) {
      case 0:
        return "Nakit Ödeme";
      case 1:
        return "Fiziksel Kağıt Bilet";
      case 2:
        return "Fiziksel Ulaşım Kart";
      case 3:
        return "Temassız Kart (cEMV)";
      case 4:
        return "Mobil Uygulama";
      default:
        return "Bilinmeyen Tür";
    }
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="lg"
      centered
      className="fare-settings-panel"
    >
      <Modal.Header closeButton>
        <Modal.Title>Other Fares</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="rider_categories" title="Rider Categories">
            <div className="d-flex justify-content-end mb-3">
              <Button
                onClick={() => setShowRiderForm(true)}
                className="add-button"
              >
                <PlusLg size={16} className="me-1" /> Add New Rider Category
              </Button>
            </div>
            <Table striped bordered hover className="mt-3">
              <thead>
                <tr>
                  <th>Rider Category Name</th>
                  <th>Eligibility URL</th>
                  <th>Default</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {riderCategories.length > 0 ? (
                  riderCategories.map((category) => (
                    <tr key={category.rider_category_id}>
                      <td>{category.rider_category_name}</td>
                      <td>
                        {category.eligibility_url ? (
                          <a
                            href={category.eligibility_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Link
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {category.is_default_fare_category ? "Yes" : "No"}
                      </td>
                      <td>
                        <Button variant="link" disabled title="Edit">
                          <Pencil size={16} />
                        </Button>
                        <Button variant="link" disabled title="Delete">
                          <Trash size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center">
                    Rider category not found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
            <Modal
              show={showRiderForm}
              onHide={() => setShowRiderForm(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Add New Rider Category</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <RiderCategoriesAddPage
                  project_id={project_id}
                  token={token}
                  onAdd={handleAddRiderCategory}
                  onClose={() => setShowRiderForm(false)}
                />
              </Modal.Body>
            </Modal>
          </Tab>
          <Tab eventKey="fare_media" title="Fare Media">
            <div className="d-flex justify-content-end mb-3">
              <Button
                onClick={() => setShowFareMediaForm(true)}
                className="add-button"
              >
                <PlusLg size={16} className="me-1" /> Add New Fare Media
              </Button>
            </div>
            <Table striped bordered hover className="mt-3">
              <thead>
                <tr>
                  <th>Fare Media Name</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fareMedia.length > 0 ? (
                  fareMedia.map((media) => (
                    <tr key={media.fare_media_id}>
                      <td>{media.fare_media_name}</td>
                      <td>{getFareMediaTypeLabel(media.fare_media_type)}</td>
                      <td>
                        <Button variant="link" disabled title="Edit">
                          <Pencil size={16} />
                        </Button>
                        <Button variant="link" disabled title="Delete">
                          <Trash size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center">
                    Payment method not found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
            <Modal
              show={showFareMediaForm}
              onHide={() => setShowFareMediaForm(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Add New Payment Method</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <FareMediaAddPage
                  project_id={project_id}
                  token={token}
                  onAdd={handleAddFareMedia}
                  onClose={() => setShowFareMediaForm(false)}
                />
              </Modal.Body>
            </Modal>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};

FareSettingsPanel.propTypes = {
  project_id: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAddRiderCategory: PropTypes.func.isRequired,
  onAddFareMedia: PropTypes.func.isRequired,
};

export default FareSettingsPanel;
