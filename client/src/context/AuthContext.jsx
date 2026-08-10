import React, { createContext, useContext, useEffect, useState } from "react";
import { getApiBaseUrl } from "../utils/url";

const AuthContext = createContext();

const API_BASE_URL = getApiBaseUrl();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Common API Fetch Function with automatic retry for server cold-starts/502s/404s
  const apiFetch = async (url, options = {}, retries = 2) => {
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...options.headers,
    };

    if (!isFormData && !headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    } else if (isFormData) {
      delete headers["Content-Type"];
      delete headers["content-type"];
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const apiBase = getApiBaseUrl();
    const fullTargetUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `${apiBase}${url}`;

    let lastErr = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait 500ms * attempt before retrying (e.g. 500ms, 1000ms)
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }

        const response = await fetch(fullTargetUrl, {
          ...options,
          headers,
        });

        let data = {};

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = { success: false, message: text || `Server Error (${response.status})` };
          }
        }

        if (!response.ok) {
          let msg = data?.message;
          if (
            !msg ||
            typeof msg !== 'string' ||
            msg.includes('<html') ||
            msg.includes('Application failed to respond') ||
            msg.includes('Application not found') ||
            msg.includes('Cannot GET') ||
            msg.includes('Cannot POST')
          ) {
            if (response.status === 502 || response.status === 503 || response.status === 504) {
              msg = "Backend server is temporarily unavailable or restarting. Please try again in a few moments.";
            } else if (response.status === 404) {
              msg = "Server endpoint not found. Please ensure the backend server is running.";
            } else {
              msg = `Server Error (${response.status})`;
            }
          }

          // If server returns 502, 503, 504, or transient 404 while backend initializes and we have retries left, retry seamlessly
          if ((response.status === 502 || response.status === 503 || response.status === 504 || response.status === 404) && attempt < retries) {
            console.warn(`API returned status ${response.status}. Retrying attempt ${attempt + 1}/${retries}...`);
            continue;
          }

          throw new Error(msg);
        }

        return data;
      } catch (err) {
        lastErr = err;
        if (
          attempt < retries &&
          (err.name === "TypeError" ||
            err.message?.includes("fetch") ||
            err.message?.includes("temporarily unavailable") ||
            err.message?.includes("502") ||
            err.message?.includes("404"))
        ) {
          console.warn(`Network/API error: ${err.message}. Retrying attempt ${attempt + 1}/${retries}...`);
          continue;
        }
        break;
      }
    }

    console.error("API Error:", lastErr);
    throw lastErr;
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

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await apiFetch("/api/auth/profile");
      if (data.success) {
        setUser(data.user);
      }
    } catch (err) {
      console.error("Profile refresh failed:", err.message);
    }
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
        refreshUser,
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