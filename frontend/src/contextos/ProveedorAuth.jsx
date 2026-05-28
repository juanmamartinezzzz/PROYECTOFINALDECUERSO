import { createContext, useState, useEffect } from "react";
import api from "../api/axios.js"; 
import { useNavigate } from "react-router-dom";

export const contextoAuth = createContext();

export const ProveedorAuth = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('ACCESS_TOKEN'));
    
    // ESTADO GLOBAL PARA EL CHAT
    const [tieneNotificaciones, setTieneNotificaciones] = useState(false); 
    
    const navegar = useNavigate();

    // Persistir sesión
    useEffect(() => {
        if (token) {
            api.get('/user/profile')
                .then(res => setUser(res.data.user))
                .catch(() => logout());
        }
    }, [token]);

    // POLLING DE NOTIFICACIONES (Revisa cada 5 segundos)
    useEffect(() => {
        let intervalo;
        if (token) {
            const checkNotificaciones = async () => {
                try {
                    const res = await api.get('/chat/notificaciones');
                    setTieneNotificaciones(res.data.hay_nuevos);
                } catch (error) {
                    // Silencioso en caso de fallo temporal
                }
            };

            checkNotificaciones(); 
            intervalo = setInterval(checkNotificaciones, 5000); 
        }
        return () => clearInterval(intervalo);
    }, [token]);

    const login = async (datos) => {
        const res = await api.post('/login', datos);
        localStorage.setItem('ACCESS_TOKEN', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        navegar("/");
    };

    const register = async (formData) => {
        await api.post('/register', formData);
    };

    const logout = () => {
        localStorage.removeItem('ACCESS_TOKEN');
        setToken(null);
        setUser(null);
        setTieneNotificaciones(false);
        navegar("/login");
    };

    return (
        <contextoAuth.Provider value={{ user, token, tieneNotificaciones, setTieneNotificaciones, login, register, logout }}>
            {children}
        </contextoAuth.Provider>
    );
};

export default ProveedorAuth;
