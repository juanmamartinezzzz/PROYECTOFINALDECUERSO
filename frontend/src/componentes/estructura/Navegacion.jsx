import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { contextoAuth } from "../../contextos/ProveedorAuth";

const Navegacion = () => {
    const { token, user, logout, tieneNotificaciones, setTieneNotificaciones } = useContext(contextoAuth);

    const limpiarNotificacion = () => {
        if (setTieneNotificaciones) {
            setTieneNotificaciones(false);
        }
    };

    return (
        <nav className="main-nav">
            <div className="nav-left">
                <NavLink to="/">🏠 Inicio</NavLink>
                <NavLink to="/viajes">✈️ Mis Viajes</NavLink>
                <NavLink to="/social">👥 Amigos</NavLink>
                
                <div className="chat-link-wrapper">
                    <NavLink to="/chat" onClick={limpiarNotificacion}>
                        💬 Chat
                    </NavLink>
                    {tieneNotificaciones && (
                        <span className="notification-dot"></span>
                    )}
                </div>
            </div>
            
            <div className="nav-right">
                {token ? (
                    <div className="user-section">
                        <NavLink to="/perfil" className="profile-link">
                            <span className="user-name">{user?.name}</span>
                            <img 
                                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=0062e3&color=fff`} 
                                alt="Avatar" 
                                className="nav-avatar"
                            />
                        </NavLink>
                        <button onClick={logout} className="logout-btn">Salir</button>
                    </div>
                ) : (
                    <div className="user-section">
                        <NavLink to="/login" className="logout-btn" style={{ textDecoration: 'none', backgroundColor: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold' }}>
                            Iniciar Sesión
                        </NavLink>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navegacion;