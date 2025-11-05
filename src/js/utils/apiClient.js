export default class APIClient {
  static async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      return await response.json();
    } catch (err) {
      console.error(`API Error:`, err);
      throw err;
    }
  }

  static get(url) {
    return this.request(url);
  }

  static post(url, body) {
    return this.request(url, { method: "POST", body: JSON.stringify(body) });
  }
}
