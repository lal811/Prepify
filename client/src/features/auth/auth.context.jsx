import { useState, useEffect } from "react";
import { AuthContext } from "./auth.context.js";
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout } from "./services/auth.api.js";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkSession = async () => {
        try {
            const data = await getMe();
            setUser(data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    const handleLogin = async ({ email, password }) => {
        setLoading(true);
        try {
            const data = await apiLogin({ email, password });
            setUser(data.user);
            return data.user;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const data = await apiRegister({ username, email, password });
            setUser(data.user);
            return data.user;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await apiLogout();
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            loading,
            setLoading,
            handleLogin,
            handleRegister,
            handleLogout,
            checkSession
        }}>
            {children}
        </AuthContext.Provider>
    );
};