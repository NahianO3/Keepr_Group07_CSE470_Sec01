import {
  LayoutDashboard,
  Refrigerator,
  Car,
  FileText,
  Wrench,
  Bell,
  LogOut,
  Settings,
  CalendarClock,
  ClipboardList,
  UserCircle,
  Users,
  UserCheck,
  ShieldCheck,
  ClipboardCheck,
  WalletCards,
} from "lucide-react";

import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import KeeprLogo from "./KeeprLogo";

const menus = {
  customer: [
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
      to: "/vehicles",
      label: "My Vehicles",
      icon: Car,
    },
    {
      to: "/vehicle-documents",
      label: "Vehicle Documents",
      icon: FileText,
    },
    {
      to: "/maintenance-schedules",
      label: "Schedules",
      icon: CalendarClock,
    },
    {
      to: "/maintenance-history",
      label: "History",
      icon: Wrench,
    },
    {
      to: "/expenses",
      label: "Expenses",
      icon: WalletCards,
    },
    {
      to: "/reminders",
      label: "Reminders",
      icon: Bell,
    },
  ],

  service_provider: [
    {
      to: "/provider",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/provider/requests",
      label: "Requests",
      icon: ClipboardList,
    },
    {
      to: "/provider/profile",
      label: "My Profile",
      icon: UserCircle,
    },
  ],

  admin: [
    {
      to: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/admin/users",
      label: "Users",
      icon: Users,
    },
    {
      to: "/admin/providers",
      label: "Providers",
      icon: UserCheck,
    },
    {
      to: "/admin/provider-approval",
      label: "Provider Approval",
      icon: ShieldCheck,
    },
    {
      to: "/admin/maintenance-records",
      label: "Maintenance",
      icon: ClipboardCheck,
    },
  ],
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    logout,
    user,
  } = useAuth();

  const role =
    user?.role || "customer";

  const links =
    menus[role] || menus.customer;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (link) => {
    if (link.to === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    if (link.to === "/provider") {
      return location.pathname === "/provider";
    }

    if (link.to === "/admin") {
      return location.pathname === "/admin";
    }

    return (
      location.pathname === link.to ||
      location.pathname.startsWith(
        `${link.to}/`
      )
    );
  };

  const roleLabel = {
    customer: "Customer",
    service_provider: "Service Provider",
    admin: "Administrator",
  }[role];

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
              className={
                isActive(link)
                  ? "sidebar-link sidebar-link-active"
                  : "sidebar-link"
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
              {user?.email ||
                "User"}
            </strong>

            <span>
              {roleLabel}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}