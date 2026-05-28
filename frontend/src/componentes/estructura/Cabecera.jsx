import React from 'react';

const Cabecera = () => (
    <header style={{ 
        backgroundColor: 'var(--bg-nav)', // El azul oscuro de la paleta
        padding: '24px 5% 0', // Espacio arriba y a los lados, pegado por abajo al menú
        textAlign: 'left' // Logo a la izquierda
    }}>
        <h1 style={{ 
            margin: 0, 
            color: 'white', 
            fontSize: '32px',
            fontWeight: '900',
            letterSpacing: '-1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }}>
            {/* Le damos un toque de color al icono para que destaque */}
            <span style={{ color: 'var(--primary)' }}>✈️</span> VIAVIA
        </h1>
    </header>
);

export default Cabecera;