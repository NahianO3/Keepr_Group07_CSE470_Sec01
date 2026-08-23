import { useEffect, useState } from "react";
import {
  UserCircle,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
  Star,
  CheckCircle2,
  Wrench,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import ServiceForm from "../../components/ServiceForm";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  service_category: "",
  service_area: "",
  expertise: "",
  bio: "",
  hourly_rate: "",
  availability_schedule: "",
  is_available: true,
};

export default function ProviderProfile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [services, setServices] = useState([]);
  const [showServiceForm, setShowServiceForm] =
    useState(false);
  const [editingService, setEditingService] =
    useState(null);
  const [savingService, setSavingService] =
    useState(false);
  const [servicesError, setServicesError] =
    useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = async () => {
    try {
      const response = await api.get("/provider/profile");
      const data = response.data?.data;

      setProfile(data);

      setForm({
        service_category: data?.service_category || "",
        service_area: data?.service_area || "",
        expertise: data?.expertise || "",
        bio: data?.bio || "",
        hourly_rate: data?.hourly_rate ?? "",
        availability_schedule:
          data?.availability_schedule || "",
        is_available: data?.is_available ?? true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load provider profile."
      );
    }
  };

  const loadServices = async () => {
    try {
      setServicesError("");

      const response = await api.get(
        "/provider/services"
      );

      setServices(response.data?.data || []);
    } catch (err) {
      setServicesError(
        err.response?.data?.message ||
          "Unable to load your services."
      );
    }
  };

  useEffect(() => {
    loadProfile();
    loadServices();
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.put("/provider/profile", {
        service_category: form.service_category.trim(),
        service_area: form.service_area.trim(),
        expertise: form.expertise.trim(),
        bio: form.bio.trim(),
        hourly_rate:
          form.hourly_rate === "" ? "" : Number(form.hourly_rate),
        availability_schedule:
          form.availability_schedule.trim(),
        is_available: form.is_available,
      });

      setProfile(response.data?.data || null);
      setSuccess("Provider profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update provider profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const openAddService = () => {
    setEditingService(null);
    setShowServiceForm(true);
  };

  const openEditService = (service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const closeServiceForm = () => {
    if (savingService) return;

    setShowServiceForm(false);
    setEditingService(null);
  };

  const saveService = async (values) => {
    try {
      setSavingService(true);
      setServicesError("");

      if (editingService) {
        await api.put(
          `/provider/services/${editingService.id}`,
          values
        );
      } else {
        await api.post("/provider/services", values);
      }

      closeServiceForm();
      await loadServices();
    } catch (err) {
      setServicesError(
        err.response?.data?.message ||
          "Unable to save service."
      );
    } finally {
      setSavingService(false);
    }
  };

  const deleteService = async (service) => {
    const confirmed = window.confirm(
      `Remove "${service.service_name}" from your offered services?`
    );

    if (!confirmed) return;

    try {
      setServicesError("");

      await api.delete(
        `/provider/services/${service.id}`
      );

      await loadServices();
    } catch (err) {
      setServicesError(
        err.response?.data?.message ||
          "Unable to delete service."
      );
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">SERVICE PROVIDER</span>
            <h1>My profile</h1>
            <p>
              Your account information and the details customers
              see when searching for providers.
            </p>
          </div>
        </header>

        <section className="profile-grid">
          <div className="profile-card profile-summary-card">
            <div className="profile-avatar-large">
              {user?.email?.charAt(0)?.toUpperCase() || "P"}
            </div>

            <h2>{user?.email || "Service Provider"}</h2>

            <span className="verified-badge">
              <BadgeCheck size={14} />
              Service Provider
            </span>

            <div className="provider-profile-status">
              <ShieldCheck size={17} />
              <div>
                <strong>Account active</strong>
                <span>
                  Your account can manage assigned maintenance
                  requests.
                </span>
              </div>
            </div>

            {profile && (
              <div className="provider-card-meta">
                <div>
                  <Star size={14} />
                  <strong>
                    {profile.rating
                      ? Number(profile.rating).toFixed(1)
                      : "No ratings yet"}
                  </strong>
                </div>
                <div>
                  <CheckCircle2 size={14} />
                  <strong>
                    {profile.completed_service_count || 0} completed
                  </strong>
                </div>
              </div>
            )}
          </div>

          <div className="profile-card">
            <div className="section-heading">
              <div>
                <span>ACCOUNT INFORMATION</span>
                <h2>Contact details</h2>
              </div>
            </div>

            <div className="profile-information">
              <ProfileRow
                icon={<Mail size={18} />}
                label="Email"
                value={user?.email || "—"}
              />
              <ProfileRow
                icon={<Phone size={18} />}
                label="Phone"
                value={profile?.phone || "Not provided"}
              />
              <ProfileRow
                icon={<MapPin size={18} />}
                label="Address"
                value={profile?.address || "Not provided"}
              />
              <ProfileRow
                icon={<UserCircle size={18} />}
                label="Role"
                value="Service Provider"
              />
            </div>

            <form className="auth-form provider-profile-form" onSubmit={saveProfile}>
              <div className="section-heading">
                <div>
                  <span>SEARCH PROFILE</span>
                  <h2>What customers see</h2>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label>Service category</label>
                  <input
                    type="text"
                    value={form.service_category}
                    onChange={(e) =>
                      updateField("service_category", e.target.value)
                    }
                    disabled={saving}
                    placeholder="e.g. AC repair, Plumbing"
                  />
                </div>

                <div className="form-field">
                  <label>Service area</label>
                  <input
                    type="text"
                    value={form.service_area}
                    onChange={(e) =>
                      updateField("service_area", e.target.value)
                    }
                    disabled={saving}
                    placeholder="e.g. Dhanmondi, Dhaka"
                  />
                </div>

                <div className="form-field">
                  <label>Expertise</label>
                  <input
                    type="text"
                    value={form.expertise}
                    onChange={(e) =>
                      updateField("expertise", e.target.value)
                    }
                    disabled={saving}
                    placeholder="e.g. Split & window AC units, inverter systems"
                  />
                </div>

                <div className="form-field">
                  <label>Hourly rate (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.hourly_rate}
                    onChange={(e) =>
                      updateField("hourly_rate", e.target.value)
                    }
                    disabled={saving}
                    placeholder="0"
                  />
                </div>

                <div className="form-field">
                  <label>Availability</label>
                  <div className="provider-availability-toggle">
                    <input
                      id="provider-available"
                      type="checkbox"
                      checked={Boolean(form.is_available)}
                      onChange={(e) =>
                        updateField("is_available", e.target.checked)
                      }
                      disabled={saving}
                    />
                    <label htmlFor="provider-available">
                      Currently accepting new appointments
                    </label>
                  </div>
                </div>

                <div className="form-field form-field-full">
                  <label>Availability schedule</label>
                  <textarea
                    rows="2"
                    value={form.availability_schedule}
                    onChange={(e) =>
                      updateField(
                        "availability_schedule",
                        e.target.value
                      )
                    }
                    disabled={saving}
                    placeholder="e.g. Mon-Fri 9AM-6PM, Sat 10AM-2PM"
                  />
                </div>

                <div className="form-field form-field-full">
                  <label>Bio</label>
                  <textarea
                    rows="3"
                    value={form.bio}
                    onChange={(e) => updateField("bio", e.target.value)}
                    disabled={saving}
                    placeholder="Tell customers about your experience and services"
                  />
                </div>
              </div>

              {error && <div className="form-error">{error}</div>}
              {success && (
                <div className="verified-badge">
                  <CheckCircle2 size={14} />
                  {success}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="submit"
                  className="dashboard-primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </div>
            </form>
          </div>

          <div className="profile-card profile-services-card">
            <div className="section-heading">
              <div>
                <span>OFFERED SERVICES</span>
                <h2>My services</h2>
              </div>

              <button
                type="button"
                className="dashboard-primary-button"
                onClick={openAddService}
              >
                <Plus size={17} />
                Add service
              </button>
            </div>

            {servicesError && (
              <div className="form-error">
                {servicesError}
              </div>
            )}

            {services.length === 0 ? (
              <div className="empty-card">
                <Wrench size={28} />

                <h3>No services listed yet</h3>

                <p>
                  Add the specific services you offer so
                  customers know exactly what you can help
                  with, along with pricing and duration.
                </p>

                <button
                  className="dashboard-primary-button"
                  onClick={openAddService}
                >
                  <Plus size={16} />
                  Add service
                </button>
              </div>
            ) : (
              <div className="schedule-list">
                {services.map((service) => (
                  <article
                    key={service.id}
                    className="schedule-card"
                  >
                    <div className="schedule-icon">
                      <Wrench size={20} />
                    </div>

                    <div className="schedule-content">
                      <span>
                        {service.category ||
                          "Service"}
                      </span>

                      <h2>{service.service_name}</h2>

                      <p>
                        {service.description ||
                          "No description provided."}
                      </p>
                    </div>

                    <div className="schedule-meta">
                      <strong>
                        {service.estimated_price != null
                          ? `৳${service.estimated_price}`
                          : "Price on request"}
                      </strong>

                      <span>
                        {service.estimated_duration_hours
                          ? `${service.estimated_duration_hours} hr est.`
                          : "Duration varies"}
                      </span>
                    </div>

                    <div className="schedule-actions">
                      <button
                        type="button"
                        onClick={() =>
                          openEditService(service)
                        }
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        className="delete-action"
                        onClick={() =>
                          deleteService(service)
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {showServiceForm && (
        <ServiceForm
          service={editingService}
          onSubmit={saveService}
          onClose={closeServiceForm}
          loading={savingService}
        />
      )}
    </div>
  );
}

function ProfileRow({ icon, label, value }) {
  return (
    <div className="profile-row">
      <div className="profile-row-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}