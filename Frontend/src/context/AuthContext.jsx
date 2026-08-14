import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext =
  createContext(null);

function decodeToken(token) {
  try {
    const payload =
      token.split(".")[1];

    const decoded = atob(
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/")
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
      request: () =>
        api.get("/admin/users"),
    },

    {
      role: "service_provider",
      request: () =>
        api.get(
          "/maintenance-requests"
        ),
    },

    {
      role: "customer",
      request: () =>
        api.get("/appliances"),
    },
  ];

  for (const check of checks) {
    try {
      await check.request();

      return check.role;
    } catch (error) {
      const status =
        error.response?.status;

      if (
        status === 401 ||
        status === 403
      ) {
        continue;
      }
    }
  }

  return null;
}

function clearStoredAuth() {
  localStorage.removeItem(
    "keepr_token"
  );

  localStorage.removeItem(
    "keepr_user"
  );

  localStorage.removeItem(
    "keepr_role"
  );
}

export function AuthProvider({
  children,
}) {
  const [token, setToken] =
    useState(() =>
      localStorage.getItem(
        "keepr_token"
      )
    );

  const [user, setUser] =
    useState(() => {
      const saved =
        localStorage.getItem(
          "keepr_user"
        );

      try {
        return saved
          ? JSON.parse(saved)
          : null;
      } catch {
        return null;
      }
    });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const restoreSession =
      async () => {
        if (!token) {
          setLoading(false);
          return;
        }

        try {
          const payload =
            decodeToken(token);

          const storedRole =
            localStorage.getItem(
              "keepr_role"
            );

          let role =
            storedRole || null;

          if (!role) {
            role =
              await resolveRole();
          }

          if (!role) {
            throw new Error(
              "Unable to determine user role."
            );
          }

          const restoredUser = {
            id:
              payload.user_id || null,
            email:
              payload.email || null,
            role,
          };

          setUser(restoredUser);

          localStorage.setItem(
            "keepr_user",
            JSON.stringify(
              restoredUser
            )
          );

          localStorage.setItem(
            "keepr_role",
            role
          );
        } catch {
          clearStoredAuth();

          setToken(null);
          setUser(null);
        } finally {
          setLoading(false);
        }
      };

    restoreSession();
  }, [token]);

  const login = async (
    email,
    password
  ) => {
    const response =
      await api.post("/auth", {
        username: email,
        password,
      });

    const newToken =
      response.data?.data;

    if (!newToken) {
      throw new Error(
        "Login succeeded but no token was returned."
      );
    }

    localStorage.setItem(
      "keepr_token",
      newToken
    );

    setToken(newToken);

    const payload =
      decodeToken(newToken);

    const resolvedRole =
      await resolveRole();

    if (!resolvedRole) {
      clearStoredAuth();

      setToken(null);

      throw new Error(
        "Unable to determine your account role."
      );
    }

    const loggedInUser = {
      id:
        payload.user_id || null,
      email,
      role: resolvedRole,
    };

    localStorage.setItem(
      "keepr_user",
      JSON.stringify(
        loggedInUser
      )
    );

    localStorage.setItem(
      "keepr_role",
      resolvedRole
    );

    setUser(loggedInUser);

    return loggedInUser;
  };

  const register = async (
    userData
  ) => {
    const response =
      await api.post(
        "/register",
        userData
      );

    return response.data;
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
      // Local logout still happens.
    } finally {
      clearStoredAuth();

      setToken(null);
      setUser(null);
    }
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
        isAuthenticated:
          Boolean(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}