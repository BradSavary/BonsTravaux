// const API_BASE_URL = "http://liendev/api"; ////dev
const API_BASE_URL = 'http://lienprod/api'; //// prod

export const apiRequest = {
  getBaseUrl() {
    return API_BASE_URL;
  },

  async request(endpoint, method = "GET", data = null, includeToken = false) {
    try {
      const url = `${API_BASE_URL}/${endpoint}`;

      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
        },

        mode: "cors",
      };

      // Ajouter le token d'authentification si nécessaire
      if (includeToken) {
        const token = localStorage.getItem("authToken");
        if (token) {
          options.headers["Authorization"] = `Bearer ${token}`;
        }
      }

      if (data && ["POST", "PUT", "PATCH"].includes(method)) {
        options.body = JSON.stringify(data);
      }

      console.log(`Envoi requête ${method} vers ${url}`);

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}: ${response.statusText}`
        );
      }

      // Vérifier si la réponse contient du JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        return result;
      }

      // Sinon, retourner le texte de la réponse
      const text = await response.text();
      return {
        status: "success",
        message: text,
      };
    } catch (error) {
      console.error("API Request Error:", error);
      return {
        status: "error",
        message: error.message || "An error occurred while fetching data",
      };
    }
  },

  async post(endpoint, data, includeToken = false) {
    return this.request(endpoint, "POST", data, includeToken);
  },

  async get(endpoint, includeToken = false) {
    return this.request(endpoint, "GET", null, includeToken);
  },

  async delete(endpoint, includeToken = false) {
    return this.request(endpoint, "DELETE", null, includeToken);
  },
  async put(endpoint, data, includeToken = false) {
    return this.request(endpoint, "PUT", data, includeToken);
  },
};
