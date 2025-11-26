import { API_AUTH } from "./config";
import { user_Profile } from "./controller";
import APIClient from "./utils/apiClient";

/* ============================================================
   CONSTANTS
============================================================ */

export const userInfo = { userDetails: {} };

const STORAGE = {
  ACCESS: "access_token",
  REFRESH: "refresh_token",
  DEVICE: "device_id",
  USER: "user_info",
};

const STATE = {
  LAST_CHECK: "auth_last_check",
  LAST_RESULT: "auth_last_result",
};

const TTL = {
  ACCESS_REFRESH_BUFFER: 2 * 60 * 1000,
  AUTH_CHECK_INTERVAL: 15 * 1000,
  ACCESS_LIFETIME: 15 * 60 * 1000,
};

/* ============================================================
   STORAGE SERVICE
============================================================ */

const StorageService = {
  get(key) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  clearAuth() {
    Object.values(STORAGE).forEach((k) => this.remove(k));
  },
};

/* ============================================================
   SESSION STATE
============================================================ */

const SessionState = {
  get(key, def) {
    try {
      const v = sessionStorage.getItem(key);
      return v !== null ? JSON.parse(v) : def;
    } catch {
      return def;
    }
  },
  set(key, val) {
    sessionStorage.setItem(key, JSON.stringify(val));
  },
};

let lastCheckAt = SessionState.get(STATE.LAST_CHECK, 0);
let lastCheckOk = SessionState.get(STATE.LAST_RESULT, false);

/* ============================================================
   DEVICE SERVICE
============================================================ */

export const getDeviceId = () => {
  let id = StorageService.get(STORAGE.DEVICE);
  if (!id) {
    id = crypto.randomUUID();
    StorageService.set(STORAGE.DEVICE, id);
  }
  return id;
};

/* ============================================================
   TOKEN SERVICE
============================================================ */

const TokenService = {
  get access() {
    return StorageService.get(STORAGE.ACCESS);
  },
  get refresh() {
    return StorageService.get(STORAGE.REFRESH);
  },
  isAccessStale() {
    const access = this.access;
    if (!access?.expiresAt) return true;
    return access.expiresAt - TTL.ACCESS_REFRESH_BUFFER <= Date.now();
  },
  storeAccess(token) {
    StorageService.set(STORAGE.ACCESS, {
      accessToken: token,
      expiresAt: Date.now() + TTL.ACCESS_LIFETIME,
    });
  },
};

/* ============================================================
   AUTH HEADERS
============================================================ */

const buildHeaders = () => ({
  Authorization: `Bearer ${TokenService.access?.accessToken}`,
  "Device-ID": getDeviceId(),
});

/* ============================================================
   OFFLINE SUPPORT ✅
============================================================ */



const OfflineService = {
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  queue: [],

  enqueue(job) {
    this.queue.push(job);
  },

  async flushQueue() {
    if (!this.isOnline) return;
    while (this.queue.length) {
      const job = this.queue.shift();
      try {
        await job();
      } catch (err) {
        console.error("❌ Offline queued job failed:", err);
      }
    }
  },
};

const initOfflineSupport = () => {
  OfflineService.isOnline =
    typeof navigator !== "undefined" ? navigator.onLine : true;

  window.addEventListener("online", () => {
    OfflineService.isOnline = true;
    console.info("✅ Back online");
    window.dispatchEvent(new Event("appOnline"));
    OfflineService.flushQueue();
  });

  window.addEventListener("offline", () => {
    OfflineService.isOnline = false;
    console.warn("⚠ Offline mode");
    window.dispatchEvent(new Event("appOffline"));
  });
};

/* ============================================================
   TOKEN REFRESH
============================================================ */

let refreshInflight = null;

const refreshAccessToken = async () => {
  if (refreshInflight) return refreshInflight;

  refreshInflight = (async () => {
    const refresh = TokenService.refresh;
    if (!refresh?.refreshToken) throw new Error("No refresh token");

    const res = await APIClient.post(`${API_AUTH}refresh-token`, null, {
      headers: {
        Authorization: `Bearer ${refresh.refreshToken}`,
        "Device-ID": getDeviceId(),
      },
    });

    if (!res?.accessToken) throw new Error("Bad refresh response");

    TokenService.storeAccess(res.accessToken);
    return true;
  })().finally(() => {
    refreshInflight = null;
  });

  return refreshInflight;
};

/* ============================================================
   SESSION CHECK
============================================================ */

export const clearSession = (reason = "") => {
  console.warn("⚠ Session cleared:", reason);
  StorageService.clearAuth();
  userInfo.userDetails = {};
  window.dispatchEvent(new Event("sessionCleared"));
};

