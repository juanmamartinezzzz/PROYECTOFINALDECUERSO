import React from "react";

const PiePagina = () => {
    return (
        <footer style={{ 
            textAlign: 'center', 
            padding: '24px', 
            backgroundColor: 'white', // Fondo blanco para el footer
            borderTop: '1px solid #e1e5ee', // Borde muy suave
            color: 'var(--text-muted)', // Color de texto secundario (gris)
            fontSize: '14px',
            fontWeight: '500'
        }}>
            <p style={{ margin: 0 }}>ViaVia © 2026 - Proyecto Final DAW</p>
        </footer>
    );
};

export default PiePagina;