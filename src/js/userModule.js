import { API_AUTH } from "./config";
import { user_Profile } from "./controller";
import APIClient from "./utils/apiClient";

/* ------------------------------------------------------------
   CONSTANTS
------------------------------------------------------------ */



export const userInfo = { userDetails: {} };
const STORAGE_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  device: "device_id",
  user: "user_info",
};

// Refresh access token 2 minutes before expiry
const TOKEN_REFRESH_BUFFER_MS = 2* 60 * 1000;

// Session throttle check every 30 seconds
const CHECK_INTERVAL_MS = 15 * 1000;

/* ------------------------------------------------------------
   PERSISTENT INTERNAL STATE (survives page reload)
------------------------------------------------------------ */
const STATE_KEYS = {
  lastCheckTime: "auth_last_check",
  lastCheckResult: "auth_last_result",
  refreshingAccess: "auth_refreshing",
};

// Get state safely
const getState = (key, fallback) => {
  try {
    const v = sessionStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

// Set state
const setState = (key, val) => {
  sessionStorage.setItem(key, JSON.stringify(val));
};

/* Runtime state loaded from sessionStorage */
let lastCheckTime = getState(STATE_KEYS.lastCheckTime, 0);
let lastCheckResult = getState(STATE_KEYS.lastCheckResult, false);
let refreshingAccess = getState(STATE_KEYS.refreshingAccess, false);

/* ------------------------------------------------------------
   HELPERS
------------------------------------------------------------ */
const now = () => Date.now();

const safeParse = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const store = (key, value) =>
  localStorage.setItem(key, JSON.stringify(value));

const remove = (key) => localStorage.removeItem(key);


/* ------------------------------------------------------------
   DEVICE ID
------------------------------------------------------------ */

export const getDeviceId = () => {
  let id = localStorage.getItem(STORAGE_KEYS.device);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.device, id);
  }

  return id;
};

/* ------------------------------------------------------------
   CLEAR SESSION
------------------------------------------------------------ */

export const clearSession = (reason = "") => {
  console.warn("⚠ Session cleared:", reason);

  Object.values(STORAGE_KEYS).forEach(remove);
  userInfo.userDetails = {};

  // Also reset internal session state
  setState(STATE_KEYS.lastCheckResult, false);
  setState(STATE_KEYS.refreshingAccess, false);

  window.dispatchEvent(new Event("sessionCleared"));
};

/* ------------------------------------------------------------
   LOGOUT
------------------------------------------------------------ */
export const logoutFn = async () => {
  try {
    const active = await checkUserIsActive();

    if (active) {
      const access = safeParse(STORAGE_KEYS.access)?.accessToken;
      const deviceId = getDeviceId();

      await APIClient.post(`${API_AUTH}logout`, null, {
        headers: {
          Authorization: `Bearer ${access}`,
          "Device-ID": deviceId,
        },
      });
    }
  } catch {}

  clearSession("manual logout");
  window.location.href = "/home";
};

/* ------------------------------------------------------------
   ACCESS TOKEN REFRESH (SAFE)
------------------------------------------------------------ */

const refreshAccessToken = async () => {

  if (refreshingAccess) return false;

  refreshingAccess = true;
  setState(STATE_KEYS.refreshingAccess, true);

  try {
    const refreshData = safeParse(STORAGE_KEYS.refresh);

    if (!refreshData?.refreshToken) {
      throw new Error("Missing refresh token");
    }

    const deviceId = getDeviceId();

    const res = await APIClient.post(
      `${API_AUTH}refresh-token`,
      null,
      {
        headers: {
          Authorization: `Bearer ${refreshData.refreshToken}`,
          "Device-ID": deviceId,
        },
      }
    );

    if (!res?.accessToken) {
      throw new Error("Invalid refresh response");
    }

    store(STORAGE_KEYS.access, {
      accessToken: res.accessToken,
      expiresAt: now() + 15 * 60 * 1000,
    });



    return true;
  } catch (err) {
    console.error("❌ Access token refresh failed:", err);
    clearSession("access refresh failed");
    return false;
  } finally {
    refreshingAccess = false;
    setState(STATE_KEYS.refreshingAccess, false);
  }
};

/* ------------------------------------------------------------
   MAIN SESSION VALIDATION
------------------------------------------------------------ */

