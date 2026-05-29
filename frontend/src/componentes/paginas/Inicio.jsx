import React from "react";
import { Link } from "react-router-dom";

const Inicio = () => {
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Bienvenido a ViaVia</h1>
                <p style={styles.subtitle}>Menos líos organizando, más tiempo viajando.</p>
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

            {/* NUEVA IMAGEN PANORÁMICA DE CIERRE */}
            <div style={styles.imageContainer}>
                <img 
                    src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80" 
                    alt="Paisaje de viaje al atardecer" 
                    style={styles.bannerImage} 
                />
                {/* Opcional: Un pequeño texto superpuesto sobre la imagen */}
                <div style={styles.imageOverlay}>
                    <h2 style={styles.overlayText}>El mundo te está esperando</h2>
                </div>
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
    
    // Estilos de la tarjeta 
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
    cardText: { color: 'var(--text-muted)', fontSize: '15px', margin: 0, lineHeight: '1.4' },

    // --- NUEVOS ESTILOS PARA EL BANNER ---
    imageContainer: {
        marginTop: '50px',
        width: '100%',
        borderRadius: '20px', 
        overflow: 'hidden', // Evita que la imagen se salga de los bordes redondeados
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        position: 'relative', // Para poder poner el texto encima
        lineHeight: 0 // Evita un pequeño margen fantasma debajo de las imágenes
    },
    bannerImage: {
        width: '100%',
        height: 'clamp(200px, 25vw, 350px)', // Altura adaptable (min 200px, max 350px)
        objectFit: 'cover', // Recorta la imagen sin deformarla para que llene el espacio
        display: 'block',
        filter: 'brightness(0.8)' // Oscurece un pelín la imagen para que destaque el texto
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none' // Evita que interfiera si alguien intenta hacer clic o arrastrar
    },
    overlayText: {
        color: 'white',
        fontSize: 'clamp(24px, 4vw, 36px)',
        fontWeight: '900',
        textShadow: '0 2px 10px rgba(0,0,0,0.5)', // Sombra para que se lea perfectamente
        margin: 0,
        textAlign: 'center',
        padding: '0 20px'
    }
};

export default Inicio;