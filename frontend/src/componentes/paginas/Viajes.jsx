import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import UnirseViaje from "./UnirseViaje"; 

const Viajes = () => {
    const [viajes, setViajes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' });

    // ✅ NUEVOS ESTADOS PARA EL FILTRO
    const [filtroDestino, setFiltroDestino] = useState('');
    const [filtroFecha, setFiltroFecha] = useState('');

    const obtenerViajes = async () => {
        setMensajeGeneral({ tipo: '', texto: '' });
        
        if (!localStorage.getItem('ACCESS_TOKEN')) {
            setCargando(false);
            return;
        }

        try {
            const res = await api.get('/trips');
            setViajes(res.data.data || res.data); 
        } catch (err) {
            console.error("Error al cargar viajes", err);
            setMensajeGeneral({ tipo: 'error', texto: 'No se pudieron cargar tus viajes.' });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerViajes();
    }, []);

    // ✅ LÓGICA DE FILTRADO EN TIEMPO REAL
    const viajesFiltrados = viajes.filter(v => {
        // Obtenemos el texto del destino (y por si acaso del título) y lo pasamos a minúsculas
        const destinoOtitulo = ((v.destino || '') + ' ' + (v.titulo || '')).toLowerCase();
        const coincideDestino = destinoOtitulo.includes(filtroDestino.toLowerCase());
        
        // Comprobamos la fecha (solo si el usuario ha seleccionado una)
        let coincideFecha = true;
        if (filtroFecha) {
            // Un viaje coincide si la fecha seleccionada cae entre su inicio y su fin
            const fViajeInicio = new Date(v.fecha_inicio || v.start_date);
            const fViajeFin = new Date(v.fecha_fin || v.end_date);
            const fBuscada = new Date(filtroFecha);
            
            // Ponemos todas las fechas a las 00:00:00 para comparar solo el día
            fViajeInicio.setHours(0,0,0,0);
            fViajeFin.setHours(0,0,0,0);
            fBuscada.setHours(0,0,0,0);

            coincideFecha = (fBuscada >= fViajeInicio && fBuscada <= fViajeFin);
        }

        return coincideDestino && coincideFecha;
    });

    if (cargando) return <p style={styles.loadingText}>Cargando tus aventuras...</p>;

    return (
        <section style={styles.container}>
            
            <div style={styles.header}>
                <h2 style={styles.title}>Mis Viajes</h2>
                <Link to="/crear-viaje" style={styles.btnCrear}>+ Nuevo Viaje</Link>
            </div>

            {mensajeGeneral.texto && (
                <div style={{
                    padding: '14px', marginBottom: '20px', borderRadius: '8px', textAlign: 'center',
                    fontWeight: 'bold', fontSize: '15px',
                    backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #f87171'
                }}>
                    {mensajeGeneral.texto}
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <UnirseViaje onJoined={obtenerViajes} />
            </div>

            {/* ✅ NUEVA BARRA DE BÚSQUEDA / FILTRO */}
            {viajes.length > 0 && (
                <div style={styles.filtroContainer}>
                    <div style={styles.filtroInputGroup}>
                        <span style={styles.filtroIcon}>🔍</span>
                        <input 
                            type="text" 
                            placeholder="Buscar por destino o título..." 
                            value={filtroDestino}
                            onChange={(e) => setFiltroDestino(e.target.value)}
                            style={styles.filtroInput}
                        />
                    </div>
                    <div style={styles.filtroInputGroup}>
                        <span style={styles.filtroIcon}>📅</span>
                        <input 
                            type="date" 
                            value={filtroFecha}
                            onChange={(e) => setFiltroFecha(e.target.value)}
                            style={styles.filtroInput}
                            title="Filtrar viajes activos en esta fecha"
                        />
                    </div>
                    {/* Botón para limpiar filtros rápidamente si hay alguno activo */}
                    {(filtroDestino || filtroFecha) && (
                        <button 
                            onClick={() => { setFiltroDestino(''); setFiltroFecha(''); }}
                            style={styles.btnLimpiar}
                        >
                            ✖ Limpiar
                        </button>
                    )}
                </div>
            )}

            <div style={styles.grid}>
                {viajes.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>Aún no tienes viajes. ¡Crea uno o únete con un código!</p>
                    </div>
                ) : viajesFiltrados.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p>No hay ningún viaje que coincida con tu búsqueda. 🕵️‍♂️</p>
                    </div>
                ) : (
                    viajesFiltrados.map(v => (
                        <div key={v.id} style={styles.card}>
                            
                            {/* Imagen del viaje */}
                            {v.image_url ? (
                                <img 
                                    src={v.image_url} 
                                    alt={v.titulo || v.destino} 
                                    style={styles.cardImage} 
                                />
                            ) : (
                                <div style={{
                                    ...styles.cardImagePlaceholder,
                                    backgroundImage: `url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=60")`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}>
                                    <span style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '50%' }}>✈️</span>
                                </div>
                            )}

                            <div style={styles.cardBody}>
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
    
    filtroContainer: { display: 'flex', gap: '15px', flexWrap: 'wrap', backgroundColor: 'var(--card-bg)', padding: '15px', borderRadius: 'var(--radius-card)', border: '1px solid #e1e5ee', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
    filtroInputGroup: { display: 'flex', alignItems: 'center', flex: '1 1 200px', backgroundColor: 'var(--bg-app)', border: '1px solid #e1e5ee', borderRadius: '10px', padding: '0 15px' },
    filtroIcon: { fontSize: '18px', marginRight: '10px' },
    filtroInput: { border: 'none', background: 'transparent', padding: '12px 0', width: '100%', outline: 'none', fontSize: '15px', color: 'var(--text-main)' },
    btnLimpiar: { flex: '0 0 auto', background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: '0.2s' },

    card: { backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow)', border: '1px solid #e1e5ee', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
 
    cardImage: { width: '100%', height: '160px', objectFit: 'cover' },
    cardImagePlaceholder: { width: '100%', height: '160px', backgroundColor: 'var(--bg-nav)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' },
    
    cardBody: { padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 },
    cardTitle: { marginBottom: '16px', marginTop: 0, fontSize: '20px', color: 'var(--text-main)', fontWeight: '800' },
    cardContent: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
    cardText: { margin: 0, color: 'var(--text-muted)', fontSize: '15px' },
    cardFooter: { marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #e1e5ee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
    codeText: { fontSize: '14px', color: 'var(--text-muted)' },
    codeValue: { color: 'var(--text-main)', letterSpacing: '1px' },
    linkGestionar: { color: 'var(--primary)', fontWeight: '700', textDecoration: 'none', fontSize: '15px' }
};

export default Viajes;