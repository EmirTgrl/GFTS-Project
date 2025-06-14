import { Container, Row, Col, Card, Button, ListGroup } from "react-bootstrap";
import { CheckCircleFill, XCircleFill, StarFill } from "react-bootstrap-icons";

const VersionPage = () => (
  <Container className="py-4">
    <Row className="justify-content-center align-items-stretch">
      <Col xs={12} className="d-flex justify-content-center">
        <div className="version-cards-flex">
          <Card className="version-card shadow-sm border-0 me-md-4 mb-4 mb-md-0">
            <Card.Body className="p-4 d-flex flex-column">
              <h4 className="text-center mb-2 fw-bold text-secondary"> {/* mb-4 yerine mb-2 */}
                <StarFill className="me-2" /> Basic
              </h4>
              <ListGroup variant="flush">
                <ListGroup.Item className="border-0 py-2">
                  <XCircleFill className="text-danger me-2" />
                  Data viewing only
                </ListGroup.Item>
                <ListGroup.Item className="border-0 py-2">
                  <XCircleFill className="text-danger me-2" />
                  Review project and details
                </ListGroup.Item>
                <ListGroup.Item className="border-0 py-2 text-muted">
                  <XCircleFill className="text-danger me-2" />
                  Add, edit and delete data
                </ListGroup.Item>
                <ListGroup.Item className="border-0 py-2 text-muted">
                  <XCircleFill className="text-danger me-2" />
                  Advanced management tools
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
          <Card className="version-card shadow-sm border-0">
            <Card.Body className="p-4 d-flex flex-column">
              <h4 className="text-center mb-2 fw-bold text-warning"> {/* mb-4 yerine mb-2 */}
                <StarFill className="me-2" /> Premium
              </h4>
              <ListGroup variant="flush">
                <ListGroup.Item className="border-0 py-2">
                  <CheckCircleFill className="text-success me-2" />
                  Add, edit and delete data
                </ListGroup.Item>
                <ListGroup.Item className="border-0 py-2">
                  <CheckCircleFill className="text-success me-2" />
                  Full access to all features
                </ListGroup.Item>
                <ListGroup.Item className="border-0 py-2">
                  <CheckCircleFill className="text-success me-2" />
                  Advanced management and analysis tools
                </ListGroup.Item>
              </ListGroup>
              <div className="text-center mt-4">
                <Button
                  variant="success"
                  size="lg"
                  className="w-100 rounded-pill"
                  onClick={() =>
                    window.alert(
                      "For premium membership, please contact your system administrator."
                    )
                  }
                >
                  Switch to Premium
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Col>
    </Row>
    <div className="text-center mt-3 text-muted small">
      With a premium membership, you can have all advanced features and full
      management <br />
      Contact your system administrator for more information.
    </div>
  </Container>
);

export default VersionPage;