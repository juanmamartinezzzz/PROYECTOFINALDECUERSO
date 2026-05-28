import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const Social = () => {
    const navigate = useNavigate();
    const [amigos, setAmigos] = useState([]);
    const [peticiones, setPeticiones] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [mostrarBuzon, setMostrarBuzon] = useState(false);
    const [loading, setLoading] = useState(false);

    // Estado para los mensajes visuales (sin alerts)
    const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        // Comprobamos 'ACCESS_TOKEN'
        if (!localStorage.getItem('ACCESS_TOKEN')) {
            return;
        }

        try {
            const resAmigos = await api.get('/amigos/listado');
            setAmigos(resAmigos.data || []);

            const resPeticiones = await api.get('/peticiones-pendientes');
            setPeticiones(resPeticiones.data || []);
        } catch (error) {
            console.error("Error al cargar los datos sociales", error);
        }
    };

    const buscarUsuarios = async (e) => {
        e.preventDefault();
        setMensajeGeneral({ tipo: '', texto: '' });
        
        // Comprobamos 'ACCESS_TOKEN' antes de buscar
        if (!localStorage.getItem('ACCESS_TOKEN')) {
            navigate('/login');
            return;
        }

        if (!busqueda.trim()) return;
        
        setLoading(true);
        try {
            const res = await api.get(`/usuarios/buscar?query=${busqueda}`);
            setResultados(res.data || []);
            if (res.data.length === 0) {
                setMensajeGeneral({ tipo: 'error', texto: 'No se han encontrado usuarios con ese nombre o correo.' });
            }
        } catch (error) {
            console.error("Error en la búsqueda", error);
            setMensajeGeneral({ tipo: 'error', texto: 'Hubo un problema con la búsqueda.' });
        } finally {
            setLoading(false);
        }
    };

    const enviarPeticion = async (id) => {
        setMensajeGeneral({ tipo: '', texto: '' });
        
        //  Comprobamos 'ACCESS_TOKEN'
        if (!localStorage.getItem('ACCESS_TOKEN')) {
            navigate('/login');
            return;
        }

        try {
            const res = await api.post(`/peticiones/enviar/${id}`);
            setMensajeGeneral({ tipo: 'exito', texto: res.data.message || "¡Petición de amistad enviada con éxito!" });
            setResultados(resultados.filter(u => u.id !== id));
        } catch (error) {
            setMensajeGeneral({ tipo: 'error', texto: error.response?.data?.message || "Error al enviar la petición." });
        }
    };

    const aceptarPeticion = async (id) => {
        setMensajeGeneral({ tipo: '', texto: '' });
        
        // Comprobamos 'ACCESS_TOKEN'
        if (!localStorage.getItem('ACCESS_TOKEN')) {
            navigate('/login');
            return;
        }

        try {
            await api.post(`/peticiones/aceptar/${id}`);
            setMensajeGeneral({ tipo: 'exito', texto: "¡Petición aceptada! Ya tenéis conexión." });
            
            cargarDatos();
            
            if (peticiones.length <= 1) {
                setMostrarBuzon(false);
            }
        } catch (error) {
            setMensajeGeneral({ tipo: 'error', texto: "Error al intentar aceptar la petición." });
        }
    };

    return (
        <div style={styles.container}>
            
            {/* CABECERA Y BUZÓN */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>👥 Mis Amigos</h1>
                    <p style={styles.subtitle}>Encuentra a tus compañeros de viaje</p>
                </div>
                
                <button style={styles.buzonBtn} onClick={() => setMostrarBuzon(!mostrarBuzon)}>
                    📬 Buzón
                    {peticiones.length > 0 && (
                        <span style={styles.badge}>{peticiones.length}</span>
                    )}
                </button>
            </div>

            {/* BANNER DE MENSAJES INTEGRADO */}
            {mensajeGeneral.texto && (
                <div style={{
                    padding: '14px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    backgroundColor: mensajeGeneral.tipo === 'exito' ? '#d1fae5' : '#fee2e2',
                    color: mensajeGeneral.tipo === 'exito' ? '#065f46' : '#dc2626',
                    border: `1px solid ${mensajeGeneral.tipo === 'exito' ? '#34d399' : '#f87171'}`,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}>
                    {mensajeGeneral.texto}
                </div>
            )}

            {/* PANEL DEL BUZÓN */}
            {mostrarBuzon && (
                <div style={styles.buzonPanel}>
                    <h3 style={styles.sectionTitle}>Peticiones Pendientes</h3>
                    {peticiones.length === 0 ? (
                        <p style={styles.noData}>No tienes peticiones de amistad nuevas.</p>
                    ) : (
                        <div style={styles.grid}>
                            {peticiones.map(user => (
                                <div key={user.id} style={styles.userCard}>
                                    <div style={styles.avatarMini}>{user.name.substring(0,2).toUpperCase()}</div>
                                    <div style={{flex: 1, minWidth: 0}}>
                                        <h4 style={styles.userName}>{user.name}</h4>
                                        <p style={styles.userEmail}>{user.email}</p>
                                    </div>
                                    <button style={styles.btnAccept} onClick={() => aceptarPeticion(user.id)}>
                                        ✅ Aceptar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* BUSCADOR DE USUARIOS */}
            <div style={styles.card}>
                <h3 style={styles.sectionTitle}>🔍 Añadir nuevos amigos</h3>
                <form onSubmit={buscarUsuarios} style={styles.searchForm}>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre de usuario o email..." 
                        value={busqueda} 
                        onChange={(e) => {
                            setBusqueda(e.target.value);
                            if(mensajeGeneral.texto) setMensajeGeneral({ tipo: '', texto: '' });
                        }} 
                        style={styles.input}
                    />
                    <button type="submit" style={styles.btnPrimary} disabled={loading}>
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>

                {resultados.length > 0 && (
                    <div style={{marginTop: '30px'}}>
                        <h4 style={styles.subTitle}>Resultados:</h4>
                        <div style={styles.grid}>
                            {resultados.map(user => (
                                <div key={user.id} style={styles.userCard}>
                                    <div style={styles.avatarMini}>{user.name.substring(0,2).toUpperCase()}</div>
                                    <div style={{flex: 1, minWidth: 0}}>
                                        <h4 style={styles.userName}>{user.name}</h4>
                                    </div>
                                    <button style={styles.btnAdd} onClick={() => enviarPeticion(user.id)}>
                                        ➕ Añadir
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* LISTADO DE AMIGOS ACTUALES */}
            <div style={{marginTop: '40px'}}>
                <h3 style={styles.sectionTitle}>Tus Amigos ({amigos.length})</h3>
                {amigos.length === 0 ? (
                    <p style={styles.noData}>Aún no has añadido a ningún amigo. ¡Busca viajeros arriba!</p>
                ) : (
                    <div style={styles.grid}>
                        {amigos.map(amigo => (
                            <div key={amigo.id} style={styles.friendCard}>
                                <div style={styles.avatarMedium}>{amigo.name.substring(0,2).toUpperCase()}</div>
                                <h4 style={styles.userNameCenter}>{amigo.name}</h4>
                                <p style={styles.userEmailCenter}>{amigo.email}</p>
                                <button 
                                    style={styles.btnChat} 
                                    onClick={() => navigate('/chat', { state: { seleccionarAmigo: amigo } })}
                                >
                                    💬 Mensaje
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '20px 15px', fontFamily: 'var(--sans)', width: '100%', boxSizing: 'border-box' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' },
    title: { fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 5px 0', letterSpacing: '-0.5px' },
    subtitle: { fontSize: '16px', color: 'var(--text-muted)', margin: 0 },
    buzonBtn: { position: 'relative', backgroundColor: 'var(--card-bg)', border: '1px solid #e1e5ee', padding: '12px 24px', borderRadius: 'var(--radius-btn)', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', transition: '0.2s', flex: '0 0 auto' },
    badge: { position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#e74c3c', color: 'white', borderRadius: '50%', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', border: '2px solid white' },
    
    buzonPanel: { backgroundColor: 'rgba(0, 98, 227, 0.05)', border: '1px solid rgba(0, 98, 227, 0.2)', borderRadius: 'var(--radius-card)', padding: 'clamp(15px, 4vw, 24px)', marginBottom: '30px', boxShadow: 'var(--shadow)', boxSizing: 'border-box' },
    card: { backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-card)', padding: 'clamp(15px, 4vw, 30px)', boxShadow: 'var(--shadow)', border: '1px solid #e1e5ee', boxSizing: 'border-box' },
    sectionTitle: { fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '20px', marginTop: 0 },
    subTitle: { fontSize: '15px', color: 'var(--text-muted)', marginBottom: '15px', fontWeight: '600' },
    noData: { color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '15px' },
    searchForm: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    input: { flex: '1 1 200px', padding: '14px 20px', borderRadius: 'var(--radius-btn)', border: '1px solid #e1e5ee', fontSize: '15px', outline: 'none', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', boxSizing: 'border-box' },
    btnPrimary: { flex: '0 0 auto', backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '14px 30px', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', fontSize: '15px', transition: '0.2s' },
    
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    
    userCard: { display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: '12px', border: '1px solid #e1e5ee', transition: '0.2s', flexWrap: 'wrap' },
    friendCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-card)', border: '1px solid #e1e5ee', boxShadow: 'var(--shadow)', transition: 'transform 0.2s, box-shadow 0.2s' },
    
    avatarMini: { width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg-nav)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 },
    avatarMedium: { width: '70px', height: '70px', borderRadius: '50%', background: 'var(--bg-nav)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '24px', marginBottom: '15px', boxShadow: '0 4px 10px rgba(5,32,60,0.2)' },
    
    userName: { margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', wordBreak: 'break-word' },
    userEmail: { margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)', wordBreak: 'break-all' }, 
    userNameCenter: { margin: '0 0 5px 0', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', wordBreak: 'break-word', textAlign: 'center' },
    userEmailCenter: { margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-muted)', wordBreak: 'break-all', textAlign: 'center' },
    
    btnAdd: { flex: '0 0 auto', backgroundColor: 'var(--card-bg)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '8px 16px', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', fontSize: '13px', transition: '0.2s' },
    btnAccept: { flex: '0 0 auto', backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', fontSize: '13px', transition: '0.2s' },
    btnChat: { backgroundColor: 'rgba(0, 98, 227, 0.1)', color: 'var(--primary)', border: 'none', padding: '12px 0', width: '100%', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', fontSize: '15px', transition: '0.2s' }
};

export default Social;