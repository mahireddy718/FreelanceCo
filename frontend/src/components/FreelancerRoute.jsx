import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function FreelancerRoute({ children }) {
    const { isAuthenticated, isLoading, user } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has freelancer or both role
    if (user?.role !== 'freelancer' && user?.role !== 'both') {
        // Redirect clients to the find freelancers page
        return <Navigate to="/freelancers" replace />;
    }

    return children;
}
