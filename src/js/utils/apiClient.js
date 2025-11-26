import { TIME_OUT } from "../config";

/**
 * APIClient — Universal HTTP Client
 * -----------------------------------
 * ✅ Supports: GET, POST, PUT, PATCH, DELETE
 * ✅ Handles: JSON, FormData, timeouts, auth tokens
 * ✅ Safe: automatic error catching and readable messages
 * ✅ Flexible: returns raw or parsed JSON based on flag
 */

export default class APIClient {
  static async request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIME_OUT * 1000);

    try {
      const {
        method = "GET",
        body,
        token,
        headers: customHeaders = {},
        rawResponse = false, // optional: return Response object directly
        ...rest
      } = options;

      const headers = { ...customHeaders };

      console.log(headers)

      // Automatically set JSON header unless it's FormData
      if (!(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      
      // Add Bearer token if provided
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const fetchOptions = {
        method,
        headers,
        signal: controller.signal,
        ...rest,
      };


      console.log("fetchOptions.:", fetchOptions)

      if (body) {
        fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
      }

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, fetchOptions),
        this.timeoutPromise(TIME_OUT),
      ]);

      clearTimeout(timeout);

      if (rawResponse) return response;

      // Parse JSON response (handle empty body)
      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const message = data?.message || `HTTP ${response.status}: ${response.statusText}`;
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
      clearTimeout(timeout);
    }
  }

  // Timeout helper (same as in your second file)
  static timeoutPromise(seconds) {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`⏰ Request timed out after ${seconds} seconds`)),
        seconds * 1000
      )
    );
  }

  // Shorthand methods
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
