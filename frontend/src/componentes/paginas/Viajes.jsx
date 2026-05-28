import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import UnirseViaje from "./UnirseViaje"; 

const Viajes = () => {
    const navigate = useNavigate();
    const [viajes, setViajes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' });

    const obtenerViajes = async () => {
        setMensajeGeneral({ tipo: '', texto: '' });
        
        // Comprobamos 'ACCESS_TOKEN'
        if (!localStorage.getItem('ACCESS_TOKEN')) {
            setCargando(false);
            return;
        }

        try {
            const res = await api.get('/trips');
            setViajes(res.data.data || res.data); 
        } catch (err) {
            console.error("Error al cargar viajes", err);
            // Si el token caducó, lo limpiamos
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('ACCESS_TOKEN');
            }
            setMensajeGeneral({ tipo: 'error', texto: 'No se pudieron cargar tus viajes. Comprueba tu conexión.' });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerViajes();
    }, []);

    // Función para manejar el clic en "Nuevo Viaje"
    const handleCrearViaje = (e) => {
        if (!localStorage.getItem('ACCESS_TOKEN')) {
            e.preventDefault();
            navigate('/login');
        }
    };

    if (cargando) return <p style={styles.loadingText}>Cargando tus aventuras...</p>;

    return (
        <section style={styles.container}>
            
            {/* Cabecera Responsive */}
            <div style={styles.header}>
                <h2 style={styles.title}>Mis Viajes</h2>
                <Link to="/crear-viaje" style={styles.btnCrear} onClick={handleCrearViaje}> 
                    + Nuevo Viaje
                </Link>
            </div>

            {/* BANNER DE ERROR */}
            {mensajeGeneral.texto && (
                <div style={{
                    padding: '14px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #f87171'
                }}>
                    {mensajeGeneral.texto}
                </div>
            )}

            <div style={{ marginBottom: '30px' }}>
                <UnirseViaje onJoined={obtenerViajes} />
            </div>

            {/* Grid de Viajes Responsive */}
            <div style={styles.grid}>
                {viajes.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>Aún no tienes viajes. ¡Crea uno o únete con un código!</p>
                    </div>
                ) : (
                    viajes.map(v => (
                        <div key={v.id} style={styles.card}>
                            <h3 style={styles.cardTitle}>{v.titulo || v.destino}</h3>
                            
                            <div style={styles.cardContent}>
                                <p style={styles.cardText}>📍 <strong>Destino:</strong> {v.destino}</p>
                                <p style={styles.cardText}>📅 <strong>Fechas:</strong> {v.fecha_inicio} al {v.fecha_fin}</p>
                            </div>

                            <div style={styles.cardFooter}>
                                <span style={styles.codeText}>
                                    Código: <strong style={styles.codeValue}>{v.codigo_invitacion || v.invite_code}</strong>
                                </span>
                                <Link to={`/viajes/${v.id}`} style={styles.linkGestionar}>
                                    Gestionar →
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '20px 15px', fontFamily: 'var(--sans)', width: '100%', boxSizing: 'border-box' },
    loadingText: { textAlign: 'center', marginTop: '50px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '16px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' },
    title: { margin: 0, fontSize: 'clamp(24px, 4vw, 32px)', color: 'var(--text-main)', fontWeight: '800' },
    btnCrear: { backgroundColor: 'var(--primary)', color: 'white', padding: '12px 20px', borderRadius: 'var(--radius-btn)', textDecoration: 'none', fontWeight: '700', fontSize: '15px', transition: '0.2s', textAlign: 'center', whiteSpace: 'nowrap' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '40px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-card)', color: 'var(--text-muted)', border: '1px solid #e1e5ee' },
    card: { backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-card)', padding: '24px', boxShadow: 'var(--shadow)', border: '1px solid #e1e5ee', display: 'flex', flexDirection: 'column' },
    cardTitle: { marginBottom: '16px', marginTop: 0, fontSize: '20px', color: 'var(--text-main)', fontWeight: '800' },
    cardContent: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
    cardText: { margin: 0, color: 'var(--text-muted)', fontSize: '15px' },
    cardFooter: { marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e1e5ee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
    codeText: { fontSize: '14px', color: 'var(--text-muted)' },
    codeValue: { color: 'var(--text-main)', letterSpacing: '1px' },
    linkGestionar: { color: 'var(--primary)', fontWeight: '700', textDecoration: 'none', fontSize: '15px' }
};

export default Viajes;