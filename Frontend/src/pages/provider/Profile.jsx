import {
  UserCircle,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  BadgeCheck,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";

export default function ProviderProfile() {
  const { user } = useAuth();

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              SERVICE PROVIDER
            </span>

            <h1>
              My profile
            </h1>

            <p>
              Your account information and
              provider status.
            </p>
          </div>
        </header>

        <section className="profile-grid">
          <div className="profile-card profile-summary-card">
            <div className="profile-avatar-large">
              {user?.email
                ?.charAt(0)
                ?.toUpperCase() || "P"}
            </div>

            <h2>
              {user?.email ||
                "Service Provider"}
            </h2>

            <span className="verified-badge">
              <BadgeCheck size={14} />
              Service Provider
            </span>

            <div className="provider-profile-status">
              <ShieldCheck size={17} />

              <div>
                <strong>
                  Account active
                </strong>

                <span>
                  Your account can manage assigned
                  maintenance requests.
                </span>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <div className="section-heading">
              <div>
                <span>
                  ACCOUNT INFORMATION
                </span>

                <h2>
                  Contact details
                </h2>
              </div>
            </div>

            <div className="profile-information">
              <ProfileRow
                icon={<Mail size={18} />}
                label="Email"
                value={
                  user?.email || "—"
                }
              />

              <ProfileRow
                icon={<Phone size={18} />}
                label="Phone"
                value="Available in account profile"
              />

              <ProfileRow
                icon={<MapPin size={18} />}
                label="Address"
                value="Available in account profile"
              />

              <ProfileRow
                icon={<UserCircle size={18} />}
                label="Role"
                value="Service Provider"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}) {
  return (
    <div className="profile-row">
      <div className="profile-row-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}