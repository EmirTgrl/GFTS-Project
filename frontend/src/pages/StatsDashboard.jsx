import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Card, Row, Col, Alert } from "react-bootstrap";
import {
  GeoAlt,
  Signpost,
  Clock,
  BusFront,
  BarChart,
  Map,
  Database,
  Building,
} from "react-bootstrap-icons";
import "../styles/StatsDashboard.css";
import { fetchGlobalStats } from "../api/statsApi";

const StatsDashboard = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const statsData = await fetchGlobalStats(token);
        console.log("Stats Data:", statsData); // Veriyi kontrol için
        setStats(statsData);
      } catch (error) {
        setError(`Failed to load statistics: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [token]);

  return (
    <div className="stats-dashboard">
      <h4 className="text-center mb-4">
        <BarChart className="me-2" /> Statistics Dashboard
      </h4>

      {error && (
        <Alert variant="danger" className="error-alert text-center">
          <p>{error}</p>
        </Alert>
      )}

      {loading ? (
        <div className="loading-spinner text-center">
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      ) : stats ? (
        <Row className="g-3">
          <Col xs={12} sm={6} md={3} className="mb-3">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <Database size={30} className="me-2 text-primary" />
                <div className="stats-content">
                  <Card.Title className="stats-value">
                    {stats.gtfsRegistered}
                  </Card.Title>
                  <Card.Text className="stats-label">GTFS Registered</Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3} className="mb-3">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <Building size={30} className="me-2 text-danger" />
                <div className="stats-content">
                  <Card.Title className="stats-value">
                    {stats.agencyRegistered}
                  </Card.Title>
                  <Card.Text className="stats-label">
                    Agencies Registered
                  </Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3} className="mb-3">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <GeoAlt size={30} className="me-2 text-success" />
                <div className="stats-content">
                  <Card.Title className="stats-value">
                    {stats.stopsRegistered}
                  </Card.Title>
                  <Card.Text className="stats-label">
                    Stops Registered
                  </Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3} className="mb-3">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <Signpost size={30} className="me-2 text-info" />
                <div className="stats-content">
                  <Card.Title className="stats-value">
                    {stats.routesRegistered}
                  </Card.Title>
                  <Card.Text className="stats-label">
                    Routes Registered
                  </Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3} className="mb-3">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <Clock size={30} className="me-2 text-warning" />
                <div className="stats-content">
                  <Card.Title className="stats-value">
                    {stats.stopTimesRegistered}
                  </Card.Title>
                  <Card.Text className="stats-label">
                    Stop Times Registered
                  </Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3} className="mb-3">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <BusFront size={30} className="me-2 text-purple" />
                <div className="stats-content">
                  <Card.Title className="stats-value">
                    {stats.tripsRegistered}
                  </Card.Title>
                  <Card.Text className="stats-label">
                    Trips Registered
                  </Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} sm={6} md={3} className="mb-3">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <Map size={30} className="me-2 text-teal" />
                <div className="stats-content">
                  <Card.Title className="stats-value">
                    {stats.shapesRegistered}
                  </Card.Title>
                  <Card.Text className="stats-label">
                    Shapes Registered
                  </Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        !error && (
          <p className="text-center text-muted">
            Statistics data is not available.
          </p>
        )
      )}
    </div>
  );
};

StatsDashboard.propTypes = {
  token: PropTypes.string.isRequired,
};

export default StatsDashboard;
