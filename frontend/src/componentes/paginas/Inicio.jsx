import React from "react";
import { Link } from "react-router-dom";

const Inicio = () => {
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Bienvenido a ViaVia</h1>
                <p style={styles.subtitle}>Tu próxima aventura comienza aquí.</p>
            </header>

            <div style={styles.grid}>
                <Link to="/crear-viaje" style={styles.card}>
                    <span style={styles.icon}>🗺️</span>
                    <h3 style={styles.cardTitle}>Crear Viaje</h3>
                    <p style={styles.cardText}>Organiza un destino con tus amigos</p>
                </Link>

                <Link to="/social" style={styles.card}>
                    <span style={styles.icon}>👥</span>
                    <h3 style={styles.cardTitle}>Amigos</h3>
                    <p style={styles.cardText}>Gestiona tus peticiones y contactos</p>
                </Link>

                <Link to="/chat" style={styles.card}>
                    <span style={styles.icon}>💬</span>
                    <h3 style={styles.cardTitle}>Chat</h3>
                    <p style={styles.cardText}>Habla en tiempo real con tu grupo</p>
                </Link>
            </div>
        </div>
    );
};

const styles = {
    // Contenedor principal responsive
    container: { maxWidth: '1000px', margin: '0 auto', padding: '20px 15px', fontFamily: 'var(--sans)', boxSizing: 'border-box', width: '100%' },
    
    // Cabecera con texto adaptable
    header: { textAlign: 'center', margin: '40px 0 60px' },
    title: { fontSize: 'clamp(32px, 6vw, 48px)', marginBottom: '10px', color: 'var(--text-main)', fontWeight: '900', letterSpacing: '-1px' },
    subtitle: { fontSize: 'clamp(16px, 3vw, 20px)', color: 'var(--text-muted)', margin: 0 },
    
    // Grid automático: crea columnas de mínimo 250px. Si no caben, las apila.
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px' },
    
    // Estilos de la tarjeta (funcionando como botón/enlace)
    card: { 
        backgroundColor: 'var(--card-bg)', 
        padding: '40px 20px', 
        borderRadius: 'var(--radius-card)', 
        boxShadow: 'var(--shadow)', 
        border: '1px solid #e1e5ee',
        textDecoration: 'none', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    
    icon: { fontSize: '60px', display: 'block', marginBottom: '20px' },
    cardTitle: { marginBottom: '10px', marginTop: 0, fontSize: '22px', color: 'var(--text-main)', fontWeight: '800' },
    cardText: { color: 'var(--text-muted)', fontSize: '15px', margin: 0, lineHeight: '1.4' }
};

export default Inicio;