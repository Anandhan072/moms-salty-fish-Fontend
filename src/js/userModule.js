import { API_AUTH } from "./config";
import { apiRequest } from "./helper";
import { user_Profile } from "./controller";

const STORAGE_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  device: "device_id",
  user: "user_info",
};

const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000; // 2 min
export const userInfo = { userDetails: {} };

const now = () => Date.now();

export const getDeviceId = () => {
  let deviceId = localStorage.getItem(STORAGE_KEYS.device);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.device, deviceId);
  }
  return deviceId;
};

export const clearSession = (reason = "") => {
  console.warn(`⚠️ Session cleared: ${reason}`);
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  userInfo.userDetails = {};
  window.dispatchEvent(new Event("sessionCleared"));
};

export const logoutFn = () => {
  clearSession("User logged out");
  window.location.href = "/signup";
};

const getAuthHeaders = (token, deviceId) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
  "Device-ID": deviceId,
});

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

    // 🕓 Refresh access token if expiring soon
    if (!accessData?.accessToken || accessData.expireAt - TOKEN_REFRESH_BUFFER_MS <= timeNow) {
      const res = await apiRequest(`${API_AUTH}refresh-token`, {
        method: "POST",
        headers: getAuthHeaders(refreshData.refreshToken, deviceId),
      });
      if (!res?.accessToken) throw new Error("Access token refresh failed");

      const newAccessData = {
        accessToken: res.accessToken,
        expireAt: now() + res.expiresIn * 1000,
      };

      localStorage.setItem(STORAGE_KEYS.access, JSON.stringify(newAccessData));
      window.dispatchEvent(new Event("tokenRefreshed"));
      console.info("✅ Access token refreshed");
    }

    return true;
  } catch (err) {
    console.error("❌ checkUserIsActive error:", err);
    clearSession("Session invalid");
    return false;
  }
};

// 🛒 Cart Handler
export const updateCartItem = async (payload, retry = false) => {
  try {
    const active = await checkUserIsActive();
    if (!active) throw new Error("Session invalid");

    const access = JSON.parse(localStorage.getItem(STORAGE_KEYS.access) || "{}");
    const deviceId = getDeviceId();

    const res = await apiRequest(payload.url, {
      method: "POST",
      headers: getAuthHeaders(access.accessToken, deviceId),
      body: payload.body || {},
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

    if (!retry && (err.status === 401 || err.message?.includes("401"))) {
      const refreshed = await checkUserIsActive();
      if (refreshed === "REFRESHED") return updateCartItem(payload, true);
    }

    clearSession("Cart update failed");
    throw err;
  }
};

export const getUserAPI = async (url, options) => {
  try {
    const response = await apiRequest(url, options);
    userInfo.userDetails = response || {};
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(response));
    return response;
  } catch (err) {
    console.error("❌ getUserAPI error:", err);
    throw err;
  }
};

// 🧭 Session Watcher
export const initSessionWatcher = () => {
  const runCheck = async () => {
    const status = await checkUserIsActive();
    console.log("🧭 Session status:", status);
    if (status) user_Profile();
  };

  ["load", "popstate", "pushstate"].forEach((evt) => window.addEventListener(evt, runCheck));

  const originalPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    originalPushState.apply(this, args);
    window.dispatchEvent(new Event("pushstate"));
  };

  console.log("✅ Session watcher initialized");
};

initSessionWatcher();
