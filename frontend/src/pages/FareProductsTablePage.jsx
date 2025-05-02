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
} from "../api/fareApi";

const FareProductsTable = ({
  project_id,
  token,
  selectedRoute,
  fareProductsRef,
  fareDetails,
  onFareUpdate, // Yeni prop
}) => {
  const [fareMediaList, setFareMediaList] = useState([]);
  const [riderCategories, setRiderCategories] = useState([]);
  const [prices, setPrices] = useState({}); // { "rider_category_id_fare_media_id": amount }
  const [currency, setCurrency] = useState("TRY"); // Varsayılan para birimi

  // Veri çekme ve mevcut fiyatları yükleme
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ödeme yöntemlerini al
        const fareMediaData = await fetchAllFareMedia(project_id, token);
        setFareMediaList(fareMediaData || []);

        // Yolcu kategorilerini al
        const riderCategoriesData = await fetchAllRiderCategories(
          project_id,
          token
        );
        setRiderCategories(riderCategoriesData || []);

        // Mevcut fiyatları fareDetails'dan al ve prices state'ine set et
        if (fareDetails?.fixed_fares?.length > 0) {
          const initialPrices = {};
          fareDetails.fixed_fares.forEach((fare) => {
            let riderCategoryId = fare.rider_category_id;
            let fareMediaId = fare.fare_media_id;

            // rider_category_id eksikse, rider_category_name ile eşleştir
            if (!riderCategoryId && fare.rider_category_name) {
              const matchingCategory = riderCategoriesData.find(
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

            // fare_media_id eksikse, fare_media_name ile eşleştir
            if (!fareMediaId && fare.fare_media_name) {
              const matchingMedia = fareMediaData.find(
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

            // Hem riderCategoryId hem fareMediaId varsa prices'a ekle
            if (riderCategoryId && fareMediaId && fare.amount) {
              const key = `${riderCategoryId}_${fareMediaId}`;
              initialPrices[key] = fare.amount.toString();
            }
          });
          setPrices(initialPrices);
          setCurrency(fareDetails.fixed_fares[0]?.currency || "TRY");
        } else {
          setPrices({});
        }
      } catch (error) {
        console.error("Error while loading data:", error);
        Swal.fire("Error!", "Failed to load data.", "error");
      }
    };
    fetchData();
  }, [project_id, token, fareDetails]);

  // Fiyat input'larını güncelleme
  const handlePriceChange = (riderCategoryId, fareMediaId, value) => {
    const key = `${riderCategoryId}_${fareMediaId}`;
    const sanitizedValue = value.replace(/[^0-9.]/g, ""); // Sadece sayı ve nokta
    setPrices((prev) => ({
      ...prev,
      [key]: sanitizedValue,
    }));
  };

  // Fare ürünü silme
  const handleDeleteFareProduct = async (riderCategoryId, fareMediaId) => {
    const fare = fareDetails?.fixed_fares?.find(
      (f) =>
        f.rider_category_id === riderCategoryId &&
        f.fare_media_id === fareMediaId
    );
    if (!fare) {
      Swal.fire("Error!", "No fare found to delete.", "error");
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

        // Fare detaylarını güncelle
        const updatedFareDetails = await fetchDetailedFareForRoute(
          selectedRoute.route_id,
          project_id,
          token
        );
        if (updatedFareDetails) {
          // Ref üzerinden Sidebar'a bildir
          if (fareProductsRef.current?.handleAddFareProduct) {
            fareProductsRef.current.handleAddFareProduct(updatedFareDetails);
          }
          // Callback üzerinden Sidebar'a bildir
          if (onFareUpdate) {
            onFareUpdate(updatedFareDetails);
          }
        }

        // prices state'inden sil
        setPrices((prev) => {
          const newPrices = { ...prev };
          delete newPrices[`${riderCategoryId}_${fareMediaId}`];
          return newPrices;
        });

        Swal.fire("Success!", "Fare successfully deleted.", "success");
      } catch (error) {
        console.error("Deleting error:", error);
        let errorMessage = "An error occurred while deleting the fare.";
        if (error.message.includes("dependent tables")) {
          errorMessage =
            "This fare could not be deleted because it is dependent on other rules. Remove the relevant rules first.";
        }
        Swal.fire("Error!", errorMessage, "error");
      }
    }
  };

  // Kaydetme işlemi
  const handleSubmit = async () => {
    if (!selectedRoute?.route_id) {
      Swal.fire("Error!", "Selected route information is missing!", "error");
      return;
    }

    // Geçerli fiyatları topla
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

    // Hiç fiyat girilmemişse uyarı göster
    if (validPrices.length === 0) {
      const result = await Swal.fire({
        title: "Price not entered!",
        text: "Are you sure you want to save without entering any price??",
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

    // Onay al
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `${validPrices.length} prices will be saved. Do you want to continue?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, save!",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      try {
        // Mevcut fare ürünlerini al
        const existingFares = fareDetails?.fixed_fares || [];

        for (const price of validPrices) {
          const existingFare = existingFares.find(
            (fare) =>
              fare.rider_category_id === price.rider_category_id &&
              fare.fare_media_id === price.fare_media_id
          );

          const payload = {
            fare_product_name: `${price.rider_category_name}_${price.fare_media_name}`,
            amount: price.amount,
            currency,
            rider_category_id: price.rider_category_id,
            fare_media_id: price.fare_media_id,
            route_id: selectedRoute.route_id,
          };

          if (existingFare) {
            // Mevcut fare ürününü güncelle
            await updateFareProduct(
              project_id,
              token,
              existingFare.fare_product_id,
              payload
            );
          } else {
            // Yeni fare ürünü ekle
            await addFareProduct(project_id, token, payload);
          }
        }

        // Fare detaylarını güncelle
        const updatedFareDetails = await fetchDetailedFareForRoute(
          selectedRoute.route_id,
          project_id,
          token
        );
        if (updatedFareDetails) {
          // Ref üzerinden Sidebar'a bildir
          if (fareProductsRef.current?.handleAddFareProduct) {
            fareProductsRef.current.handleAddFareProduct(updatedFareDetails);
          }
          // Callback üzerinden Sidebar'a bildir
          if (onFareUpdate) {
            onFareUpdate(updatedFareDetails);
          }
        }

        Swal.fire("Success!", "Prices saved successfully.", "success");
      } catch (error) {
        console.error("Saving error:", error);
        Swal.fire(
          "Error!",
          `An error occurred while saving prices: ${error.message}`,
          "error"
        );
      }
    }
  };

  // Fare Media veya Rider Category eklendiğinde güncelle
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

  // fareProductsRef ile fonksiyonları bağla
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

            // rider_category_id eksikse, rider_category_name ile eşleştir
            if (!riderCategoryId && fare.rider_category_name) {
              const matchingCategory = riderCategories.find(
                (cat) => cat.rider_category_name === fare.rider_category_name
              );
              if (matchingCategory) {
                riderCategoryId = matchingCategory.rider_category_id;
              }
            }

            // fare_media_id eksikse, fare_media_name ile eşleştir
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
              updatedPrices[key] = fare.amount.toString();
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
          Please first define Payment Methods and Passenger Categories in Other
          Fares.
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
                        f.fare_media_id === media.fare_media_id
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
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        currency: PropTypes.string,
        rider_category_name: PropTypes.string,
        fare_media_name: PropTypes.string,
      })
    ),
  }),
  onFareUpdate: PropTypes.func, // Yeni prop
};

export default FareProductsTable;
