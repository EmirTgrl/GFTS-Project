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
        setStats(statsData);
      } catch (error) {
        setError(`Failed to load statistics: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [token]);

  const cards = [
    {
      icon: <Database size={30} />,
      label: "GTFS Registered",
      value: stats?.gtfsRegistered,
      color: "primary",
    },
    {
      icon: <Building size={30} />,
      label: "Agencies Registered",
      value: stats?.agencyRegistered,
      color: "danger",
    },
    {
      icon: <GeoAlt size={30} />,
      label: "Stops Registered",
      value: stats?.stopsRegistered,
      color: "success",
    },
    {
      icon: <Signpost size={30} />,
      label: "Routes Registered",
      value: stats?.routesRegistered,
      color: "info",
    },
    {
      icon: <Clock size={30} />,
      label: "Stop Times Registered",
      value: stats?.stopTimesRegistered,
      color: "warning",
    },
    {
      icon: <BusFront size={30} />,
      label: "Trips Registered",
      value: stats?.tripsRegistered,
      color: "purple",
    },
    {
      icon: <Map size={30} />,
      label: "Shapes Registered",
      value: stats?.shapesRegistered,
      color: "teal",
    },
  ];

  return (
    <div className="stats-dashboard">
      <h4 className="text-center mb-4">
        <BarChart className="me-2" /> Statistics Dashboard
      </h4>

      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="loading-spinner text-center">
          <div className="spinner"></div>
          <p>Loading statistics...</p>
        </div>
      ) : (
        <Row className="g-4 justify-content-center">
          {cards.map((card, idx) => (
            <Col xs={12} sm={6} md={4} lg={3} key={idx}>
              <Card className={`stats-card border-top-${card.color}`}>
                <Card.Body className="d-flex align-items-center">
                  <div className={`stats-icon text-${card.color}`}>
                    {card.icon}
                  </div>
                  <div className="stats-content">
                    <Card.Title className="stats-value">
                      {card.value}
                    </Card.Title>
                    <Card.Text className="stats-label">{card.label}</Card.Text>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

StatsDashboard.propTypes = {
  token: PropTypes.string.isRequired,
};

export default StatsDashboard;
