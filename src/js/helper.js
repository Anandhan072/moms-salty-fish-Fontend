import { TIME_OUT } from "./config";

import APIClient from "./utils/apiClient";

/**
 * Creates a timeout promise that rejects after N seconds.
 */
const timeoutPromise = (s) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`⏰ Request timed out after ${s} seconds`)), s * 1000)
  );

/**
 * Universal API Request Helper
 * Handles GET, POST, PUT, PATCH, DELETE with JSON or FormData.
 */
export const apiRequest = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIME_OUT * 1000);

  try {
    const {
      body,
      token,
      headers: customHeaders = {},
      rawResponse = false, // optional flag if you want raw fetch response
      ...rest
    } = options;

    const headers = { ...customHeaders };

    // Only set JSON headers if body is NOT FormData
    if (!(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    // Add Authorization header if token provided
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const fetchOptions = {
      method: body ? "POST" : "GET", // default to GET if no body
      ...rest,
      headers,
      signal: controller.signal,
    };

    if (body) {
      fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    // Race fetch with timeout
    const response = await Promise.race([fetch(url, fetchOptions), timeoutPromise(TIME_OUT)]);
    clearTimeout(timeout);

    // Return raw response if requested
    if (rawResponse) return response;

    // Handle empty body or non-JSON responses gracefully
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message = data?.message || `HTTP Error ${response.status}`;
      throw new Error(message);
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`⏰ Request aborted after ${TIME_OUT} seconds`);
    }
    console.error(`❌ API_REQ Error [${url}]:`, err.message);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};
