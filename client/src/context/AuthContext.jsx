import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Common API Fetch Function
  const apiFetch = async (url, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        throw new Error(`Server Error (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Server Error (${response.status})`);
      }

      return data;
    } catch (err) {
      console.error("API Error:", err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch("/api/auth/profile");

        if (data.success) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error("Profile fetch failed:", err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const login = async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.success) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
    }

    return data;
  };

  const register = async (
    name,
    email,
    mobile,
    password,
    city,
    role
  ) => {
    return apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        mobile,
        password,
        city,
        role,
      }),
    });
  };

  const verifyOtp = async (userId, otp) => {
    const data = await apiFetch("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ userId, otp }),
    });

    if (data.success) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
    }

    return data;
  };

  const forgotPassword = async (email) => {
    return apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  };

  const resetPassword = async (userId, otp, newPassword) => {
    return apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        userId,
        otp,
        newPassword,
      }),
    });
  };

  const requestMobileOtp = async (
    mobile,
    isSignup,
    name,
    city,
    role
  ) => {
    return apiFetch("/api/auth/mobile-otp-request", {
      method: "POST",
      body: JSON.stringify({
        mobile,
        isSignup,
        name,
        city,
        role,
      }),
    });
  };

  const verifyMobileOtp = async (userId, otp) => {
    const data = await apiFetch("/api/auth/mobile-otp-verify", {
      method: "POST",
      body: JSON.stringify({ userId, otp }),
    });

    if (data.success) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
    }

    return data;
  };

  const updateProfile = async (profileData) => {
    const data = await apiFetch("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });

    if (data.success) {
      setUser(data.user);
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        verifyOtp,
        forgotPassword,
        resetPassword,
        requestMobileOtp,
        verifyMobileOtp,
        updateProfile,
        logout,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};