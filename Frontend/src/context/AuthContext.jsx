import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(
      payload.replace(/-/g, "+").replace(/_/g, "/")
    );

    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

async function resolveRole() {
  const checks = [
    {
      role: "admin",
      request: () => api.get("/admin/users"),
    },
    {
      role: "customer",
      request: () => api.get("/appliances"),
    },
    {
      role: "service_provider",
      request: () => api.get("/maintenance-requests"),
    },
  ];

  for (const check of checks) {
    try {
      await check.request();
      return check.role;
    } catch (error) {
      if (error.response?.status !== 403) {
        if (error.response?.status === 401) {
          continue;
        }
      }
    }
  }

  return null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem("keepr_token")
  );

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("keepr_user");

    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const payload = decodeToken(token);

        const restoredUser = {
          id: payload.user_id || null,
          email: payload.email || null,
          role: localStorage.getItem("keepr_role"),
        };

        if (!restoredUser.role) {
          restoredUser.role = await resolveRole();
        }

        setUser(restoredUser);
        localStorage.setItem(
          "keepr_user",
          JSON.stringify(restoredUser)
        );
      } catch {
        logoutLocal();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post("/auth", {
      username: email,
      password,
    });

    const newToken = response.data?.data;

    if (!newToken) {
      throw new Error("Login succeeded but no token was returned.");
    }

    localStorage.setItem("keepr_token", newToken);
    setToken(newToken);

    const payload = decodeToken(newToken);

    const resolvedRole = await resolveRole();

    const loggedInUser = {
      id: payload.user_id || null,
      email,
      role: resolvedRole,
    };

    localStorage.setItem(
      "keepr_user",
      JSON.stringify(loggedInUser)
    );

    localStorage.setItem("keepr_role", resolvedRole || "");

    setUser(loggedInUser);

    return loggedInUser;
  };

  const register = async (userData) => {
    const response = await api.post("/register", userData);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } finally {
      logoutLocal();
    }
  };

  const logoutLocal = () => {
    localStorage.removeItem("keepr_token");
    localStorage.removeItem("keepr_user");
    localStorage.removeItem("keepr_role");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}