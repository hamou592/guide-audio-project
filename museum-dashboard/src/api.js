import axios from 'axios';

// Create an axios instance for the CSRF cookie
const csrfAxios = axios.create({
  baseURL: 'https://nasro.expedgs-audioguide.duckdns.org/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  }
});

// Create an axios instance for API calls
const api = axios.create({
  baseURL: 'https://nasro.expedgs-audioguide.duckdns.org/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});


// Add response interceptor
// api.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.response?.status === 401) {
//       // Clear user data and redirect to login
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
//     console.error('API Error:', error.response?.data || error.message);
//     throw error;
//   }
// );

api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Clear user data
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


// Add request interceptor to add XSRF-TOKEN header
api.interceptors.request.use(config => {
  // Get the XSRF token from cookies
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  
  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }

  // Add Authorization header if user is logged in
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    if (userData.token) {
      config.headers['Authorization'] = `Bearer ${userData.token}`;
    }
  }

  return config;
});

// Get CSRF cookie
export const getCsrfCookie = async () => {
  try {
    await csrfAxios.get('/sanctum/csrf-cookie');
    return true;
  } catch (error) {
    console.error('Failed to get CSRF cookie:', error);
    return false;
  }
};


// Add logout helper function
export const logout = async () => {
  try {
    await api.post('/logout');
    localStorage.removeItem('user');
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Force logout even if API call fails
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

export default api;