export const checkUserIsActive = async () => {
  const timeNow = now();

  // ⏱ Throttle check - only run every 30 seconds
  if (timeNow - lastCheckTime < CHECK_INTERVAL_MS) {
    const userRaw = safeParse(STORAGE_KEYS.user);
     userInfo.userDetails = userRaw || {};
    return lastCheckResult;
  }

  lastCheckTime = timeNow;
  setState(STATE_KEYS.lastCheckTime, timeNow);

  try {
    const refreshRaw = safeParse(STORAGE_KEYS.refresh);
    const accessRaw = safeParse(STORAGE_KEYS.access);
    const userRaw = safeParse(STORAGE_KEYS.user);

    userInfo.userDetails = userRaw || {};

    /* --------------------------------------------------
       CASE 1: Guest user (no tokens) → allow browsing
    -------------------------------------------------- */
    if (!refreshRaw && !userRaw) {
      lastCheckResult = false;
      setState(STATE_KEYS.lastCheckResult, false);
      clearSession("guest user");
      return false;
    }

    /* --------------------------------------------------
       CASE 2: Refresh token structure invalid
    -------------------------------------------------- */

    if (!refreshRaw?.refreshToken || !refreshRaw?.expiresAt) {
      console.warn("⚠ Bad refresh token format – NOT clearing storage");
      lastCheckResult = false;
      setState(STATE_KEYS.lastCheckResult, false);
      clearSession("bad refresh token format");
      return false;
    }

    /* --------------------------------------------------
       CASE 3: Refresh token expired → ONLY valid logout
    -------------------------------------------------- */
    if (refreshRaw.expiresAt <= timeNow) {
      console.warn("❌ Refresh token expired → clearing session");
      clearSession("refresh expired");
      lastCheckResult = false;
      setState(STATE_KEYS.lastCheckResult, false);
      return false;
    }

    /* --------------------------------------------------
       CASE 4: Access token expired → Refresh it
    -------------------------------
    ------------------- */
console.log("Access Token Expiry Check:", { accessExpiry: accessRaw?.expiresAt, currentTime: timeNow, buffer: TOKEN_REFRESH_BUFFER_MS });

console.log(accessRaw?.expiresAt - TOKEN_REFRESH_BUFFER_MS <= timeNow);

console.log("Condition Result:", new Date(accessRaw?.expiresAt), new Date(timeNow), accessRaw?.expiresAt - TOKEN_REFRESH_BUFFER_MS, timeNow);
  
    if ( accessRaw?.expiresAt - TOKEN_REFRESH_BUFFER_MS <= timeNow) {

      console.log("⏳ Access token expired/stale → refreshing");
      const ok = await refreshAccessToken();
      lastCheckResult = ok;
      setState(STATE_KEYS.lastCheckResult, ok);
      return ok;
    }

    /* --------------------------------------------------
       VALID SESSION
    -------------------------------------------------- */
    lastCheckResult = true;
    setState(STATE_KEYS.lastCheckResult, true);
    return true;

  } catch (err) {
    console.error("❌ Session check failed (but NOT clearing tokens):", err);

    // ⚠ DO NOT CLEAR STORAGE – just fail the check
    lastCheckResult = false;
    setState(STATE_KEYS.lastCheckResult, false);
    return false;
  }
};


/* ------------------------------------------------------------
   UPDATE CART
------------------------------------------------------------ */

export const updateCartItem = async (payload) => {
  const active = await checkUserIsActive();
  if (!active) throw new Error("Session invalid");

  console.log("updateCartItem payload:", active, payload);

  const access = safeParse(STORAGE_KEYS.access)?.accessToken;
  const deviceId = getDeviceId();

  const res = await APIClient.post(
    payload.url,
    payload.body || {},
    {
      headers: {
        Authorization: `Bearer ${access}`,
        "Device-ID": deviceId,
      },
    }
  );

  const user = safeParse(STORAGE_KEYS.user) || {};
  user.userProductInfo = {
    ...user.userProductInfo,
    cart: res?.data?.cart || [],
  };

  store(STORAGE_KEYS.user, user);
  userInfo.userDetails = user;

  return res;
};

/* ------------------------------------------------------------
   USER API (PROFILE FETCH)
------------------------------------------------------------ */

export const getUserAPI = async (url, options = {}) => {
  const res = await APIClient.post(url, options.body || {});
  store(STORAGE_KEYS.user, res.user);
  console.log("getUserAPI fetched user:", res);
  userInfo.userDetails = res.user;
  return res;
};

/* ------------------------------------------------------------
   SESSION WATCHER
------------------------------------------------------------ */

export const initSessionWatcher = () => {
  const run = async () => {
    const ok = await checkUserIsActive();

    if (ok) user_Profile();
  };

  ["load", "popstate", "pushstate"].forEach((ev) =>
    window.addEventListener(ev, run)
  );

  // Detect SPA navigation
  const original = history.pushState;
  history.pushState = function (...args) {
    original.apply(this, args);
    window.dispatchEvent(new Event("pushstate"));
  };


};

initSessionWatcher();
