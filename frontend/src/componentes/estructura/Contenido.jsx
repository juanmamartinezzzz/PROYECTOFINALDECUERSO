import React from "react";
import Rutas from "./Rutas.jsx";

const Contenido = () => {
    return (
        <main style={{ 
            flexGrow: 1, 
            width: '100%', 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '40px 5%', 
            boxSizing: 'border-box'
        }}>
            <Rutas />
        </main>
    );
};

export default Contenido;