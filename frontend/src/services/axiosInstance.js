import axios from 'axios';

// Store logout callback
let logoutCallback = null;

// Set logout callback (called from AuthContext)
export const setLogoutCallback = (callback) => {
    logoutCallback = callback;
};

// Setup axios interceptor
export const setupAxiosInterceptor = () => {
    // Response interceptor to handle 401 errors
    axios.interceptors.response.use(
        (response) => {
            // If response is successful, return it
            return response;
        },
        (error) => {
            // Check if error is 401 Unauthorized
            if (error.response && error.response.status === 401) {
                // Get current path
                const currentPath = window.location.pathname;

                // Don't logout if already on login/signup pages or if it's a login attempt itself
                const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
                const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
                const isLoginAttempt = error.config?.url?.includes('/auth/login') ||
                    error.config?.url?.includes('/auth/signup') ||
                    error.config?.url?.includes('/auth/verify-otp');

                if (!isPublicPath && !isLoginAttempt) {
                    console.log('Session expired - logging out');

                    // Clear local storage
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');

                    // Call logout callback if it exists
                    if (logoutCallback) {
                        logoutCallback();
                    }

                    // Show session expired message
                    const message = 'Your session has expired. Please login again.';

                    // Store message in sessionStorage to show on login page
                    sessionStorage.setItem('sessionExpiredMessage', message);

                    // Redirect to login
                    window.location.href = '/login';
                }
            }

            // Return the error for further handling
            return Promise.reject(error);
        }
    );
};
