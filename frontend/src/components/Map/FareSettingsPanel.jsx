import { useState, useEffect } from "react";
import { Modal, Tabs, Tab, Table, Button, Form } from "react-bootstrap";
import { Pencil, Trash, PlusLg } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import Select from "react-select";
import {
  fetchAllRiderCategories,
  updateRiderCategory,
  deleteRiderCategory,
  fetchAllFareMedia,
  updateFareMedia,
  deleteFareMedia,
  fetchAllFareTransferRules,
  updateFareTransferRule,
  deleteFareTransferRule,
  fetchAllFareProducts,
  fetchAllNetworks,
  updateNetwork,
  deleteNetwork,
  fetchAllAreas,
  updateArea,
  deleteArea,
} from "../../api/fareApi";
import { fetchRoutesByProjectId } from "../../api/routeApi";
import { fetchAllStopsByProjectId } from "../../api/stopApi";
import RiderCategoriesAddPage from "../../pages/RiderCategoriesAddPage";
import FareMediaAddPage from "../../pages/FareMediaAddPage";
import AddFareTransferRuleForm from "../../pages/FareTransferRuleAddPAge";
import NetworkAddForm from "../../pages/NetworkAddPage";
import AreaAddPage from "../../pages/AreaAddPage";
import "../../styles/FareSettingsPanel.css";

