import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Redirect to /login if there is no logged-in user.
export default function ProtectedRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
}