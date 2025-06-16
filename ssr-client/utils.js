const axios = require('axios');

async function callResourceAPI(endpoint, token, method = "GET", data = null) {
  try {
    const config = {
      method,
      url: `${process.env.RESOURCE_API}${endpoint}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (data && method !== "GET") {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(
      `Resource API Error (${method} ${endpoint}):`,
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = { callResourceAPI }; 