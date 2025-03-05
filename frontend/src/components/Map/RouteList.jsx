import { useEffect } from "react";
import PropTypes from "prop-types";
import { fetchRoutesByProjectId, deleteRouteById } from "../../api/routeApi";
import Swal from "sweetalert2";

const RouteList = ({
  token,
  project_id,
  routes,
  setRoutes,
  filteredRoutes,
  setFilteredRoutes,
  selectedRoute,
  setSelectedRoute,
  setTrips,
  setStopsAndTimes,
  setMapCenter,
  setZoom,
  navigate,
  dropdownRef,
  isRouteDropdownOpen,
  setIsRouteDropdownOpen,
  searchTerm,
  handleRouteSelect,
}) => {
  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const data = await fetchRoutesByProjectId(project_id, token);
        const routeList = Array.isArray(data) ? data : [];
        setRoutes(routeList);
        if (!filteredRoutes.length) setFilteredRoutes(routeList);
      } catch (error) {
        console.error("Error fetching routes:", error);
        setRoutes([]);
        setFilteredRoutes([]);
      }
    };
    if (token && project_id && !routes.length) {
      loadRoutes();
    }
  }, [
    token,
    project_id,
    routes.length,
    setRoutes,
    setFilteredRoutes,
    filteredRoutes.length,
  ]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = routes.filter((route) => {
        const routeName =
          route.route_long_name || route.route_short_name || route.route_id;
        return routeName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredRoutes(filtered);
    } else {
      setFilteredRoutes(routes);
    }
  }, [searchTerm, routes, setFilteredRoutes]);

  const handleDeleteRoute = async (routeId) => {
    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu rotayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Evet, sil!",
      cancelButtonText: "Hayır, iptal et",
    });

    if (result.isConfirmed) {
      try {
        await deleteRouteById(routeId, project_id, token);
        setRoutes((prevRoutes) =>
          prevRoutes.filter((route) => route.route_id !== routeId)
        );
        setFilteredRoutes((prevRoutes) =>
          prevRoutes.filter((route) => route.route_id !== routeId)
        );
        if (selectedRoute === routeId) {
          setSelectedRoute(null);
          setTrips([]);
          setStopsAndTimes([]);
          setMapCenter([37.7749, -122.4194]);
          setZoom(13);
        }
        Swal.fire("Silindi!", "Rota başarıyla silindi.", "success");
      } catch (error) {
        console.error("Error deleting route:", error);
        Swal.fire("Hata!", "Rota silinirken bir hata oluştu.", "error");
      }
    }
  };

  const handleEditRoute = (routeId) => {
    navigate(`/edit-route/${project_id}/${routeId}`, {
      state: { selectedRoute, selectedTrip: null },
    });
  };

  const handleAddRoute = () => {
    navigate(`/add-route/${project_id}`, {
      state: { selectedRoute, selectedTrip: null },
    });
  };

  const toggleRouteDropdown = () => setIsRouteDropdownOpen((prev) => !prev);

  const getRouteStyle = (route) => {
    if (!route) {
      return { backgroundColor: "#ffffff", color: "#000000" };
    }
    return {
      backgroundColor: route.route_color ? `#${route.route_color}` : "#ffffff",
      color: route.route_text_color ? `#${route.route_text_color}` : "#000000",
    };
  };

  return (
    <div className="tab-pane fade show active h-100">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Rotalar</h5>
        <button className="btn btn-success btn-sm" onClick={handleAddRoute}>
          Yeni Rota
        </button>
      </div>
      <div className="dropdown mb-3" ref={dropdownRef}>
        <button
          className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
          type="button"
          onClick={toggleRouteDropdown}
          style={
            selectedRoute && routes.length > 0
              ? getRouteStyle(routes.find((r) => r.route_id === selectedRoute))
              : {}
          }
        >
          {selectedRoute && routes.length > 0
            ? routes.find((r) => r.route_id === selectedRoute)
                ?.route_long_name ||
              routes.find((r) => r.route_id === selectedRoute)
                ?.route_short_name ||
              selectedRoute
            : "Rota Seçin"}
        </button>
        {isRouteDropdownOpen && filteredRoutes.length > 0 && (
          <ul className="dropdown-menu show w-100">
            {filteredRoutes.map((route) => (
              <li key={route.route_id}>
                <button
                  className="dropdown-item text-truncate"
                  style={getRouteStyle(route)}
                  onClick={() => handleRouteSelect(route.route_id)}
                >
                  {route.route_long_name ||
                    route.route_short_name ||
                    route.route_id}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        {routes.map((route) => (
          <div key={route.route_id} className="card mb-2">
            <div
              className="card-body d-flex justify-content-between align-items-center p-2"
              style={getRouteStyle(route)}
            >
              <span
                className="text-truncate"
                style={{ maxWidth: "60%" }}
                title={
                  route.route_long_name ||
                  route.route_short_name ||
                  route.route_id
                }
              >
                {route.route_long_name ||
                  route.route_short_name ||
                  route.route_id}
              </span>
              <div>
                <button
                  className="btn btn-outline-primary btn-sm me-1"
                  onClick={() => handleEditRoute(route.route_id)}
                >
                  ✏️
                </button>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleDeleteRoute(route.route_id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

RouteList.propTypes = {
  token: PropTypes.string.isRequired,
  project_id: PropTypes.string.isRequired,
  routes: PropTypes.array.isRequired,
  setRoutes: PropTypes.func.isRequired,
  filteredRoutes: PropTypes.array.isRequired,
  setFilteredRoutes: PropTypes.func.isRequired,
  selectedRoute: PropTypes.string,
  setSelectedRoute: PropTypes.func.isRequired,
  setTrips: PropTypes.func.isRequired,
  setStopsAndTimes: PropTypes.func.isRequired,
  setMapCenter: PropTypes.func.isRequired,
  setZoom: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  dropdownRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  isRouteDropdownOpen: PropTypes.bool.isRequired,
  setIsRouteDropdownOpen: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  handleRouteSelect: PropTypes.func.isRequired,
};

export default RouteList;
