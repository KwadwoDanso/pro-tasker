import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeControls from './ThemeControls';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <header className="navbar">
            <Link to="/" className="brand">Pro-Tasker</Link>
            <nav className="nav-links" aria-label="Main navigation">
                <ThemeControls />
                {user ? (
                    <>
                        <span className="nav-user">Hi, {user.username}</span>
                        <button onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
}