export const checkUserIsActive = async () => {
  const now = Date.now();

  if (now - lastCheckAt < TTL.AUTH_CHECK_INTERVAL) {
    const user = StorageService.get(STORAGE.USER);
    userInfo.userDetails = user || {};
    return lastCheckOk;
  }

  lastCheckAt = now;
  SessionState.set(STATE.LAST_CHECK, now);

  try {
    const refresh = TokenService.refresh;
    const user = StorageService.get(STORAGE.USER);

    userInfo.userDetails = user || {};

    if (!refresh || !user) {
      clearSession("guest");
      lastCheckOk = false;
      return false;
    }

    if (refresh.expiresAt <= now) {
      clearSession("refresh expired");
      lastCheckOk = false;
      return false;
    }

    if (TokenService.isAccessStale()) {
      await refreshAccessToken();
      lastCheckOk = true;
      return true;
    }

    lastCheckOk = true;
    return true;
  } catch (err) {
    console.error("❌ Session check failed:", err);
    lastCheckOk = false;
    return false;
  } finally {
    SessionState.set(STATE.LAST_RESULT, lastCheckOk);
  }
};

/* ============================================================
   BACKGROUND REFRESH LOOP ✅
============================================================ */

const startTokenRefreshLoop = () => {
  setInterval(async () => {
    try {
      const refresh = TokenService.refresh;
      if (!refresh) return;

      if (TokenService.isAccessStale()) {
        console.log("⏳ Background token refresh");
        await refreshAccessToken();
      }
    } catch (err) {
      console.error("❌ Background refresh failed:", err);
    }
  }, 60 * 1000);
};

/* ============================================================
   CART SERVICE
============================================================ */

const syncCart = (resOrCart) => {
  const user = StorageService.get(STORAGE.USER) || {};

  console.log(resOrCart)

  const cart =
    Array.isArray(resOrCart) ? resOrCart : resOrCart?.data?.cart || [];

    console.log(cart)

  user.userProductInfo = {
    ...user.userProductInfo,
    cart,
  };

console.log(user)

  StorageService.set(STORAGE.USER, user);
  userInfo.userDetails = user;
};

const requireActiveSession = async () => {
  const ok = await checkUserIsActive();
  if (!ok) throw new Error("Session invalid");
};

export const addCartItem = async (payload) => {
  if (!OfflineService.isOnline) {
    OfflineService.enqueue(() => addCartItem(payload));
    throw new Error("Offline: request queued");
  }

  await requireActiveSession();

  const res = await APIClient.post(payload.url, payload.body || {}, {
    headers: buildHeaders(),
  });

  syncCart(res);
  return res;
};

export const updateUserCarts = async (payload) => {
  if (!OfflineService.isOnline) {
    OfflineService.enqueue(() => updateUserCarts(payload));
    throw new Error("Offline: request queued");
  }

  await requireActiveSession();

  const res = await APIClient.patch(payload.url, payload.body || {}, {
    headers: buildHeaders(),
  });

  syncCart(res);
  return res;
};


export const deletCart = async (payload) => {
  if (!OfflineService.isOnline) {
    OfflineService.enqueue(() => deletCart(payload));
    throw new Error("Offline: request queued");
  }

  await requireActiveSession();

  const res = await APIClient.delete(payload.url ,payload.body || {}, {
    headers: buildHeaders(),
  });

  syncCart(res);
  return res;
};


/* ============================================================
   USER API
============================================================ */

export const getUserAPI = async (url, options = {}) => {
  const res = await APIClient.post(url, options.body || {});
  StorageService.set(STORAGE.USER, res.user);
  userInfo.userDetails = res.user;
  return res;
};

/* ============================================================
   SESSION WATCHER
============================================================ */

export const logoutFn = async () => {
  try {
    const active = await checkUserIsActive();
    if (active) {
      await APIClient.post(`${API_AUTH}logout`, null, {
        headers: buildHeaders(),
      });
    }
  } catch {}

  clearSession("manual logout");
  window.location.href = "/home";
};

export const initSessionWatcher = () => {
  const run = async () => {
    const ok = await checkUserIsActive();
    if (ok) user_Profile();
  };

  ["load", "popstate", "pushstate"].forEach((ev) =>
    window.addEventListener(ev, run)
  );

  const original = history.pushState;
  history.pushState = function (...args) {
    original.apply(this, args);
    window.dispatchEvent(new Event("pushstate"));
  };
};

/* ============================================================
   INIT
============================================================ */

initOfflineSupport();
initSessionWatcher();
startTokenRefreshLoop();
