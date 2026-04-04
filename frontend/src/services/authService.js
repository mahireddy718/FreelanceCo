import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token management
export const tokenManager = {
    setToken: (token) => {
        localStorage.setItem('authToken', token);
    },
    getToken: () => {
        return localStorage.getItem('authToken');
    },
    removeToken: () => {
        localStorage.removeItem('authToken');
    },
};

// User data management
export const userManager = {
    setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
    },
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    removeUser: () => {
        localStorage.removeItem('user');
    },
};

// Auth API functions
export const authService = {
    // Login
    login: async (email, password, turnstileToken) => {
        try {
            const response = await api.post('/auth/login', { email, password, turnstileToken });
            const { jwtToken, name, email: userEmail, role, userId, username, isAdmin } = response.data;

            // Save token and user data
            tokenManager.setToken(jwtToken);
            const userData = { name, email: userEmail, role, userId, username, isAdmin: isAdmin || false };
            userManager.setUser(userData);

            // Also set loggedInUser for compatibility
            localStorage.setItem('loggedInUser', JSON.stringify(userData));

            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Login failed', success: false };
        }
    },

    // Signup
    signup: async (name, email, password, role = 'freelancer') => {
        try {
            const response = await api.post('/auth/signup', { name, email, password, role });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Signup failed', success: false };
        }
    },

    // Logout
    logout: () => {
        tokenManager.removeToken();
        userManager.removeUser();
        // Also remove legacy items if they exist
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!tokenManager.getToken();
    },

    // Get current user
    getCurrentUser: () => {
        return userManager.getUser();
    },

    // Sync Firebase user with backend
    syncFirebaseUser: async (firebaseUser) => {
        try {
            const response = await api.post('/auth/firebase-auth', {
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                firebaseUid: firebaseUser.uid,
                photoURL: firebaseUser.photoURL
            });

            const { jwtToken, name, email: userEmail, role, userId, username } = response.data;

            // Save token and user data from backend
            tokenManager.setToken(jwtToken);
            userManager.setUser({
                name,
                email: userEmail,
                role,
                userId,
                username,
                photoURL: firebaseUser.photoURL
            });

            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Firebase sync failed', success: false };
        }
    },
};

export default authService;
