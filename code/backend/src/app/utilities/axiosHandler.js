const axios = require("axios");

class AxiosHandler {
    constructor() {
        this.instance = axios.create({
            // You can set global headers here
            headers: {
                "Content-Type": "application/json" // Default Content-Type
            }
        });

        // Add a request interceptor
        this.instance.interceptors.request.use(
            config => {
                console.log("Request Interceptor:", config);
                return config;
            },
            error => Promise.reject(error)
        );

        // Add a response interceptor
        this.instance.interceptors.response.use(
            response => {
                console.log("Response Interceptor:", response.data);
                return response;
            },
            error => Promise.reject(error)
        );
    }

    // GET request with optional headers
    async get(url, headers = {}) {
        try {
            const response = await this.instance.get(url, {headers});
            return response.data;
        } catch (error) {
            console.error("GET Request Error:", error);
            throw error;
        }
    }

    // POST request with optional headers
    async post(url, data, headers = {}) {
        try {
            const response = await this.instance.post(url, data, {headers});
            return response.data;
        } catch (error) {
            console.error("POST Request Error:", error);
            throw error;
        }
    }

    // PUT request with optional headers
    async put(url, data, headers = {}) {
        try {
            const response = await this.instance.put(url, data, {headers});
            return response.data;
        } catch (error) {
            console.error("PUT Request Error:", error);
            throw error;
        }
    }
}

// Usage
module.exports = new AxiosHandler();
