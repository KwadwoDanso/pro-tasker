import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';

function Shell() {
    const { theme } = useTheme();

    // Inversion filter applies to everything inside the shell (accessibility).
    const inversionStyle = theme.inversion > 0
        ? { filter: `invert(${theme.inversion}%) hue-rotate(180deg)`, transition: 'filter 0.3s ease' }
        : {};

    return (
        <>
            <div className="shell" style={inversionStyle}>
                <BrowserRouter>
                    <Navbar />
                    <main className="container">
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                            <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
                        </Routes>
                    </main>
                </BrowserRouter>
            </div>

            {/* Warm night overlay lives outside the inverted shell so it stays warm. */}
            {theme.blueLight > 0 && (
                <div
                    className="night-overlay"
                    aria-hidden="true"
                    style={{ backgroundColor: `rgba(255, 180, 50, ${theme.blueLight / 250})` }}
                />
            )}
        </>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Shell />
            </AuthProvider>
        </ThemeProvider>
    );
}
