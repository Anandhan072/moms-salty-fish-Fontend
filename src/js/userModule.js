// =====================================================
// 🔐 USER SESSION & TOKEN MANAGEMENT — Enterprise Grade
// =====================================================

import { API_AUTH } from "./config";
import { apiRequest } from "./helper";
import { user_Profile } from "./controller";

// =====================================================
// 🧱 Storage Key Constants
// =====================================================
const STORAGE_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  device: "deviceId",
  user: "user_info",
};

// =====================================================
// 🧩 Global User State
// =====================================================
export const userInfo = {
  userDetails: {},
};

// =====================================================
// 🧰 Utility Helpers
// =====================================================
const now = () => Date.now();
const FIVE_MIN = 5 * 60 * 1000;

// 🧹 Clear only related keys
export const clearSession = (reason = "") => {
  console.warn(`⚠️ Clearing session: ${reason}`);
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new Event("sessionCleared"));
};

// Dynamic header builder
export const getAuthHeaders = (token, deviceId) => ({
  "Content-Type": "application/json",
  authorization: `Bearer ${token}`,
  "device-id": deviceId,
});

export const logoutFn = () => {
  clearSession("user Log out");
  window.location.reload();
};
// =====================================================
// 📱 Device ID Management
// =====================================================
export const getDeviceId = () => {
  let deviceId = localStorage.getItem(STORAGE_KEYS.device);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.device, deviceId);
  }
  return deviceId;
};

// =====================================================
// 🔄 API Helpers
// =====================================================
export const getUserAPI = async (url, options) => {
  try {
    const response = await apiRequest(url, options);
    userInfo.userDetails = response || {};
    return response;
  } catch (err) {
    console.error("❌ Error fetching user API:", err);
    throw err;
  }
};

export const getRenewAccessToken = async (url, options) => {
  try {
    return await apiRequest(url, options);
  } catch (err) {
    console.error("❌ Error renewing access token:", err);
    throw err;
  }
};

// =====================================================
// 🧭 Core: Check & Manage User Session
// =====================================================
export const checkUserIsActive = async () => {
  try {
    const refreshRaw = localStorage.getItem(STORAGE_KEYS.refresh);
    const accessRaw = localStorage.getItem(STORAGE_KEYS.access);
    const userRaw = localStorage.getItem(STORAGE_KEYS.user);
    const deviceId = getDeviceId();

    if (!refreshRaw || !deviceId) {
      clearSession("Missing refresh token or device ID");
      return false;
    }

    const refreshData = JSON.parse(refreshRaw);
    const accessData = accessRaw ? JSON.parse(accessRaw) : null;
    const userData = userRaw ? JSON.parse(userRaw) : null;
    userInfo.userDetails = userData;

    const timeNow = now();

    // 🧨 Check refresh token
    if (!refreshData.refreshToken || refreshData.expireAt <= timeNow) {
      clearSession("Refresh token expired");
      return false;
    }

    // 🕐 Refresh access token if about to expire
    if (!accessData?.accessToken || accessData.expireAt - FIVE_MIN <= timeNow) {
      const options = {
        method: "POST",
        headers: getAuthHeaders(refreshData.refreshToken, deviceId),
      };

      const refreshed = await getRenewAccessToken(`${API_AUTH}refresh-token`, options);
      if (!refreshed?.accessToken) throw new Error("No access token received");

      const newAccessData = {
        accessToken: refreshed.accessToken,
        expireAt: now() + refreshed.expiresIn * 1000,
      };

      localStorage.setItem(STORAGE_KEYS.access, JSON.stringify(newAccessData));
      console.info("✅ Access token refreshed successfully");
      window.dispatchEvent(new Event("tokenRefreshed"));

      return "REFRESHED";
    }

    return true;
  } catch (err) {
    console.error("❌ Error in checkUserIsActive:", err);
    clearSession("Session check failed");
    return false;
  }
};

// =====================================================
// 🌐 Auto-run on page load & URL changes (with debounce)
// =====================================================
export const initSessionWatcher = () => {
  let debounceTimer;

  const runCheck = async () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      try {
        const status = await checkUserIsActive();
        console.log("Session status:", status);
        if (status) user_Profile();
      } catch (err) {
        console.error("Session watcher error:", err);
      }
    }, 500);
  };

  // Run once on load
  window.addEventListener("load", runCheck);

  // Browser navigation
  window.addEventListener("popstate", runCheck);

  // SPA navigation
  const originalPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    originalPushState.apply(this, args);
    window.dispatchEvent(new Event("pushstate"));
  };
  window.addEventListener("pushstate", runCheck);

  console.log("🧭 Session watcher initialized.");
};

initSessionWatcher();
