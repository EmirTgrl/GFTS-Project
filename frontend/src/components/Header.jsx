import { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./Auth/AuthContext.js";
import {
  Navbar,
  Nav,
  NavDropdown,
  Modal,
  Button,
  Table,
} from "react-bootstrap";
import {
  PersonCircle,
  Upload,
  HouseDoor,
  CheckCircle,
  BarChart,
} from "react-bootstrap-icons";
import Swal from "sweetalert2";
import JSZip from "jszip";
import StatsDashboard from "../pages/StatsDashboard.jsx"
import { fetchAgenciesByProjectId } from "../api/agencyApi.js";
import { fetchRoutesByProjectId } from "../api/routeApi.js";
import { fetchTripsByProjectId } from "../api/tripApi.js";
import { fetchStopsByProjectId } from "../api/stopApi.js";
import { fetchCalendarsByProjectId } from "../api/calendarApi.js";
import { fetchShapesByTripId } from "../api/shapeApi.js";
import { fetchStopsAndStopTimesByTripId } from "../api/stopTimeApi.js";
import "../styles/Header.css";

const GTFS_TABLES = [
  {
    fileName: "agency.txt",
    headers: ["agency_id", "agency_name", "agency_url", "agency_timezone"],
    fetchData: async (project_id, token) =>
      (await fetchAgenciesByProjectId(project_id, token)).data || [],
  },
  {
    fileName: "routes.txt",
    headers: [
      "route_id",
      "agency_id",
      "route_short_name",
      "route_long_name",
      "route_type",
    ],
    fetchData: async (project_id, token) =>
      (await fetchRoutesByProjectId(project_id, token)).data || [],
  },
  {
    fileName: "trips.txt",
    headers: [
      "route_id",
      "service_id",
      "trip_id",
      "trip_headsign",
      "direction_id",
      "shape_id",
    ],
    fetchData: async (project_id, token) =>
      (await fetchTripsByProjectId(project_id, token)).data || [],
  },
  {
    fileName: "stops.txt",
    headers: ["stop_id", "stop_name", "stop_lat", "stop_lon"],
    fetchData: async (project_id, token) =>
      (await fetchStopsByProjectId(project_id, token)).data || [],
  },
  {
    fileName: "stop_times.txt",
    headers: [
      "trip_id",
      "arrival_time",
      "departure_time",
      "stop_id",
      "stop_sequence",
    ],
    fetchData: async (project_id, token) => {
      const trips = (await fetchTripsByProjectId(project_id, token)).data || [];
      const stopTimes = await Promise.all(
        trips.map((trip) =>
          fetchStopsAndStopTimesByTripId(trip.trip_id, project_id, token)
        )
      );
      return stopTimes.flat();
    },
  },
  {
    fileName: "calendar.txt",
    headers: [
      "service_id",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
      "start_date",
      "end_date",
    ],
    fetchData: async (project_id, token) =>
      (await fetchCalendarsByProjectId(project_id, token)).data || [],
  },
  {
    fileName: "shapes.txt",
    headers: ["shape_id", "shape_pt_lat", "shape_pt_lon", "shape_pt_sequence"],
    fetchData: async (project_id, token) => {
      const trips = (await fetchTripsByProjectId(project_id, token)).data || [];
      const shapes = await Promise.all(
        trips.map((trip) =>
          fetchShapesByTripId(project_id, trip.shape_id, token)
        )
      );
      return shapes.flat();
    },
  },
];

const arrayToCSV = (data, headers) => {
  const csvRows = [];
  csvRows.push(headers.join(","));
  data.forEach((row) => {
    const values = headers.map(
      (header) => `"${String(row[header] || "").replace(/"/g, '""')}"`
    );
    csvRows.push(values.join(","));
  });
  return csvRows.join("\n");
};

const createGTFSZip = async (project_id, token) => {
  const zip = new JSZip();

  try {
    const tableDataPromises = GTFS_TABLES.map(async (table) => {
      const data = await table.fetchData(project_id, token);
      return { ...table, data };
    });

    const tableData = await Promise.all(tableDataPromises);

    tableData.forEach(({ fileName, headers, data }) => {
      if (data.length > 0) {
        zip.file(fileName, arrayToCSV(data, headers));
      }
    });

    return await zip.generateAsync({ type: "blob" });
  } catch (error) {
    console.error("Error creating GTFS ZIP:", error);
    throw new Error("Failed to create GTFS ZIP file");
  }
};

const Header = () => {
  const { isAuthenticated, logout, username, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false); 
  const [validationResult, setValidationResult] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { state: { isLogin: true }, replace: true });
  };

  const handleValidate = async () => {
    const project_id = location.pathname.split("/")[2];
    if (!project_id) {
      Swal.fire("Error!", "No project selected.", "error");
      return;
    }

    Swal.fire({
      title: "Validating...",
      text: "Please wait while the GTFS data is being validated.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      if (!token || token.trim() === "") {
        throw new Error("No valid authentication token provided");
      }

      const zipBlob = await createGTFSZip(project_id, token);

      const formData = new FormData();
      formData.append("file", zipBlob, `project_${project_id}_validate.zip`);

      const response = await fetch(
        `http://localhost:5000/api/io/validate/${project_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Validation request failed: ${errorText}`);
      }

      const result = await response.json();
      setValidationResult(result);
      setShowValidationModal(true);
      Swal.close();
    } catch (error) {
      Swal.fire("Error!", `Validation failed: ${error.message}`, "error");
    }
  };

  const getDynamicHeaders = (samples) => {
    const headers = new Set(["Code", "Total"]);
    samples.forEach((sample) => {
      Object.keys(sample).forEach((key) => {
        if (key !== "code" && key !== "totalNotices") {
          const formattedKey = key
            .replace(/([A-Z])/g, " $1")
            .trim()
            .replace(/^./, (str) => str.toUpperCase());
          headers.add(formattedKey);
        }
      });
    });
    return Array.from(headers);
  };

  const renderValidationTable = (items, type) => {
    if (!items || items.length === 0) return null;

    return items.map((item, index) => {
      const headers = getDynamicHeaders(item.samples);
      return (
        <div key={index} className="mb-4">
          <h6 className={type === "errors" ? "text-danger" : "text-warning"}>
            {item.code} ({item.total} occurrences)
          </h6>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                {headers.map((header, i) => (
                  <th key={i}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {item.samples.length > 0 ? (
                item.samples.map((sample, i) => (
                  <tr key={i}>
                    {headers.map((header, j) => {
                      const key = header.toLowerCase().replace(/\s/g, "");
                      return (
                        <td key={j}>
                          {header === "Code"
                            ? item.code
                            : header === "Total"
                            ? item.total
                            : sample[key] !== undefined && sample[key] !== null
                            ? sample[key]
                            : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length} className="text-center">
                    No sample data available
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      );
    });
  };

  const showValidateButton = location.pathname.startsWith("/map/");

  return (
    <>
      <Navbar expand="lg" className="custom-navbar" fixed="top">
        <Navbar.Brand as={Link} to="/" className="navbar-brand">
          <span className="fs-4">KentKart</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {isAuthenticated ? (
              <>
                <Nav.Link
                  as={Link}
                  to="/"
                  className="nav-link-custom"
                  title="Home"
                >
                  <HouseDoor size={20} />
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/import"
                  className="nav-link-custom"
                  title="Import"
                >
                  <Upload size={20} />
                </Nav.Link>
                {showValidateButton && (
                  <Nav.Link
                    className="nav-link-custom"
                    title="Validate"
                    onClick={handleValidate}
                  >
                    <CheckCircle size={20} />
                  </Nav.Link>
                )}
                <Nav.Link
                  className="nav-link-custom"
                  title="Statistics"
                  onClick={() => setShowStatsModal(true)} // Modal aç
                >
                  <BarChart size={20} />
                </Nav.Link>
                <NavDropdown
                  title={<PersonCircle size={20} color="#fff" />}
                  id="user-dropdown"
                  align="end"
                  className="nav-link-custom"
                >
                  <NavDropdown.Header className="user-name">
                    {username || "User"}
                  </NavDropdown.Header>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : null}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* Validation Modal */}
      {showValidationModal && (
        <Modal
          show={showValidationModal}
          onHide={() => setShowValidationModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>GTFS Validation Report</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {validationResult ? (
              <>
                {validationResult.success ? (
                  <p className="text-success">
                    No errors found in the GTFS data!
                  </p>
                ) : (
                  <>
                    {validationResult.errors?.length > 0 && (
                      <>
                        <h5 className="text-danger">Errors</h5>
                        {renderValidationTable(
                          validationResult.errors,
                          "errors"
                        )}
                      </>
                    )}
                    {validationResult.warnings?.length > 0 && (
                      <>
                        <h5 className="text-warning">Warnings</h5>
                        {renderValidationTable(
                          validationResult.warnings,
                          "warnings"
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <p className="text-muted">Validation data is not available.</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowValidationModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Statistics Modal */}
      {showStatsModal && (
        <Modal
          show={showStatsModal}
          onHide={() => setShowStatsModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Statistics Dashboard</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <StatsDashboard token={token} />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowStatsModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default Header;
