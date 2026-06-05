import { createContext, useContext, useState } from 'react';
import api from '../api/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    // Initialize from localStorage so a refresh keeps the user logged in.
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const login = async (email, password) => {
        const { data } = await api.post('/users/login', { email, password });
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
    };

    const register = async (username, email, password) => {
        const { data } = await api.post('/users/register', { username, email, password });
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook so components consume auth without importing useContext each time.
export function useAuth() {
    return useContext(AuthContext);
}