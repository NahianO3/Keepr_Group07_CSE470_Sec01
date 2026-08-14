import {
  LayoutDashboard,
  Refrigerator,
  Wrench,
  Bell,
  LogOut,
  Settings,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import KeeprLogo from "./KeeprLogo";

export default function Sidebar() {
  const navigate = useNavigate();

  const {
    logout,
    user,
  } = useAuth();

  const links = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/appliances",
      label: "My Appliances",
      icon: Refrigerator,
    },
    {
      to: "/maintenance",
      label: "Maintenance",
      icon: Wrench,
    },
    {
      to: "/reminders",
      label: "Reminders",
      icon: Bell,
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">

      {/* BRAND */}

      <div className="sidebar-brand">
        <KeeprLogo width={135} />
      </div>

      {/* NAVIGATION */}

      <nav className="sidebar-nav">

        <div className="sidebar-section-label">
          MENU
        </div>

        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive
                    ? "sidebar-link-active"
                    : ""
                }`
              }
            >
              <Icon size={19} />

              <span>
                {link.label}
              </span>
            </NavLink>
          );
        })}

      </nav>

      {/* ACCOUNT */}

      <div className="sidebar-bottom">

        <div className="sidebar-section-label">
          ACCOUNT
        </div>

        <button
          type="button"
          className="sidebar-link sidebar-button"
        >
          <Settings size={19} />

          <span>
            Settings
          </span>
        </button>

        <button
          type="button"
          className="sidebar-link sidebar-button logout-button"
          onClick={handleLogout}
        >
          <LogOut size={19} />

          <span>
            Logout
          </span>
        </button>

        {/* USER */}

        <div className="sidebar-user">

          <div className="sidebar-avatar">
            {user?.email
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </div>

          <div>

            <strong>
              {user?.email || "Customer"}
            </strong>

            <span>
              Customer
            </span>

          </div>

        </div>

      </div>

    </aside>
  );
}