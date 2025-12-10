import { TIME_OUT } from "../config";

/**
 * APIClient — Universal HTTP Client
 * --------------------------------
 * ✅ Automatically includes cookies (credentials: 'include')
 * ✅ Supports GET, POST, PUT, PATCH, DELETE
 * ✅ Handles JSON & FormData
 * ✅ Supports JWT (Authorization header) if needed
 * ✅ Handles timeouts & aborts safely
 * ✅ Returns parsed JSON or raw Response
 */

export default class APIClient {
  static async request(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      TIME_OUT * 1000
    );

    try {
      const {
        method = "GET",
        body = null,
        token = null,
        headers: customHeaders = {},
        credentials = "include", // ✅ ALWAYS include cookies
        rawResponse = false,
        ...rest
      } = options;

      // Prepare headers
      const headers = { ...customHeaders };

      // Auto JSON header unless FormData
      if (body && !(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      // Optional Bearer token (if ever used)
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Fetch options
      const fetchOptions = {
        method,
        headers,
        credentials, // ✅ important
        signal: controller.signal,
        ...rest
      };

      // Body handling
      if (body) {
        fetchOptions.body =
          body instanceof FormData ? body : JSON.stringify(body);
      }

      console.log("fetchOptions:", fetchOptions)
      // Timeout race (fetch vs timeout)
      const response = await Promise.race([
        fetch(url, fetchOptions),
        this.timeoutPromise(TIME_OUT)
      ]);

      clearTimeout(timeoutId);

      if (rawResponse) return response;

      // Try parsing JSON (graceful)
      let data = null;
      try {
        data = await response.json();
      } catch (_) {}

      // HTTP error handling
      if (!response.ok) {
        const message =
          data?.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(message);
      }

      return data;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(`⏰ Request aborted after ${TIME_OUT} seconds`);
      }

      console.error(`❌ APIClient Error [${url}]:`, err.message);
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Timeout helper
  static timeoutPromise(seconds) {
    return new Promise((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(`⏰ Request timed out after ${seconds} seconds`)
          ),
        seconds * 1000
      )
    );
  }

  // Convenience methods
  static get(url, options = {}) {
    return this.request(url, { ...options, method: "GET" });
  }

  static post(url, body, options = {}) {
    return this.request(url, { ...options, method: "POST", body });
  }

  static put(url, body, options = {}) {
    return this.request(url, { ...options, method: "PUT", body });
  }

  static patch(url, body, options = {}) {
    return this.request(url, { ...options, method: "PATCH", body });
  }

  static delete(url, body = null, options = {}) {
    return this.request(url, { ...options, method: "DELETE", body });
  }
}
