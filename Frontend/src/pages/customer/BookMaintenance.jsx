import { useEffect, useState } from "react";
import {
  CalendarClock,
  Car,
  CheckCircle2,
  Refrigerator,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";


export default function BookMaintenance() {
  const [appliances, setAppliances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [providers, setProviders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    asset_type: "vehicle",
    asset_id: "",
    service_provider_id: "",
    maintenance_date: "",
    maintenance_time: "",
  });


  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        appliancesResponse,
        vehiclesResponse,
        providersResponse,
      ] = await Promise.all([
        api.get("/appliances"),
        api.get("/vehicles"),
        api.get("/providers"),
      ]);

      const nextAppliances =
        appliancesResponse.data?.data || [];

      const nextVehicles =
        vehiclesResponse.data?.data || [];

      const nextProviders =
        providersResponse.data?.data || [];

      setAppliances(nextAppliances);
      setVehicles(nextVehicles);

      const activeProviders =
        nextProviders.filter(
          (provider) =>
            provider.account_status === "active"
        );

      setProviders(activeProviders);

      setForm((current) => {
        const assetOptions =
          current.asset_type === "vehicle"
            ? nextVehicles
            : nextAppliances;

        return {
          ...current,
          asset_id:
            current.asset_id ||
            assetOptions[0]?.id ||
            "",
          service_provider_id:
            current.service_provider_id &&
            activeProviders.some(
              (provider) =>
                String(provider.id) ===
                String(
                  current.service_provider_id
                )
            )
              ? current.service_provider_id
              : activeProviders[0]?.id ||
                "",
        };
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load booking information."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();

    // The booking form only needs to load once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const assetOptions =
    form.asset_type === "vehicle"
      ? vehicles
      : appliances;


  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };


  const changeAssetType = (type) => {
    const options =
      type === "vehicle"
        ? vehicles
        : appliances;

    setForm((current) => ({
      ...current,
      asset_type: type,
      asset_id:
        options[0]?.id || "",
    }));
  };


  const submitBooking = async (
    event
  ) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.asset_id) {
        throw new Error(
          "Please select a maintenance profile."
        );
      }

      if (!form.service_provider_id) {
        throw new Error(
          "Please select a service provider."
        );
      }

      if (!form.maintenance_date) {
        throw new Error(
          "Please select a maintenance date."
        );
      }

      if (!form.maintenance_time) {
        throw new Error(
          "Please select a maintenance time."
        );
      }

      const selectedDate =
        new Date(
          `${form.maintenance_date}T${form.maintenance_time}`
        );

      if (
        Number.isNaN(
          selectedDate.getTime()
        )
      ) {
        throw new Error(
          "Please select a valid appointment date and time."
        );
      }

      if (
        selectedDate <= new Date()
      ) {
        throw new Error(
          "Appointment date and time must be in the future."
        );
      }

      const payload = {
        maintenance_type: "Mechanic",

        maintenance_date:
          form.maintenance_date,

        maintenance_time:
          form.maintenance_time,

        work_performed:
          "Maintenance appointment requested.",

        cost: 0,

        service_provider_id:
          Number(
            form.service_provider_id
          ),
      };

      if (
        form.asset_type === "vehicle"
      ) {
        payload.vehicle_id =
          Number(form.asset_id);
      } else {
        payload.appliance_id =
          Number(form.asset_id);
      }

      const response =
        await api.post(
          "/maintenance-records",
          payload
        );

      setSuccess(
        response.data?.message ||
          "Maintenance appointment requested successfully."
      );

      setForm((current) => ({
        ...current,
        maintenance_date: "",
        maintenance_time: "",
      }));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to create maintenance appointment."
      );
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading booking options...
      </div>
    );
  }


  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              MAINTENANCE APPOINTMENT
            </span>

            <h1>
              Book maintenance
            </h1>

            <p>
              Select your maintenance profile,
              preferred service provider, date,
              and time.
            </p>
          </div>
        </header>

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {success && (
          <div className="form-success">
            <CheckCircle2 size={17} />
            {success}
          </div>
        )}

        {appliances.length === 0 &&
        vehicles.length === 0 ? (
          <div className="empty-card">
            <Wrench size={30} />

            <h3>
              No maintenance profiles yet
            </h3>

            <p>
              Add an appliance or vehicle before
              booking maintenance.
            </p>
          </div>
        ) : providers.length === 0 ? (
          <div className="empty-card">
            <ShieldCheck size={30} />

            <h3>
              No approved service providers
            </h3>

            <p>
              There are currently no active service
              providers available for booking.
            </p>
          </div>
        ) : (
          <section className="profile-card">
            <form
              className="auth-form"
              onSubmit={submitBooking}
            >
              <div className="section-heading">
                <div>
                  <span>
                    MAINTENANCE PROFILE
                  </span>

                  <h2>
                    What needs service?
                  </h2>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="asset-type">
                    Profile type
                  </label>

                  <select
                    id="asset-type"
                    value={
                      form.asset_type
                    }
                    onChange={(event) =>
                      changeAssetType(
                        event.target.value
                      )
                    }
                    disabled={saving}
                  >
                    <option value="vehicle">
                      Vehicle
                    </option>

                    <option value="appliance">
                      Appliance
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="asset-id">
                    Maintenance profile
                  </label>

                  <select
                    id="asset-id"
                    value={
                      form.asset_id
                    }
                    onChange={(event) =>
                      updateField(
                        "asset_id",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    required
                  >
                    <option value="">
                      Select profile
                    </option>

                    {assetOptions.map(
                      (asset) => (
                        <option
                          key={asset.id}
                          value={asset.id}
                        >
                          {form.asset_type ===
                          "vehicle"
                            ? `${asset.brand} ${asset.model}`
                            : asset.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="section-heading">
                <div>
                  <span>
                    SERVICE PROVIDER
                  </span>

                  <h2>
                    Who should perform it?
                  </h2>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="service-provider">
                  Preferred service provider
                </label>

                <select
                  id="service-provider"
                  value={
                    form.service_provider_id
                  }
                  onChange={(event) =>
                    updateField(
                      "service_provider_id",
                      event.target.value
                    )
                  }
                  disabled={saving}
                  required
                >
                  <option value="">
                    Select provider
                  </option>

                  {providers.map(
                    (provider) => (
                      <option
                        key={provider.id}
                        value={provider.id}
                      >
                        {provider.full_name ||
                          provider.email}
                        {provider.service_category
                          ? ` — ${provider.service_category}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="provider-verification-row">
                <ShieldCheck size={17} />

                <span>
                  Only approved and active service
                  providers are available for booking.
                </span>
              </div>

              <div className="section-heading">
                <div>
                  <span>
                    APPOINTMENT
                  </span>

                  <h2>
                    Choose your preferred time
                  </h2>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="maintenance-date">
                    Date
                  </label>

                  <input
                    id="maintenance-date"
                    type="date"
                    value={
                      form.maintenance_date
                    }
                    min={
                      new Date()
                        .toISOString()
                        .slice(0, 10)
                    }
                    onChange={(event) =>
                      updateField(
                        "maintenance_date",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="maintenance-time">
                    Time
                  </label>

                  <input
                    id="maintenance-time"
                    type="time"
                    value={
                      form.maintenance_time
                    }
                    onChange={(event) =>
                      updateField(
                        "maintenance_time",
                        event.target.value
                      )
                    }
                    disabled={saving}
                    required
                  />
                </div>
              </div>

              <div className="provider-verification-row">
                <CalendarClock size={17} />

                <span>
                  Your request will start as Pending.
                  The selected provider must accept
                  it before the appointment proceeds.
                </span>
              </div>

              <button
                type="submit"
                className="dashboard-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Booking..."
                  : "Request appointment"}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}