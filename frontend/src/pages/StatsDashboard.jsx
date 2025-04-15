import { useState, useEffect } from "react";
import { Card, Row, Col, Alert } from "react-bootstrap";
import {
  HouseDoor,
  GeoAlt, 
  Signpost,
  Clock, 
  BusFront,
  BarChart,
  Map,
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
        <BarChart className="me-2" /> Global Statistics Dashboard
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
        <Row>
          <Col md={4} className="mb-4">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <HouseDoor size={40} className="me-3 text-primary" />
                <div>
                  <Card.Title className="stats-value">
                    {stats.gtfsRegistered}
                  </Card.Title>
                  <Card.Text className="stats-label">GTFS Registered</Card.Text>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <GeoAlt size={40} className="me-3 text-success" />
                <div>
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
          <Col md={4} className="mb-4">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <Signpost size={40} className="me-3 text-info" />
                <div>
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
          <Col md={4} className="mb-4">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <Clock size={40} className="me-3 text-warning" />
                <div>
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
          <Col md={4} className="mb-4">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <BusFront size={40} className="me-3 text-purple" />
                <div>
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
          <Col md={4} className="mb-4">
            <Card className="stats-card shadow-sm">
              <Card.Body className="d-flex align-items-center">
                <Map size={40} className="me-3 text-teal" />
                <div>
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

export default StatsDashboard;
