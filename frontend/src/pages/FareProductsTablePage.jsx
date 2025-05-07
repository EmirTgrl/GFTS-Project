import { useState, useEffect } from "react";
import { Button, Table, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import PropTypes from "prop-types";
import { Trash } from "react-bootstrap-icons";
import {
  fetchAllFareMedia,
  fetchAllRiderCategories,
  addFareProduct,
  updateFareProduct,
  deleteFareProduct,
  fetchDetailedFareForRoute,
  fetchAllAreas,
} from "../api/fareApi";

const FareProductsTable = ({
  project_id,
  token,
  selectedRoute,
  fareProductsRef,
  fareDetails,
  onFareUpdate,
}) => {
  const [fareMediaList, setFareMediaList] = useState([]);
  const [riderCategories, setRiderCategories] = useState([]);
  const [areas, setAreas] = useState([]);
  const [fromAreaId, setFromAreaId] = useState("");
  const [toAreaId, setToAreaId] = useState("");
  const [prices, setPrices] = useState({});
  const [currency, setCurrency] = useState("TRY");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fareMediaData = await fetchAllFareMedia(project_id, token);
        setFareMediaList(fareMediaData || []);

        const riderCategoriesData = await fetchAllRiderCategories(
          project_id,
          token
        );
        setRiderCategories(riderCategoriesData || []);

        const areasData = await fetchAllAreas(project_id, token);
        setAreas(areasData || []);
      } catch (error) {
        console.error("Error while loading data:", error);
        Swal.fire("Error!", "Data could not be uploaded.", "error");
      }
    };
    fetchData();
  }, [project_id, token]);

  useEffect(() => {
    if (!fareDetails?.fixed_fares?.length) {
      setPrices({});
      return;
    }

    const updatePrices = () => {
      const filteredPrices = {};
      fareDetails.fixed_fares.forEach((fare) => {
        let riderCategoryId = fare.rider_category_id;
        let fareMediaId = fare.fare_media_id;

        if (!riderCategoryId && fare.rider_category_name) {
          const matchingCategory = riderCategories.find(
            (cat) => cat.rider_category_name === fare.rider_category_name
          );
          if (matchingCategory) {
            riderCategoryId = matchingCategory.rider_category_id;
          } else {
            console.warn(
              `No matching ID found for Rider category name "${fare.rider_category_name}".`
            );
          }
        }

        if (!fareMediaId && fare.fare_media_name) {
          const matchingMedia = fareMediaList.find(
            (media) => media.fare_media_name === fare.fare_media_name
          );
          if (matchingMedia) {
            fareMediaId = matchingMedia.fare_media_id;
          } else {
            console.warn(
              `No matching ID found for fare media name "${fare.fare_media_name}".`
            );
          }
        }

        if (riderCategoryId && fareMediaId && fare.amount) {
          const key = `${riderCategoryId}_${fareMediaId}`;
          if (fromAreaId && toAreaId) {
            if (
              fare.from_area_id === fromAreaId &&
              fare.to_area_id === toAreaId
            ) {
              filteredPrices[key] = fare.amount.toString();
            }
          } else {
            filteredPrices[key] = fare.amount.toString();
          }
        }
      });
      setPrices(filteredPrices);
      setCurrency(fareDetails.fixed_fares[0]?.currency || "TRY");
    };

    updatePrices();
  }, [fareDetails, riderCategories, fareMediaList, fromAreaId, toAreaId]);

  const handlePriceChange = (riderCategoryId, fareMediaId, value) => {
    const key = `${riderCategoryId}_${fareMediaId}`;
    const sanitizedValue = value.replace(/[^0-9.]/g, "");
    setPrices((prev) => ({
      ...prev,
      [key]: sanitizedValue,
    }));
  };

  const handleDeleteFareProduct = async (riderCategoryId, fareMediaId) => {
    const fare = fareDetails?.fixed_fares?.find(
      (f) =>
        f.rider_category_id === riderCategoryId &&
        f.fare_media_id === fareMediaId &&
        (!fromAreaId || f.from_area_id === fromAreaId) &&
        (!toAreaId || f.to_area_id === toAreaId)
    );
    if (!fare) {
      Swal.fire("Error!", "No fares found to be deleted.", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `"Are you sure you want to delete the fare "${fare.rider_category_name} - ${fare.fare_media_name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "No, cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteFareProduct(project_id, token, fare.fare_product_id);

        const updatedFareDetails = await fetchDetailedFareForRoute(
          selectedRoute?.route_id,
          project_id,
          token
        );
        if (updatedFareDetails) {
          if (fareProductsRef.current?.handleAddFareProduct) {
            fareProductsRef.current.handleAddFareProduct(updatedFareDetails);
          }
          if (onFareUpdate) {
            onFareUpdate(updatedFareDetails);
          }
        }

        setPrices((prev) => {
          const newPrices = { ...prev };
          delete newPrices[`${riderCategoryId}_${fareMediaId}`];
          return newPrices;
        });

        Swal.fire("Success!", "Fare successfully deleted.", "success");
      } catch (error) {
        console.error("Deletion error:", error);
        let errorMessage = "An error occurred while deleting the fare.";
        if (error.message.includes("dependent tables")) {
          errorMessage =
            "This fare could not be deleted because it is linked to other rules. Please remove the related rules first.";
        }
        Swal.fire("Error!", errorMessage, "error");
      }
    }
  };

  const handleSubmit = async () => {
    if (!fromAreaId || !toAreaId) {
      Swal.fire("Error!", "Please select the start and end areas!", "error");
      return;
    }

    if (!selectedRoute?.route_id) {
      Swal.fire("Error!", "Route not selected!", "error");
      return;
    }

    const validPrices = [];
    for (const rider of riderCategories) {
      for (const media of fareMediaList) {
        const key = `${rider.rider_category_id}_${media.fare_media_id}`;
        const price = prices[key];
        if (price && !isNaN(price) && parseFloat(price) > 0) {
          validPrices.push({
            rider_category_id: rider.rider_category_id,
            fare_media_id: media.fare_media_id,
            amount: parseFloat(price),
            rider_category_name: rider.rider_category_name,
            fare_media_name: media.fare_media_name,
          });
        }
      }
    }

    if (validPrices.length === 0) {
      const result = await Swal.fire({
        title: "No price entered!",
        text: "Are you sure you want to save without entering a price?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, save!",
        cancelButtonText: "No",
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${validPrices.length} price will be saved for the selected fields. Do you want to continue?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, save!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        const existingFares = fareDetails?.fixed_fares || [];

        for (const price of validPrices) {
          const existingFare = existingFares.find(
            (fare) =>
              fare.rider_category_id === price.rider_category_id &&
              fare.fare_media_id === price.fare_media_id &&
              fare.from_area_id === fromAreaId &&
              fare.to_area_id === toAreaId
          );

          const payload = {
            fare_product_name: `${price.rider_category_name}_${price.fare_media_name}`,
            amount: price.amount,
            currency,
            rider_category_id: price.rider_category_id,
            fare_media_id: price.fare_media_id,
            from_area_id: fromAreaId,
            to_area_id: toAreaId,
            route_id: selectedRoute.route_id,
          };

          if (existingFare) {
            await updateFareProduct(
              project_id,
              token,
              existingFare.fare_product_id,
              payload
            );
          } else {
            await addFareProduct(project_id, token, payload);
          }
        }

        const updatedFareDetails = await fetchDetailedFareForRoute(
          selectedRoute?.route_id,
          project_id,
          token
        );
        if (updatedFareDetails) {
          if (fareProductsRef.current?.handleAddFareProduct) {
            fareProductsRef.current.handleAddFareProduct(updatedFareDetails);
          }
          if (onFareUpdate) {
            onFareUpdate(updatedFareDetails);
          }
        }

        Swal.fire("Success!", "Prices successfully recorded.", "success");
      } catch (error) {
        console.error("Saving error:", error);
        let errorMessage = `Error saving prices: ${error.message}`;
        if (error.message.includes("network information")) {
          errorMessage =
            "Failed to save fare: No network is defined for the selected area or route. Please define a network.";
        }
        Swal.fire("Error!", errorMessage, "error");
      }
    }
  };

  const handleAddFareMedia = (newMedia) => {
    if (newMedia?.fare_media_id && newMedia.fare_media_name) {
      setFareMediaList((prev) => [
        ...prev.filter((m) => m.fare_media_id !== newMedia.fare_media_id),
        newMedia,
      ]);
    } else {
      fetchAllFareMedia(project_id, token)
        .then((data) => setFareMediaList(data || []))
        .catch((error) =>
          console.error("Error while refreshing payment methods:", error)
        );
    }
  };

  const handleAddRiderCategory = (newCategory) => {
    if (newCategory?.rider_category_id && newCategory.rider_category_name) {
      setRiderCategories((prev) => [
        ...prev.filter(
          (c) => c.rider_category_id !== newCategory.rider_category_id
        ),
        newCategory,
      ]);
    } else {
      fetchAllRiderCategories(project_id, token)
        .then((data) => setRiderCategories(data || []))
        .catch((error) =>
          console.error("Error while refreshing passenger categories:", error)
        );
    }
  };

  if (fareProductsRef) {
    fareProductsRef.current = {
      handleAddFareMedia,
      handleAddRiderCategory,
      handleAddFareProduct: (updatedFareDetails) => {
        if (updatedFareDetails?.fixed_fares?.length > 0) {
          const updatedPrices = {};
          updatedFareDetails.fixed_fares.forEach((fare) => {
            let riderCategoryId = fare.rider_category_id;
            let fareMediaId = fare.fare_media_id;

            if (!riderCategoryId && fare.rider_category_name) {
              const matchingCategory = riderCategories.find(
                (cat) => cat.rider_category_name === fare.rider_category_name
              );
              if (matchingCategory) {
                riderCategoryId = matchingCategory.rider_category_id;
              }
            }

            if (!fareMediaId && fare.fare_media_name) {
              const matchingMedia = fareMediaList.find(
                (media) => media.fare_media_name === fare.fare_media_name
              );
              if (matchingMedia) {
                fareMediaId = matchingMedia.fare_media_id;
              }
            }

            if (riderCategoryId && fareMediaId && fare.amount) {
              const key = `${riderCategoryId}_${fareMediaId}`;
              if (fromAreaId && toAreaId) {
                if (
                  fare.from_area_id === fromAreaId &&
                  fare.to_area_id === toAreaId
                ) {
                  updatedPrices[key] = fare.amount.toString();
                }
              } else {
                updatedPrices[key] = fare.amount.toString();
              }
            }
          });
          setPrices(updatedPrices);
          setCurrency(updatedFareDetails.fixed_fares[0]?.currency || "TRY");
        } else {
          setPrices({});
        }
      },
    };
  }

  return (
    <div className="fare-products-table">
      {fareMediaList.length === 0 || riderCategories.length === 0 ? (
        <div className="alert alert-warning">
          Please first define Payment Methods and Passenger Categories in the
          Other Fees section.
        </div>
      ) : (
        <>
          <div className="mb-3">
            <Form.Group>
              <Form.Label>Currency</Form.Label>
              <Form.Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>From Area</Form.Label>
              <Form.Select
                value={fromAreaId}
                onChange={(e) => setFromAreaId(e.target.value)}
              >
                <option value="">Select Area</option>
                {areas.map((area) => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.area_name || area.area_id}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label>To Area</Form.Label>
              <Form.Select
                value={toAreaId}
                onChange={(e) => setToAreaId(e.target.value)}
              >
                <option value="">Select Area</option>
                {areas.map((area) => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.area_name || area.area_id}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
          <Table bordered responsive>
            <thead>
              <tr>
                <th style={{ width: "25%" }}>
                  Rider Category / Payment Method
                </th>
                {fareMediaList.map((media) => (
                  <th
                    key={media.fare_media_id}
                    style={{ width: `${75 / fareMediaList.length}%` }}
                  >
                    {media.fare_media_name || "Unknown"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riderCategories.map((rider) => (
                <tr key={rider.rider_category_id}>
                  <td>{rider.rider_category_name || "Unknown"}</td>
                  {fareMediaList.map((media) => {
                    const key = `${rider.rider_category_id}_${media.fare_media_id}`;
                    const fare = fareDetails?.fixed_fares?.find(
                      (f) =>
                        f.rider_category_id === rider.rider_category_id &&
                        f.fare_media_id === media.fare_media_id &&
                        (!fromAreaId || f.from_area_id === fromAreaId) &&
                        (!toAreaId || f.to_area_id === toAreaId)
                    );
                    return (
                      <td key={media.fare_media_id}>
                        <div className="d-flex align-items-center">
                          <Form.Control
                            type="number"
                            step="1"
                            min="0"
                            value={prices[key] || ""}
                            onChange={(e) =>
                              handlePriceChange(
                                rider.rider_category_id,
                                media.fare_media_id,
                                e.target.value
                              )
                            }
                            placeholder="Enter Price"
                            style={{ width: "100px", marginRight: "8px" }}
                          />
                          {fare && (
                            <Button
                              variant="link"
                              className="p-0"
                              onClick={() =>
                                handleDeleteFareProduct(
                                  rider.rider_category_id,
                                  media.fare_media_id
                                )
                              }
                            >
                              <Trash size={16} color="#dc3545" />
                            </Button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
          <Button variant="primary" onClick={handleSubmit}>
            Save Prices
          </Button>
        </>
      )}
    </div>
  );
};

FareProductsTable.propTypes = {
  project_id: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  selectedRoute: PropTypes.shape({
    route_id: PropTypes.string,
  }),
  fareProductsRef: PropTypes.shape({
    current: PropTypes.any,
  }),
  fareDetails: PropTypes.shape({
    fixed_fares: PropTypes.arrayOf(
      PropTypes.shape({
        fare_product_id: PropTypes.string,
        fare_product_name: PropTypes.string,
        rider_category_id: PropTypes.string,
        fare_media_id: PropTypes.string,
        from_area_id: PropTypes.string,
        to_area_id: PropTypes.string,
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        currency: PropTypes.string,
        rider_category_name: PropTypes.string,
        fare_media_name: PropTypes.string,
      })
    ),
  }),
  onFareUpdate: PropTypes.func,
};

export default FareProductsTable;
