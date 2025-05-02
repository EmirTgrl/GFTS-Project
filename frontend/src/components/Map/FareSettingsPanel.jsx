import { useState, useEffect } from "react";
import { Modal, Tabs, Tab, Table, Button, Form } from "react-bootstrap";
import { Pencil, Trash, PlusLg } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import {
  fetchAllRiderCategories,
  fetchAllFareMedia,
  updateRiderCategory,
  deleteRiderCategory,
  updateFareMedia,
  deleteFareMedia,
} from "../../api/fareApi";
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
  const [showEditRiderForm, setShowEditRiderForm] = useState(false);
  const [showEditFareMediaForm, setShowEditFareMediaForm] = useState(false);
  const [selectedRiderCategory, setSelectedRiderCategory] = useState(null);
  const [selectedFareMedia, setSelectedFareMedia] = useState(null);

  // Verileri çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categories = await fetchAllRiderCategories(project_id, token);
        setRiderCategories(categories || []);
        const media = await fetchAllFareMedia(project_id, token);
        setFareMedia(media || []);
      } catch (error) {
        console.error("Error while loading data:", error);
        Swal.fire("Error", "Failed to load data.", "error");
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
    setShowRiderForm(false);
    Swal.fire("Success!", "Passenger category added.", "success");
  };

  // Fare Media ekleme
  const handleAddFareMedia = (newMedia) => {
    setFareMedia((prev) => [...prev, newMedia]);
    onAddFareMedia(newMedia);
    setShowFareMediaForm(false);
    Swal.fire("Success!", "Payment method added.", "success");
  };

  // Rider Category düzenleme
  const handleEditRiderCategory = (category) => {
    setSelectedRiderCategory(category);
    setShowEditRiderForm(true);
  };

  const handleUpdateRiderCategory = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const riderCategoryData = {
      rider_category_name: formData.get("rider_category_name"),
      is_default_fare_category: formData.get("is_default_fare_category")
        ? 1
        : 0,
      eligibility_url: formData.get("eligibility_url") || null,
    };

    try {
      await updateRiderCategory(
        project_id,
        token,
        selectedRiderCategory.rider_category_id,
        riderCategoryData
      );
      const updatedCategories = await fetchAllRiderCategories(
        project_id,
        token
      );
      setRiderCategories(updatedCategories || []);
      setShowEditRiderForm(false);
      Swal.fire("Success!", "Passenger category updated.", "success");
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };

  // Rider Category silme
  const handleDeleteRiderCategory = async (rider_category_id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to delete this passenger category?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        await deleteRiderCategory(project_id, token, rider_category_id);
        const updatedCategories = await fetchAllRiderCategories(
          project_id,
          token
        );
        setRiderCategories(updatedCategories || []);
        Swal.fire("Success!", "Passenger category deleted.", "success");
      } catch (error) {
        Swal.fire("Error!", error.message, "error");
      }
    }
  };

  // Fare Media düzenleme
  const handleEditFareMedia = (media) => {
    setSelectedFareMedia(media);
    setShowEditFareMediaForm(true);
  };

  const handleUpdateFareMedia = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const fareMediaData = {
      fare_media_name: formData.get("fare_media_name"),
      fare_media_type: parseInt(formData.get("fare_media_type")),
    };

    try {
      await updateFareMedia(
        project_id,
        token,
        selectedFareMedia.fare_media_id,
        fareMediaData
      );
      const updatedMedia = await fetchAllFareMedia(project_id, token);
      setFareMedia(updatedMedia || []);
      setShowEditFareMediaForm(false);
      Swal.fire("Success!", "Payment method updated.", "success");
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };

  // Fare Media silme
  const handleDeleteFareMedia = async (fare_media_id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to delete this payment method?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        await deleteFareMedia(project_id, token, fare_media_id);
        const updatedMedia = await fetchAllFareMedia(project_id, token);
        setFareMedia(updatedMedia || []);
        Swal.fire("Success!", "The payment method was deleted.", "success");
      } catch (error) {
        Swal.fire("Hata!", error.message, "error");
      }
    }
  };

  const getFareMediaTypeLabel = (type) => {
    switch (parseInt(type)) {
      case 0:
        return "Cash Payment";
      case 1:
        return "Physical Paper Ticket";
      case 2:
        return "Physical Transit Card";
      case 3:
        return "cEMV (contactless Europay, Mastercard and Visa)";
      case 4:
        return "Mobile App";
      default:
        return "Unknown Type";
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
                        <Button
                          variant="link"
                          title="Edit"
                          onClick={() => handleEditRiderCategory(category)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="link"
                          title="Delete"
                          onClick={() =>
                            handleDeleteRiderCategory(
                              category.rider_category_id
                            )
                          }
                        >
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
            <Modal
              show={showEditRiderForm}
              onHide={() => setShowEditRiderForm(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Edit Rider Category</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedRiderCategory && (
                  <Form onSubmit={handleUpdateRiderCategory}>
                    <Form.Group className="mb-3">
                      <Form.Label>Rider Category Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="rider_category_name"
                        defaultValue={selectedRiderCategory.rider_category_name}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Eligibility URL</Form.Label>
                      <Form.Control
                        type="url"
                        name="eligibility_url"
                        defaultValue={selectedRiderCategory.eligibility_url}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="is_default_fare_category"
                        label="Default Fare Category"
                        defaultChecked={
                          selectedRiderCategory.is_default_fare_category
                        }
                      />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                      Save Changes
                    </Button>
                  </Form>
                )}
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
                        <Button
                          variant="link"
                          title="Edit"
                          onClick={() => handleEditFareMedia(media)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="link"
                          title="Delete"
                          onClick={() =>
                            handleDeleteFareMedia(media.fare_media_id)
                          }
                        >
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
            <Modal
              show={showEditFareMediaForm}
              onHide={() => setShowEditFareMediaForm(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Edit Payment Method</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedFareMedia && (
                  <Form onSubmit={handleUpdateFareMedia}>
                    <Form.Group className="mb-3">
                      <Form.Label>Fare Media Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="fare_media_name"
                        defaultValue={selectedFareMedia.fare_media_name}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Fare Media Type</Form.Label>
                      <Form.Select
                        name="fare_media_type"
                        defaultValue={selectedFareMedia.fare_media_type}
                        required
                      >
                        <option value="0">Cash Payment</option>
                        <option value="1">Physical Paper Ticket</option>
                        <option value="2">Physical Transit Card</option>
                        <option value="3">
                          cEMV (contactless Europay, Mastercard and Visa)
                        </option>
                        <option value="4">Mobile App</option>
                      </Form.Select>
                    </Form.Group>
                    <Button variant="primary" type="submit">
                      Save Changes
                    </Button>
                  </Form>
                )}
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
