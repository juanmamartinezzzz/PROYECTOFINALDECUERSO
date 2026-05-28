import React from 'react';

const Cabecera = () => (
    <header style={{ 
        backgroundColor: 'var(--bg-nav)', 
        padding: '24px 5% 0', 
        textAlign: 'left' 
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
            {/* color al icono*/}
            <span style={{ color: 'var(--primary)' }}>✈️</span> VIAVIA
        </h1>
    </header>
);

export default Cabecera;