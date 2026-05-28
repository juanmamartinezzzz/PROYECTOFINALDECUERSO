import React, { Fragment, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { contextoAuth } from "../../contextos/ProveedorAuth";

import Inicio from "../paginas/Inicio.jsx";
import Login from "../paginas/Login.jsx";
import Viajes from "../paginas/Viajes.jsx";
import CrearViaje from "../paginas/CrearViaje.jsx";
import Social from "../paginas/Social.jsx";
import Chat from "../paginas/Chat.jsx";
import Perfil from "../paginas/Perfil.jsx";
import Error from "../paginas/Error.jsx";
import GestionViaje from "../paginas/GestionViaje"; 
import Verificar from "../paginas/Verificar.jsx"; 


const Rutas = () => {
    const { token } = useContext(contextoAuth);

    return (
        <Fragment>
            <Routes>
                {/* --- RUTAS DE ACCESO (Si ya está logueado, no le dejamos ir al login) --- */}
                <Route 
                    path="/login" 
                    element={!token ? <Login /> : <Navigate to="/" />} 
                />
                <Route 
                    path="/verificar" 
                    element={!token ? <Verificar /> : <Navigate to="/" />} 
                />

                {/* --- RUTAS PÚBLICAS  --- */}
                <Route path="/" element={<Inicio />} /> 
                <Route path="/viajes" element={<Viajes />} />
                <Route path="/crear-viaje" element={<CrearViaje />} />
                <Route path="/social" element={<Social />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/viajes/:id" element={<GestionViaje /> } />
                
                {/* --- RUTA DE ERROR --- */}
                <Route path="*" element={<Error />} />
            </Routes>
        </Fragment>
    );
};

export default Rutas;