import axios from 'axios';
// Import the function to get stored tokens
import { getTokens } from './auth';

// Get API URL from environment variable or use the default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Create an Axios instance with defaults
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Request interceptor for adding auth token if available
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token from our auth state management
    try {
      const tokens = getTokens();
      if (tokens?.accessToken) {
        config.headers['Authorization'] = `Bearer ${tokens.accessToken}`;
      }
    } catch (error) {
      console.error('Error attaching auth token to request:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle session expiry or auth errors
    if (error.response && error.response.status === 401) {
      // Could redirect to login or refresh token
      console.log('Authentication error occurred');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
