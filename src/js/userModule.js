import { API_AUTH } from "./config";
import { user_Profile } from "./controller";
import APIClient from "./utils/apiClient";

const STORAGE_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  device: "device_id",
  user: "user_info",
};

const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000; // 2 min buffer before expiry
export const userInfo = { userDetails: {} };

const now = () => Date.now();

/**
 * Generates or returns existing Device ID
 */
export const getDeviceId = () => {
  let deviceId = localStorage.getItem(STORAGE_KEYS.device);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.device, deviceId);
  }
  return deviceId;
};

/**
 * Clears all session data (tokens, user info)
 */
export const clearSession = (reason = "") => {
  console.warn(`⚠️ Session cleared: ${reason}`);
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  userInfo.userDetails = {};
  window.dispatchEvent(new Event("sessionCleared"));
};

/**
 * Logs user out and redirects to signup
 */
export const logoutFn = () => {
  clearSession("User logged out");
  window.location.href = "/signup";
};

/**
 * Returns default authenticated headers
 */

const getAuthHeaders = (token, deviceId) => ({
  Authorization: `Bearer ${token}`,
  "Device-ID": deviceId,
});

/**
 * Checks if the user session and tokens are valid
 */
export const checkUserIsActive = async () => {
  try {
    const refreshRaw = localStorage.getItem(STORAGE_KEYS.refresh);
    const accessRaw = localStorage.getItem(STORAGE_KEYS.access);
    const userRaw = localStorage.getItem(STORAGE_KEYS.user);
    const deviceId = getDeviceId();

    if (!refreshRaw || !deviceId) {
      clearSession("Missing tokens");
      return false;
    }

      console.log("🔍 Validating user session... complete refreshRaw and deviceId id Valide");

    const refreshData = JSON.parse(refreshRaw);
    const accessData = accessRaw ? JSON.parse(accessRaw) : null;
    const userData = userRaw ? JSON.parse(userRaw) : null;
    userInfo.userDetails = userData;

    const timeNow = now();

    // ❌ Refresh token expired
    if (!refreshData.refreshToken || refreshData.expireAt <= timeNow) {
      clearSession("Session expired");
      return false;
    }

      console.log("🔍 Validating user session...  ❌Refresh token expired");

    // 🕓 Refresh access token if expiring soon
    if (!accessData?.accessToken || accessData.expireAt - TOKEN_REFRESH_BUFFER_MS <= timeNow) {
      console.info("🔄 Refreshing access token...");
      const res = await APIClient.post(`${API_AUTH}refresh-token`, null, {
        headers: getAuthHeaders(refreshData.refreshToken, deviceId),
      });

      if (!res?.accessToken) throw new Error("Access token refresh failed");

      const newAccessData = {
        accessToken: res.accessToken,
        expireAt: now() + res.expiresIn * 1000,
      };

      localStorage.setItem(STORAGE_KEYS.access, JSON.stringify(newAccessData));
      window.dispatchEvent(new Event("tokenRefreshed"));
      console.info("✅ Access token refreshed successfully");
    }
      console.log("🔍 Validating user session...  ❌Refresh token expired");

    return true;
  } catch (err) {
    console.error("❌ checkUserIsActive error:", err);
    clearSession("Session invalid");
    return false;
  }
};

/**
 * Updates cart item for logged-in user
 */
export const updateCartItem = async (payload, retry = false) => {
  try {
    const active = await checkUserIsActive();
    if (!active) throw new Error("Session invalid");

    console.log("🛒 Updating cart item...", payload);

    const access = JSON.parse(localStorage.getItem(STORAGE_KEYS.access) || "{}");
    const deviceId = getDeviceId();

    const res = await APIClient.post(payload.url, payload.body || {}, {
      headers: getAuthHeaders(access.accessToken, deviceId),
    });

    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || "{}");
    currentUser.userProductInfo = {
      ...currentUser.userProductInfo,
      cart: res?.data?.cart || [],
    };

    userInfo.userDetails = currentUser;
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(currentUser));

    return res;
  } catch (err) {
    console.error("❌ updateCartItem failed:", err);

    // Retry once if unauthorized
    if (!retry && (err.status === 401 || err.message?.includes("401"))) {
      const refreshed = await checkUserIsActive();
      if (refreshed) return updateCartItem(payload, true);
    }

    clearSession("Cart update failed");
    throw err;
  }
};

/**
 * Generic user data fetch API
 */
export const getUserAPI = async (url, options = {}) => {
  try {
    const deviceId = getDeviceId();
    const res = await APIClient.post(url, options.body || {} )
    userInfo.userDetails = res || {};
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(res));
    return res;
  } catch (err) {
    console.error("❌ getUserAPI error:", err);
    throw err;
  }
};

/**
 * Session Watcher — ensures user stays logged in
 */
export const initSessionWatcher = () => {
  const runCheck = async () => {
    const status = await checkUserIsActive();
    console.log("🧭 Session status:", status);
    if (status) user_Profile();
  };

  // Watch for page load and navigation
  ["load", "popstate", "pushstate"].forEach((evt) => window.addEventListener(evt, runCheck));

  // Patch pushState to detect client-side routing
  const originalPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    originalPushState.apply(this, args);
    window.dispatchEvent(new Event("pushstate"));
  };

  console.log("✅ Session watcher initialized");
};

initSessionWatcher();
