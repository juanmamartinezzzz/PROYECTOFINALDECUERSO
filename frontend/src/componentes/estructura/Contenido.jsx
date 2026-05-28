import React from "react";
import Rutas from "./Rutas.jsx";

const Contenido = () => {
    return (
        <main style={{ 
            flexGrow: 1, // Esto empuja mágicamente el pie de página al fondo
            width: '100%', 
            maxWidth: '1200px', // Ancho máximo para que no se estire demasiado en PC
            margin: '0 auto', // Centrado horizontal
            padding: '40px 5%', // Espacio generoso para respirar
            boxSizing: 'border-box'
        }}>
            <Rutas />
        </main>
    );
};

export default Contenido;