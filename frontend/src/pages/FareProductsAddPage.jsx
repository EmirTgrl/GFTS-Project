import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import { addFareProduct, fetchDetailedFareForRoute } from "../api/fareApi";
import {
  fetchAllFareMedia,
  fetchAllRiderCategories,
} from "../api/fareApi";
import Swal from "sweetalert2";
import PropTypes from "prop-types";

const FareProductsAddPage = ({
  project_id,
  onClose,
  selectedRoute,
  fareMediaList = [],
  riderCategories = [],
}) => {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    fare_product_name: "",
    amount: "",
    currency: "TRY",
    rider_category_id: "",
    fare_media_id: "",
    project_id,
  });
  const [loading, setLoading] = useState(false);
  const [localFareMediaList, setLocalFareMediaList] = useState(fareMediaList);
  const [localRiderCategories, setLocalRiderCategories] =
    useState(riderCategories);

  // İlk yüklemede veya project_id/token değiştiğinde veri çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Prop'lar boşsa API'den veri çek
        if (fareMediaList.length === 0) {
          const fareMediaData = await fetchAllFareMedia(
            project_id,
            token
          );
          setLocalFareMediaList(fareMediaData || []);
        } else {
          setLocalFareMediaList(fareMediaList);
        }

        if (riderCategories.length === 0) {
          const riderCategoriesData = await fetchAllRiderCategories(
            project_id,
            token
          );
          setLocalRiderCategories(riderCategoriesData || []);
        } else {
          setLocalRiderCategories(riderCategories);
        }
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
        Swal.fire("Hata!", "Veriler yüklenemedi.", "error");
      }
    };

    fetchData();
  }, [project_id, token]); // Sadece project_id ve token bağımlılıkları

  // Prop'lar değiştiğinde local state'leri güncelle
  useEffect(() => {
    if (fareMediaList.length > 0) {
      setLocalFareMediaList(fareMediaList);
    }
    if (riderCategories.length > 0) {
      setLocalRiderCategories(riderCategories);
    }
  }, [fareMediaList, riderCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fare_product_name || !formData.amount || !formData.currency) {
      Swal.fire("Hata!", "Ürün adı, tutar ve para birimi zorunludur!", "error");
      return;
    }

    if (!selectedRoute?.route_id) {
      Swal.fire("Hata!", "Seçilen rota bilgisi eksik!", "error");
      return;
    }

    const result = await Swal.fire({
      title: "Emin misiniz?",
      text: "Bu ücret ürününü eklemek istediğinize emin misiniz?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Evet, ekle!",
      cancelButtonText: "Hayır",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const payload = {
          fare_product_name: formData.fare_product_name,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          rider_category_id: formData.rider_category_id || null,
          fare_media_id: formData.fare_media_id || null,
          route_id: selectedRoute.route_id,
        };

        console.log("addFareProduct payload:", payload);
        const response = await addFareProduct(project_id, token, payload);
        console.log("addFareProduct response:", response);

        // Fare details'i güncelle
        if (selectedRoute?.route_id) {
          const fareDetails = await fetchDetailedFareForRoute(
            selectedRoute.route_id,
            project_id,
            token
          );
          console.log("Updated fareDetails:", fareDetails);
          if (fareDetails && onClose) {
            onClose(fareDetails); // Güncellenmiş fare detaylarını üst bileşene ilet
          }
        }

        Swal.fire("Başarılı!", "Ücret ürünü başarıyla eklendi.", "success");
        setFormData({
          fare_product_name: "",
          amount: "",
          currency: "TRY",
          rider_category_id: "",
          fare_media_id: "",
          project_id,
        });
      } catch (error) {
        console.error("Error:", error);
        Swal.fire(
          "Hata!",
          `Ücret ürünü eklenirken hata oluştu: ${error.message}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="form-container">
      <h5>Yeni Ücret Ürünü Ekle</h5>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label htmlFor="fare_product_name" className="form-label">
            Ücret Ürünü Adı (*)
          </label>
          <input
            type="text"
            className="form-control"
            id="fare_product_name"
            name="fare_product_name"
            value={formData.fare_product_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="amount" className="form-label">
            Tutar (*)
          </label>
          <input
            type="number"
            className="form-control"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>
        <div className="mb-2">
          <label htmlFor="currency" className="form-label">
            Para Birimi (*)
          </label>
          <select
            className="form-control"
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            required
          >
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="rider_category_id" className="form-label">
            Yolcu Kategorisi
          </label>
          <select
            className="form-control"
            id="rider_category_id"
            name="rider_category_id"
            value={formData.rider_category_id}
            onChange={handleChange}
          >
            <option value="">Seçiniz</option>
            {localRiderCategories.map((category) => (
              <option
                key={category.rider_category_id}
                value={category.rider_category_id}
              >
                {category.rider_category_name || category.rider_category_id}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="fare_media_id" className="form-label">
            Ödeme Yöntemi
          </label>
          <select
            className="form-control"
            id="fare_media_id"
            name="fare_media_id"
            value={formData.fare_media_id}
            onChange={handleChange}
          >
            <option value="">Seçiniz</option>
            {localFareMediaList.map((media) => (
              <option key={media.fare_media_id} value={media.fare_media_id}>
                {media.fare_media_name || media.fare_media_id} (Tip:{" "}
                {media.fare_media_type})
              </option>
            ))}
          </select>
        </div>
        <div className="d-flex justify-content-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Ekleniyor..." : "Ekle"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onClose()}
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
};

FareProductsAddPage.propTypes = {
  project_id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedRoute: PropTypes.shape({
    route_id: PropTypes.string.isRequired,
  }),
  fareMediaList: PropTypes.array,
  riderCategories: PropTypes.array,
};

export default FareProductsAddPage;