// FareSettingsPanel component for managing fare-related settings
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
  const [fareTransferRules, setFareTransferRules] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [areas, setAreas] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [fareProducts, setFareProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("rider_categories");
  const [showRiderForm, setShowRiderForm] = useState(false);
  const [showFareMediaForm, setShowFareMediaForm] = useState(false);
  const [showTransferRuleForm, setShowTransferRuleForm] = useState(false);
  const [showNetworkForm, setShowNetworkForm] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showEditRiderForm, setShowEditRiderForm] = useState(false);
  const [showEditFareMediaForm, setShowEditFareMediaForm] = useState(false);
  const [showEditTransferRuleForm, setShowEditTransferRuleForm] =
    useState(false);
  const [showEditNetworkForm, setShowEditNetworkForm] = useState(false);
  const [showEditAreaForm, setShowEditAreaForm] = useState(false);
  const [selectedRiderCategory, setSelectedRiderCategory] = useState(null);
  const [selectedFareMedia, setSelectedFareMedia] = useState(null);
  const [selectedTransferRule, setSelectedTransferRule] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedStops, setSelectedStops] = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState([]);

  // Fetch all data when modal is shown
  useEffect(() => {
    const fetchData = async () => {
      try {
        const categories = await fetchAllRiderCategories(project_id, token);
        setRiderCategories(categories || []);
        const media = await fetchAllFareMedia(project_id, token);
        setFareMedia(media || []);
        const transferRules = await fetchAllFareTransferRules(
          project_id,
          token
        );
        setFareTransferRules(transferRules || []);
        const networksData = await fetchAllNetworks(project_id, token);
        setNetworks(networksData || []);
        const areasData = await fetchAllAreas(project_id, token);
        setAreas(areasData || []);
        const stopsData = await fetchAllStopsByProjectId(project_id, token);
        setStops(Array.isArray(stopsData.data) ? stopsData.data : []);
        const products = await fetchAllFareProducts(project_id, token);
        setFareProducts(products || []);

        // Fetch all routes across all pages
        let allRoutes = [];
        let page = 1;
        const limit = 8;
        while (true) {
          const response = await fetchRoutesByProjectId(
            project_id,
            token,
            page,
            limit
          );
          const routesData = Array.isArray(response.data) ? response.data : [];
          allRoutes = [...allRoutes, ...routesData];
          if (
            routesData.length < limit ||
            !response.total ||
            allRoutes.length >= response.total
          ) {
            break;
          }
          page++;
        }
        setRoutes(allRoutes);
      } catch (error) {
        console.error("Error while loading data:", error);
        Swal.fire("Error", "Failed to load data.", "error");
      }
    };
    if (show) {
      fetchData();
    }
  }, [project_id, token, show]);

  // Handle adding a new rider category
  const handleAddRiderCategory = (newCategory) => {
    setRiderCategories((prev) => [...prev, newCategory]);
    onAddRiderCategory(newCategory);
    setShowRiderForm(false);
    Swal.fire("Success!", "Rider category added.", "success");
  };

  // Handle adding a new fare media
  const handleAddFareMedia = (newMedia) => {
    setFareMedia((prev) => [...prev, newMedia]);
    onAddFareMedia(newMedia);
    setShowFareMediaForm(false);
    Swal.fire("Success!", "Fare media added.", "success");
  };

  // Handle adding a new transfer rule
  const handleAddTransferRule = (newRule) => {
    setFareTransferRules((prev) => [...prev, newRule]);
    setShowTransferRuleForm(false);
    Swal.fire("Success!", "Transfer rule added.", "success");
  };

  // Handle adding a new network
  const handleAddNetwork = (newNetwork) => {
    setNetworks((prev) => [...prev, newNetwork]);
    setShowNetworkForm(false);
    Swal.fire("Success!", "Network added.", "success");
  };

  // Handle adding a new area
  const handleAddArea = (newArea) => {
    setAreas((prev) => [...prev, newArea]);
    setShowAreaForm(false);
    Swal.fire("Success!", "Area added.", "success");
  };

  // Handle editing a rider category
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
      Swal.fire("Success!", "Rider category updated.", "success");
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };

  // Handle deleting a rider category
  const handleDeleteRiderCategory = async (rider_category_id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this rider category?",
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
        Swal.fire("Success!", "Rider category deleted.", "success");
      } catch (error) {
        Swal.fire("Error!", error.message, "error");
      }
    }
  };

  // Handle editing a fare media
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
      Swal.fire("Success!", "Fare media updated.", "success");
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };

  // Handle deleting a fare media
  const handleDeleteFareMedia = async (fare_media_id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this fare media?",
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
        Swal.fire("Success!", "Fare media deleted.", "success");
      } catch (error) {
        Swal.fire("Error!", error.message, "error");
      }
    }
  };

  // Handle editing a transfer rule
  const handleEditTransferRule = (rule) => {
    setSelectedTransferRule(rule);
    setShowEditTransferRuleForm(true);
  };

  const handleUpdateTransferRule = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const transferRuleData = {
      transfer_count: parseInt(formData.get("transfer_count")) || 1,
      duration_limit: formData.get("duration_limit")
        ? parseInt(formData.get("duration_limit"))
        : null,
      duration_limit_type: formData.get("duration_limit_type")
        ? parseInt(formData.get("duration_limit_type"))
        : null,
      fare_transfer_type: parseInt(formData.get("fare_transfer_type")),
      fare_product_id: formData.get("fare_product_id") || null,
    };

    try {
      await updateFareTransferRule(
        project_id,
        token,
        selectedTransferRule.from_leg_group_id,
        selectedTransferRule.to_leg_group_id,
        transferRuleData
      );
      const updatedRules = await fetchAllFareTransferRules(project_id, token);
      setFareTransferRules(updatedRules || []);
      setShowEditTransferRuleForm(false);
      Swal.fire("Success!", "Transfer rule updated.", "success");
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };

  // Handle deleting a transfer rule
  const handleDeleteTransferRule = async (
    from_leg_group_id,
    to_leg_group_id
  ) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this transfer rule?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        await deleteFareTransferRule(
          project_id,
          token,
          from_leg_group_id,
          to_leg_group_id
        );
        const updatedRules = await fetchAllFareTransferRules(project_id, token);
        setFareTransferRules(updatedRules || []);
        Swal.fire("Success!", "Transfer rule deleted.", "success");
      } catch (error) {
        Swal.fire("Error!", error.message, "error");
      }
    }
  };

  // Handle editing a network
  const handleEditNetwork = (network) => {
    setSelectedNetwork(network);
    setSelectedRoutes(
      routeOptions.filter((option) => network.route_ids?.includes(option.value))
    );
    setShowEditNetworkForm(true);
  };

  const handleUpdateNetwork = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const networkData = {
      network_name: formData.get("network_name"),
      route_ids: selectedRoutes.map((route) => route.value),
    };

    try {
      await updateNetwork(
        project_id,
        token,
        selectedNetwork.network_id,
        networkData
      );
      const updatedNetworks = await fetchAllNetworks(project_id, token);
      setNetworks(updatedNetworks || []);
      setShowEditNetworkForm(false);
      setSelectedRoutes([]);
      Swal.fire("Success!", "Network updated.", "success");
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };

  // Handle deleting a network
  const handleDeleteNetwork = async (network_id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this network?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        await deleteNetwork(project_id, token, network_id);
        const updatedNetworks = await fetchAllNetworks(project_id, token);
        setNetworks(updatedNetworks || []);
        Swal.fire("Success!", "Network deleted.", "success");
      } catch (error) {
        Swal.fire("Error!", error.message, "error");
      }
    }
  };

  // Handle editing an area
  const handleEditArea = (area) => {
    setSelectedArea(area);
    setSelectedStops(
      stopOptions.filter((option) => area.stop_ids?.includes(option.value))
    );
    setShowEditAreaForm(true);
  };

  const handleUpdateArea = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const areaData = {
      area_name: formData.get("area_name"),
      stop_ids: selectedStops.map((stop) => stop.value),
    };

    try {
      await updateArea(project_id, token, selectedArea.area_id, areaData);
      const updatedAreas = await fetchAllAreas(project_id, token);
      setAreas(updatedAreas || []);
      setShowEditAreaForm(false);
      setSelectedStops([]);
      Swal.fire("Success!", "Area updated.", "success");
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };

  // Handle deleting an area
  const handleDeleteArea = async (area_id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this area?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        await deleteArea(project_id, token, area_id);
        const updatedAreas = await fetchAllAreas(project_id, token);
        setAreas(updatedAreas || []);
        Swal.fire("Success!", "Area deleted.", "success");
      } catch (error) {
        Swal.fire("Error!", error.message, "error");
      }
    }
  };

  // Prepare stop and route options for react-select
  const stopOptions = stops.map((stop) => ({
    value: stop.stop_id,
    label: stop.stop_name || stop.stop_id,
  }));

  const routeOptions = routes.map((route) => ({
    value: route.route_id,
    label: route.route_long_name || route.route_short_name || route.route_id,
  }));

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

  const getTransferTypeLabel = (type) => {
    switch (parseInt(type)) {
      case 0:
        return "One-Way";
      case 1:
        return "Two-Way";
      case 2:
        return "Circular";
      default:
        return "Unknown Type";
    }
  };

  const getDurationLimitTypeLabel = (type) => {
    switch (parseInt(type)) {
      case 0:
        return "Departure-to-Departure";
      case 1:
        return "Departure-to-Arrival";
      case 2:
        return "Arrival-to-Departure";
      case 3:
        return "Arrival-to-Arrival";
      default:
        return "Undefined";
    }
  };

  // Get route names for display
  const getRouteNames = (routeIds) => {
    if (!routeIds || routeIds.length === 0) return "-";
    const routeNames = routeIds
      .map((id) => {
        const route = routes.find((r) => r.route_id === id);
        return route
          ? route.route_long_name || route.route_short_name || route.route_id
          : id;
      })
      .filter(Boolean);
    return routeNames.length > 0 ? routeNames.join(", ") : "-";
  };

  // Get stop names for display
  const getStopNames = (stopIds) => {
    if (!stopIds || stopIds.length === 0) return "-";
    const stopNames = stopIds
      .map((id) => {
        const stop = stops.find((s) => s.stop_id === id);
        return stop ? stop.stop_name || stop.stop_id : id;
      })
      .filter(Boolean);
    return stopNames.length > 0 ? stopNames.join(", ") : "-";
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
        <Modal.Title>Fare Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="rider_categories" title="Passenger Types">
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
                  <th>Passenger Type Name</th>
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
                      No rider categories found.
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
                <Modal.Title>Add New Passenger Type</Modal.Title>
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
                      <Form.Label>Passenger Type Name</Form.Label>
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
          <Tab eventKey="fare_media" title="Payment Methods">
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
                  <th>Payment Method Name</th>
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
                      No fare media found.
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
                <Modal.Title>Add New Fare Media</Modal.Title>
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
                <Modal.Title>Edit Fare Media</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedFareMedia && (
                  <Form onSubmit={handleUpdateFareMedia}>
                    <Form.Group className="mb-3">
                      <Form.Label>Payment Method Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="fare_media_name"
                        defaultValue={selectedFareMedia.fare_media_name}
                        required
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
          <Tab eventKey="transfer_rules" title="Transfer Rules">
            <div className="d-flex justify-content-end mb-3">
              <Button
                onClick={() => setShowTransferRuleForm(true)}
                className="add-button"
              >
                <PlusLg size={16} className="me-1" /> Add New Transfer Rule
              </Button>
            </div>
            <Table striped bordered hover className="mt-3">
              <thead>
                <tr>
                  <th>From Leg Group</th>
                  <th>To Leg Group</th>
                  <th>Transfer Count</th>
                  <th>Duration Limit (s)</th>
                  <th>Duration Limit Type</th>
                  <th>Transfer Type</th>
                  <th>Fare Product</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fareTransferRules.length > 0 ? (
                  fareTransferRules.map((rule) => (
                    <tr
                      key={`${rule.from_leg_group_id}-${rule.to_leg_group_id}`}
                    >
                      <td>{rule.from_leg_group_id}</td>
                      <td>{rule.to_leg_group_id}</td>
                      <td>{rule.transfer_count || 1}</td>
                      <td>{rule.duration_limit || "-"}</td>
                      <td>
                        {getDurationLimitTypeLabel(rule.duration_limit_type) ||
                          "-"}
                      </td>
                      <td>{getTransferTypeLabel(rule.fare_transfer_type)}</td>
                      <td>{rule.transfer_fare_product || "-"}</td>
                      <td>
                        <Button
                          variant="link"
                          title="Edit"
                          onClick={() => handleEditTransferRule(rule)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="link"
                          title="Delete"
                          onClick={() =>
                            handleDeleteTransferRule(
                              rule.from_leg_group_id,
                              rule.to_leg_group_id
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
                    <td colSpan={8} className="text-center">
                      No transfer rules found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
            <Modal
              show={showTransferRuleForm}
              onHide={() => setShowTransferRuleForm(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Add New Transfer Rule</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <AddFareTransferRuleForm
                  project_id={project_id}
                  token={token}
                  onAdd={handleAddTransferRule}
                  onClose={() => setShowTransferRuleForm(false)}
                />
              </Modal.Body>
            </Modal>
            <Modal
              show={showEditTransferRuleForm}
              onHide={() => setShowEditTransferRuleForm(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Edit Transfer Rule</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedTransferRule && (
                  <Form onSubmit={handleUpdateTransferRule}>
                    <Form.Group className="mb-3">
                      <Form.Label>Transfer Count</Form.Label>
                      <Form.Control
                        type="number"
                        name="transfer_count"
                        defaultValue={selectedTransferRule.transfer_count || 1}
                        min="0"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Duration Limit (s)</Form.Label>
                      <Form.Control
                        type="number"
                        name="duration_limit"
                        defaultValue={selectedTransferRule.duration_limit || ""}
                        min="0"
                        placeholder="Optional"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Duration Limit Type</Form.Label>
                      <Form.Select
                        name="duration_limit_type"
                        defaultValue={
                          selectedTransferRule.duration_limit_type || ""
                        }
                      >
                        <option value="">Select (Optional)</option>
                        <option value="0">Departure-to-Departure</option>
                        <option value="1">Departure-to-Arrival</option>
                        <option value="2">Arrival-to-Departure</option>
                        <option value="3">Arrival-to-Arrival</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Transfer Type</Form.Label>
                      <Form.Select
                        name="fare_transfer_type"
                        defaultValue={selectedTransferRule.fare_transfer_type}
                        required
                      >
                        <option value="0">One-Way</option>
                        <option value="1">Two-Way</option>
                        <option value="2">Circular</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Fare Product</Form.Label>
                      <Form.Select
                        name="fare_product_id"
                        defaultValue={
                          selectedTransferRule.fare_product_id || ""
                        }
                      >
                        <option value="">Select (Optional)</option>
                        {fareProducts.map((product) => (
                          <option
                            key={product.fare_product_id}
                            value={product.fare_product_id}
                          >
                            {product.fare_product_name}
                          </option>
                        ))}
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
          <Tab eventKey="networks" title="Networks">
            <div className="d-flex justify-content-end mb-3">
              <Button
                onClick={() => setShowNetworkForm(true)}
                className="add-button"
              >
                <PlusLg size={16} className="me-1" /> Add New Network
              </Button>
            </div>
            <Table striped bordered hover className="mt-3">
              <thead>
                <tr>
                  <th>Network ID</th>
                  <th>Network Name</th>
                  <th>Routes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {networks.length > 0 ? (
                  networks.map((network) => (
                    <tr key={network.network_id}>
                      <td>{network.network_id}</td>
                      <td>{network.network_name}</td>
                      <td>{getRouteNames(network.route_ids)}</td>
                      <td>
                        <Button
                          variant="link"
                          title="Edit"
                          onClick={() => handleEditNetwork(network)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="link"
                          title="Delete"
                          onClick={() =>
                            handleDeleteNetwork(network.network_id)
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
                      No networks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
            <Modal
              show={showNetworkForm}
              onHide={() => setShowNetworkForm(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Add New Network</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <NetworkAddForm
                  project_id={project_id}
                  token={token}
                  onAdd={handleAddNetwork}
                  onClose={() => setShowNetworkForm(false)}
                />
              </Modal.Body>
            </Modal>
            <Modal
              show={showEditNetworkForm}
              onHide={() => setShowEditNetworkForm(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Edit Network</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedNetwork && (
                  <Form
                    onSubmit={handleUpdateNetwork}
                    className="edit-network-form"
                  >
                    <Form.Group className="mb-4">
                      <Form.Label>Network ID</Form.Label>
                      <Form.Control
                        type="text"
                        name="network_id"
                        defaultValue={selectedNetwork.network_id}
                        readOnly
                        className="form-control-lg"
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Network Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="network_name"
                        defaultValue={selectedNetwork.network_name}
                        required
                        className="form-control-lg"
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Routes (Optional)</Form.Label>
                      <Select
                        isMulti
                        name="route_ids"
                        options={routeOptions}
                        value={selectedRoutes}
                        onChange={setSelectedRoutes}
                        placeholder="Select routes..."
                        className="basic-multi-select"
                        classNamePrefix="select"
                        noOptionsMessage={() => "No routes available"}
                        isSearchable
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "48px",
                            height: "auto",
                            borderColor: "#ced4da",
                            boxShadow: "none",
                            borderRadius: "6px",
                            fontSize: "16px",
                            padding: "4px",
                            "&:hover": {
                              borderColor: "#007bff",
                            },
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 9999,
                            fontSize: "16px",
                            borderRadius: "6px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: "#e9ecef",
                            borderRadius: "4px",
                            padding: "2px",
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: "#212529",
                            fontSize: "15px",
                            padding: "4px 8px",
                          }),
                          multiValueRemove: (base) => ({
                            ...base,
                            color: "#dc3545",
                            padding: "4px",
                            "&:hover": {
                              backgroundColor: "#dc3545",
                              color: "white",
                            },
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: "#6c757d",
                            fontSize: "16px",
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected
                              ? "#007bff"
                              : state.isFocused
                              ? "#f1f3f5"
                              : "white",
                            color: state.isSelected ? "white" : "#212529",
                            padding: "10px 12px",
                            fontSize: "16px",
                            "&:active": {
                              backgroundColor: "#e9ecef",
                            },
                          }),
                          input: (base) => ({
                            ...base,
                            fontSize: "16px",
                            padding: "4px",
                          }),
                        }}
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                      <Button variant="primary" type="submit">
                        Save Changes
                      </Button>
                    </div>
                  </Form>
                )}
              </Modal.Body>
            </Modal>
          </Tab>
          <Tab eventKey="areas" title="Areas">
            <div className="d-flex justify-content-end mb-3">
              <Button
                onClick={() => setShowAreaForm(true)}
                className="add-button"
              >
                <PlusLg size={16} className="me-1" /> Add New Area
              </Button>
            </div>
            <Table striped bordered hover className="mt-3">
              <thead>
                <tr>
                  <th>Area ID</th>
                  <th>Area Name</th>
                  <th>Stops</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {areas.length > 0 ? (
                  areas.map((area) => (
                    <tr key={area.area_id}>
                      <td>{area.area_id}</td>
                      <td>{area.area_name}</td>
                      <td>{getStopNames(area.stop_ids)}</td>
                      <td>
                        <Button
                          variant="link"
                          title="Edit"
                          onClick={() => handleEditArea(area)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="link"
                          title="Delete"
                          onClick={() => handleDeleteArea(area.area_id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center">
                      No areas found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
            <Modal
              show={showAreaForm}
              onHide={() => setShowAreaForm(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Add New Area</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <AreaAddPage
                  project_id={project_id}
                  token={token}
                  onAdd={handleAddArea}
                  onClose={() => setShowAreaForm(false)}
                />
              </Modal.Body>
            </Modal>
            <Modal
              show={showEditAreaForm}
              onHide={() => setShowEditAreaForm(false)}
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title>Edit Area</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedArea && (
                  <Form onSubmit={handleUpdateArea} className="edit-area-form">
                    <Form.Group className="mb-4">
                      <Form.Label>Area ID</Form.Label>
                      <Form.Control
                        type="text"
                        name="area_id"
                        defaultValue={selectedArea.area_id}
                        readOnly
                        className="form-control-lg"
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Area Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="area_name"
                        defaultValue={selectedArea.area_name}
                        required
                        className="form-control-lg"
                      />
                    </Form.Group>
                    <Form.Group className="mb-4">
                      <Form.Label>Stops (Optional)</Form.Label>
                      <Select
                        isMulti
                        name="stop_ids"
                        options={stopOptions}
                        value={selectedStops}
                        onChange={setSelectedStops}
                        placeholder="Select stops..."
                        className="basic-multi-select"
                        classNamePrefix="select"
                        noOptionsMessage={() => "No stops available"}
                        isSearchable
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "48px",
                            height: "auto",
                            borderColor: "#ced4da",
                            boxShadow: "none",
                            borderRadius: "6px",
                            fontSize: "16px",
                            padding: "4px",
                            "&:hover": {
                              borderColor: "#007bff",
                            },
                          }),
                          menu: (base) => ({
                            ...base,
                            zIndex: 9999,
                            fontSize: "16px",
                            borderRadius: "6px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: "#e9ecef",
                            borderRadius: "4px",
                            padding: "2px",
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: "#212529",
                            fontSize: "15px",
                            padding: "4px 8px",
                          }),
                          multiValueRemove: (base) => ({
                            ...base,
                            color: "#dc3545",
                            padding: "4px",
                            "&:hover": {
                              backgroundColor: "#dc3545",
                              color: "white",
                            },
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: "#6c757d",
                            fontSize: "16px",
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected
                              ? "#007bff"
                              : state.isFocused
                              ? "#f1f3f5"
                              : "white",
                            color: state.isSelected ? "white" : "#212529",
                            padding: "10px 12px",
                            fontSize: "16px",
                            "&:active": {
                              backgroundColor: "#e9ecef",
                            },
                          }),
                          input: (base) => ({
                            ...base,
                            fontSize: "16px",
                            padding: "4px",
                          }),
                        }}
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                      <Button variant="primary" type="submit">
                        Save Changes
                      </Button>
                    </div>
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
