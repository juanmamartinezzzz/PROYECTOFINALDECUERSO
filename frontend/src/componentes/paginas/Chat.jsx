import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { contextoAuth } from '../../contextos/ProveedorAuth';

const Chat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { setTieneNotificaciones } = useContext(contextoAuth);

    const [amigos, setAmigos] = useState([]);
    const [amigoSeleccionado, setAmigoSeleccionado] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [loadingChat, setLoadingChat] = useState(false);
    
    const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' });
    const [esMovil, setEsMovil] = useState(window.innerWidth <= 768);
    
    const contenedorMensajesRef = useRef(null);

    useEffect(() => {
        const manejarResize = () => setEsMovil(window.innerWidth <= 768);
        window.addEventListener('resize', manejarResize);
        return () => window.removeEventListener('resize', manejarResize);
    }, []);

    useEffect(() => {
        obtenerContactos();
    }, []);

    useEffect(() => {
        if (location.state && location.state.seleccionarAmigo) {
            seleccionarAmigo(location.state.seleccionarAmigo);
        }
    }, [location.state]);

    useEffect(() => {
        if (!amigoSeleccionado) return;

        const actualizarMensajesSilenciosamente = async () => {
            if (!localStorage.getItem('ACCESS_TOKEN')) return;

            try {
                const res = await api.get(`/chat/mensajes/${amigoSeleccionado.id}`);
                if (res.data.length !== mensajes.length) {
                    setMensajes(res.data || []);
                    await api.post(`/chat/marcar-leidos/${amigoSeleccionado.id}`);
                    // Recargamos contactos para actualizar contadores
                    await obtenerContactos();
                }
            } catch (error) {
                console.error("Error en el refresco", error);
            }
        };

        const intervalo = setInterval(actualizarMensajesSilenciosamente, 3000);
        return () => clearInterval(intervalo);
    }, [amigoSeleccionado, mensajes.length]);

    useEffect(() => {
        if (contenedorMensajesRef.current) {
            contenedorMensajesRef.current.scrollTop = contenedorMensajesRef.current.scrollHeight;
        }
    }, [mensajes]);

    const obtenerContactos = async () => {
        if (!localStorage.getItem('ACCESS_TOKEN')) return;

        try {
            const res = await api.get('/amigos/listado');
            setAmigos(res.data || []);
        } catch (error) {
            console.error("Error al cargar contactos", error);
        }
    };

    const seleccionarAmigo = async (amigo) => {
        setAmigoSeleccionado(amigo);
        setMensajeGeneral({ tipo: '', texto: '' }); 
        
        if (!localStorage.getItem('ACCESS_TOKEN')) {
            setMensajes([]);
            return;
        }

        setLoadingChat(true);
        try {
            const res = await api.get(`/chat/mensajes/${amigo.id}`);
            setMensajes(res.data || []);
            
            await api.post(`/chat/marcar-leidos/${amigo.id}`);
            
            // Recargamos la lista para actualizar unread_count y reordenar
            await obtenerContactos();
            
            if (setTieneNotificaciones) setTieneNotificaciones(false);

        } catch (error) {
            setMensajeGeneral({ tipo: 'error', texto: 'No se pudieron cargar los mensajes.' });
        } finally {
            setLoadingChat(false);
        }
    };

    const manejarEnvio = async (e) => {
        e.preventDefault();
        setMensajeGeneral({ tipo: '', texto: '' });
        
        if (!localStorage.getItem('ACCESS_TOKEN')) {
            navigate('/login');
            return;
        }

        if (!nuevoMensaje.trim() || !amigoSeleccionado) return;

        try {
            const res = await api.post('/chat/enviar', {
                amigo_id: amigoSeleccionado.id,
                mensaje: nuevoMensaje
            });

            setMensajes([...mensajes, res.data]);
            setNuevoMensaje('');
        } catch (error) {
            setMensajeGeneral({ tipo: 'error', texto: 'No se pudo enviar el mensaje.' });
        }
    };

    //Ordenar amigos: Mayor número de no leídos primero
    const amigosOrdenados = [...amigos].sort((a, b) => {
        return (b.unread_count || 0) - (a.unread_count || 0);
    });

    const mostrarSidebar = !esMovil || (esMovil && !amigoSeleccionado);
    const mostrarChat = !esMovil || (esMovil && amigoSeleccionado);

    return (
        <div style={{ padding: esMovil ? '10px' : '20px 15px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
            <div style={styles.whatsappContainer}>
                
                {mostrarSidebar && (
                    <div style={{ ...styles.sidebar, width: esMovil ? '100%' : '320px', borderRight: esMovil ? 'none' : '1px solid #e1e5ee' }}>
                        <div style={styles.sidebarHeader}>
                            <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--text-main)' }}>Chats</h3>
                        </div>
                        <div style={styles.listaContactos}>
                            {amigosOrdenados.length === 0 ? (
                                <p style={styles.noContactos}>No tienes amigos agregados para chatear aún.</p>
                            ) : (
                                amigosOrdenados.map(amigo => {
                                    const tieneNuevos = (amigo.unread_count || 0) > 0;
                                    return (
                                        <div 
                                            key={amigo.id} 
                                            onClick={() => seleccionarAmigo(amigo)}
                                            style={{
                                                ...styles.contactoRow,
                                                backgroundColor: amigoSeleccionado?.id === amigo.id && !esMovil ? 'rgba(0, 98, 227, 0.08)' : 'transparent',
                                                borderLeft: amigoSeleccionado?.id === amigo.id && !esMovil ? '4px solid var(--primary)' : '4px solid transparent'
                                            }}
                                        >
                                            <div style={styles.avatarMini}>{amigo.name.substring(0,2).toUpperCase()}</div>
                                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h4 style={styles.contactoName}>{amigo.name}</h4>
                                                    <p style={{
                                                        ...styles.contactoStatus,
                                                        fontWeight: tieneNuevos ? 'bold' : 'normal',
                                                        color: tieneNuevos ? 'var(--primary)' : 'var(--text-muted)'
                                                    }}>
                                                        {tieneNuevos ? 'Nuevo mensaje' : 'Clic para chatear'}
                                                    </p>
                                                </div>
                                                {tieneNuevos && (
                                                    <span style={styles.badgeMensajes}>
                                                        {amigo.unread_count > 99 ? '99+' : amigo.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {mostrarChat && (
                    <div style={styles.chatArea}>
                        {amigoSeleccionado ? (
                            <>
                                <div style={styles.chatHeader}>
                                    {esMovil && (
                                        <button onClick={() => setAmigoSeleccionado(null)} style={styles.btnVolver}>⬅️</button>
                                    )}
                                    <div style={styles.avatarMini}>{amigoSeleccionado.name.substring(0,2).toUpperCase()}</div>
                                    <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--text-main)', fontSize: '16px' }}>{amigoSeleccionado.name}</h4>
                                </div>

                                {mensajeGeneral.texto && (
                                    <div style={{ padding: '10px', margin: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #f87171' }}>
                                        {mensajeGeneral.texto}
                                    </div>
                                )}

                                <div style={styles.messagesContainer} ref={contenedorMensajesRef}>
                                    {loadingChat ? (
                                        <p style={styles.infoText}>Cargando mensajes...</p>
                                    ) : mensajes.length === 0 ? (
                                        <p style={styles.infoText}>Inicia la conversación. ¡Escribe el primer mensaje! 👋</p>
                                    ) : (
                                        mensajes.map(msg => {
                                            const esMio = msg.from_user_id !== amigoSeleccionado.id;
                                            return (
                                                <div key={msg.id} style={{ ...styles.burbujaWrapper, justifyContent: esMio ? 'flex-end' : 'flex-start' }}>
                                                    <div style={{
                                                        ...styles.burbuja,
                                                        backgroundColor: esMio ? 'var(--primary)' : 'var(--card-bg)',
                                                        color: esMio ? 'white' : 'var(--text-main)',
                                                        borderRadius: esMio ? '16px 16px 4px 16px' : '16px 16px 16px 4px'
                                                    }}>
                                                        <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.4', wordBreak: 'break-word' }}>{msg.content}</p>
                                                        <span style={{ ...styles.burbujaHora, color: esMio ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                                                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '00:00'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <form onSubmit={manejarEnvio} style={styles.inputBar}>
                                    <input 
                                        type="text" 
                                        placeholder="Escribe un mensaje..." 
                                        value={nuevoMensaje} 
                                        onChange={(e) => {
                                            setNuevoMensaje(e.target.value);
                                            if(mensajeGeneral.texto) setMensajeGeneral({tipo: '', texto: ''});
                                        }} 
                                        style={styles.chatInput}
                                    />
                                    <button type="submit" style={styles.btnEnviar}>Enviar</button>
                                </form>
                            </>
                        ) : (
                            <div style={styles.pantallaVacia}>
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                                    <span style={{ fontSize: '60px', display: 'block', marginBottom: '20px' }}>✈️</span>
                                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>ViaVia Chat</h3>
                                    <p style={{ margin: 0, fontSize: '15px' }}>Selecciona un amigo de la lista para organizar tu próxima aventura.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    whatsappContainer: { display: 'flex', width: '100%', height: 'calc(100vh - 120px)', minHeight: '500px', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'var(--shadow)', backgroundColor: 'var(--bg-app)', border: '1px solid #e1e5ee' },
    sidebar: { backgroundColor: 'var(--card-bg)', display: 'flex', flexDirection: 'column' },
    sidebarHeader: { height: '70px', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #e1e5ee', backgroundColor: 'var(--card-bg)' },
    listaContactos: { flex: 1, overflowY: 'auto' },
    noContactos: { padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px' },
    contactoRow: { display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 20px', cursor: 'pointer', transition: 'background-color 0.2s', borderBottom: '1px solid #f0f4f7' },
    contactoName: { margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    contactoStatus: { margin: '4px 0 0 0', fontSize: '13px' },
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f0f4f7' },
    chatHeader: { height: '70px', backgroundColor: 'var(--card-bg)', display: 'flex', alignItems: 'center', gap: '15px', padding: '0 20px', borderBottom: '1px solid #e1e5ee', zIndex: 5 },
    btnVolver: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '0 10px 0 0' },
    messagesContainer: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
    infoText: { textAlign: 'center', backgroundColor: 'var(--card-bg)', padding: '10px 20px', borderRadius: 'var(--radius-btn)', alignSelf: 'center', color: 'var(--text-muted)', fontSize: '14px', boxShadow: 'var(--shadow)' },
    burbujaWrapper: { display: 'flex', width: '100%', marginBottom: '4px' },
    burbuja: { padding: '10px 16px', maxWidth: '85%', minWidth: '80px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' },
    burbujaHora: { fontSize: '11px', alignSelf: 'flex-end', marginTop: '4px', fontWeight: '500' },
    inputBar: { minHeight: '70px', backgroundColor: 'var(--card-bg)', display: 'flex', alignItems: 'center', padding: '10px 15px', gap: '10px', borderTop: '1px solid #e1e5ee', flexWrap: 'wrap' },
    chatInput: { flex: '1 1 150px', padding: '14px 20px', borderRadius: 'var(--radius-btn)', border: '1px solid #e1e5ee', outline: 'none', fontSize: '15px', backgroundColor: 'var(--bg-app)' },
    btnEnviar: { backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '14px 20px', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', transition: '0.2s', flexShrink: 0 },
    pantallaVacia: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f4f7' },
    avatarMini: { width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg-nav)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 },
    badgeMensajes: { backgroundColor: '#ff3b30', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', minWidth: '20px', textAlign: 'center', display: 'inline-block' }
};

export default Chat;