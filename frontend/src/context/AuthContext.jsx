import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import firebaseAuthService from '../services/firebaseAuthService';
import RoleSelectionModal from '../components/RoleSelectionModal';
import { setLogoutCallback } from '../services/axiosInstance';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authProvider, setAuthProvider] = useState(null); // 'backend' or 'firebase'
    const [showRoleModal, setShowRoleModal] = useState(false);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = () => {
            // Check backend authentication first
            const authenticated = authService.isAuthenticated();
            const currentUser = authService.getCurrentUser();

            if (authenticated && currentUser) {
                setIsAuthenticated(true);
                setUser(currentUser);
                setAuthProvider(currentUser.firebaseUid ? 'firebase' : 'backend');
                setIsLoading(false);
                return;
            }

            // If no backend auth, check Firebase
            const unsubscribe = firebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
                if (firebaseUser) {
                    // Only sync if there's no backend token (meaning user hasn't manually logged out)
                    const hasBackendToken = authService.isAuthenticated();

                    if (!hasBackendToken) {
                        try {
                            // Sync Firebase user with backend
                            await authService.syncFirebaseUser(firebaseUser);
                            const syncedUser = authService.getCurrentUser();

                            setUser(syncedUser);
                            setIsAuthenticated(true);
                            setAuthProvider('firebase');

                            // Show role selection modal if role is still 'freelancer' (default for new users)
                            if (syncedUser.role === 'freelancer' && !localStorage.getItem('roleSelected')) {
                                setShowRoleModal(true);
                            }
                        } catch (error) {
                            console.error('Firebase sync error:', error);
                            // If sync fails, sign out from Firebase
                            await firebaseAuthService.signOut();
                            setUser(null);
                            setIsAuthenticated(false);
                            setAuthProvider(null);
                        }
                    } else {
                        // User has backend token but also Firebase session - sign out from Firebase
                        await firebaseAuthService.signOut();
                    }
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                    setAuthProvider(null);
                }
                setIsLoading(false);
            });

            return unsubscribe;
        };

        const unsubscribe = checkAuth();
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, []);

    // Register logout callback with axios interceptor
    useEffect(() => {
        setLogoutCallback(logout);
    }, []);

    const login = async (email, password, turnstileToken) => {
        try {
            const response = await authService.login(email, password, turnstileToken);
            const currentUser = authService.getCurrentUser();

            setUser(currentUser);
            setIsAuthenticated(true);

            return { success: true, data: response };
        } catch (error) {
            return { success: false, error };
        }
    };

    const signup = async (name, email, password, role) => {
        try {
            const response = await authService.signup(name, email, password, role);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error };
        }
    };


    const logout = async () => {
        try {
            // Always sign out from Firebase first (whether logged in via Firebase or backend)
            await firebaseAuthService.signOut();
        } catch (error) {
            console.error('Firebase signout error:', error);
        }

        // Then clear backend auth
        authService.logout();

        // Clear all state
        setUser(null);
        setIsAuthenticated(false);
        setAuthProvider(null);
    };

    // Firebase authentication methods
    const loginWithFirebase = async (email, password) => {
        try {
            const response = await firebaseAuthService.signInWithEmail(email, password);
            if (response.success) {
                // Sync Firebase user with backend
                await authService.syncFirebaseUser(response.user);
                const syncedUser = authService.getCurrentUser();

                setUser(syncedUser);
                setIsAuthenticated(true);
                setAuthProvider('firebase');
                return { success: true, data: response };
            }
            return response;
        } catch (error) {
            return { success: false, error };
        }
    };

    const signupWithFirebase = async (email, password, displayName) => {
        try {
            const response = await firebaseAuthService.signUpWithEmail(email, password, displayName);
            if (response.success) {
                // Sync Firebase user with backend
                await authService.syncFirebaseUser(response.user);
                const syncedUser = authService.getCurrentUser();

                setUser(syncedUser);
                setIsAuthenticated(true);
                setAuthProvider('firebase');
                return { success: true, data: response };
            }
            return response;
        } catch (error) {
            return { success: false, error };
        }
    };

    const loginWithGoogle = async () => {
        try {
            console.log('Attempting Google login...');
            const response = await firebaseAuthService.signInWithGoogle();
            console.log('Firebase Google response:', response);

            if (response.success) {
                console.log('Syncing with backend...');
                // Sync Firebase user with backend
                await authService.syncFirebaseUser(response.user);
                const syncedUser = authService.getCurrentUser();

                setUser(syncedUser);
                setIsAuthenticated(true);
                setAuthProvider('firebase');

                // Show role selection modal if role is still 'freelancer' (default for new users)
                if (syncedUser.role === 'freelancer' && !localStorage.getItem('roleSelected')) {
                    setShowRoleModal(true);
                }

                console.log('Google login successful!');
                return { success: true, data: response };
            }
            return response;
        } catch (error) {
            console.error('Google login error in AuthContext:', error);
            return { success: false, error };
        }
    };

    const loginWithGithub = async () => {
        try {
            const response = await firebaseAuthService.signInWithGithub();
            if (response.success) {
                // Sync Firebase user with backend
                await authService.syncFirebaseUser(response.user);
                const syncedUser = authService.getCurrentUser();

                setUser(syncedUser);
                setIsAuthenticated(true);
                setAuthProvider('firebase');
                return { success: true, data: response };
            }
            return response;
        } catch (error) {
            return { success: false, error };
        }
    };

    const handleRoleComplete = (updatedUser) => {
        setUser(updatedUser);
        setShowRoleModal(false);
        localStorage.setItem('roleSelected', 'true');
        // Update user in localStorage
        const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...currentUserData, role: updatedUser.role }));
    };

    const value = {
        user,
        isAuthenticated,
        isLoading,
        authProvider,
        // Backend authentication
        login,
        signup,
        // Firebase authentication
        loginWithFirebase,
        signupWithFirebase,
        loginWithGoogle,
        loginWithGithub,
        // Common
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
            {showRoleModal && <RoleSelectionModal onComplete={handleRoleComplete} />}
        </AuthContext.Provider>
    );
};

export default AuthContext;
