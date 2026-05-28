import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Importamos useNavigate
import api from "../../api/axios"; 

const UnirseViaje = ({ onJoined }) => {
    const navigate = useNavigate(); // Inicializamos navigate
    const [codigo, setCodigo] = useState("");
    
    //Estado para los mensajes y para bloquear el botón mientras carga
    const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' });
    const [cargando, setCargando] = useState(false);

    const handleJoin = async () => {
        setMensajeGeneral({ tipo: '', texto: '' });

        // LÓGICA DE PROTECCIÓN: Comprobamos 'ACCESS_TOKEN' antes de intentar unirse
        if (!localStorage.getItem('ACCESS_TOKEN')) {
            navigate('/login');
            return;
        }

        if (!codigo.trim()) {
            setMensajeGeneral({ tipo: 'error', texto: 'Por favor, introduce un código válido.' });
            return;
        }

        setCargando(true);

        try {
            await api.post('/trips/join', { codigo: codigo });
            
            setMensajeGeneral({ tipo: 'exito', texto: '¡Te has unido al viaje con éxito! ✈️' });
            setCodigo("");
            
            // Damos 1.5 segundos para que el usuario lea el mensaje antes de recargar la lista
            setTimeout(() => {
                if (onJoined) onJoined(); 
            }, 1500);
            
        } catch (err) {
            const mensaje = err.response?.data?.message || "Error al unirse. Verifica el código e inténtalo de nuevo.";
            setMensajeGeneral({ tipo: 'error', texto: mensaje });
        } finally {
            setCargando(false);
        }
    };

    const handleChange = (e) => {
        setCodigo(e.target.value.toUpperCase());
        // Limpiamos el mensaje de error visual si el usuario empieza a escribir de nuevo
        if (mensajeGeneral.texto) setMensajeGeneral({ tipo: '', texto: '' });
    };

    return (
        <div className="join-trip-box" style={styles.container}>
            <h4 style={styles.title}>¿Te han invitado? 🎫</h4>
            <p style={styles.subtitle}>Introduce el código del viaje para unirte al grupo.</p>
            
            {/* BANNER DE MENSAJES INTEGRADO */}
            {mensajeGeneral.texto && (
                <div style={{
                    padding: '10px',
                    marginBottom: '5px',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    backgroundColor: mensajeGeneral.tipo === 'exito' ? '#d1fae5' : '#fee2e2',
                    color: mensajeGeneral.tipo === 'exito' ? '#065f46' : '#dc2626',
                    border: `1px solid ${mensajeGeneral.tipo === 'exito' ? '#34d399' : '#f87171'}`
                }}>
                    {mensajeGeneral.texto}
                </div>
            )}
            
            <div style={styles.inputGroup}>
                <input 
                    type="text" 
                    placeholder="Ej: VIA-1234" 
                    value={codigo}
                    style={styles.input}
                    onChange={handleChange}
                    disabled={cargando}
                />
                <button 
                    onClick={handleJoin}
                    style={{ ...styles.button, opacity: cargando ? 0.7 : 1 }}
                    disabled={cargando}
                >
                    {cargando ? 'Uniéndose...' : 'Unirme'}
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: { 
        padding: '24px', 
        background: '#fff9e6', 
        borderRadius: '12px',
        marginBottom: '25px',
        border: '1px solid #ffeeba',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxSizing: 'border-box',
        width: '100%',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    },
    title: { margin: 0, color: '#856404', fontSize: '18px', fontWeight: '800' },
    subtitle: { margin: 0, fontSize: '14px', color: '#664d03', marginBottom: '4px' },
    
    // flexWrap permite que en pantallas estrechas el botón pase abajo del input
    inputGroup: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    
    // flex: '1 1 200px' hace que el input ocupe el espacio disponible, pero no menos de 200px sin saltar
    input: { 
        padding: '12px 14px', 
        borderRadius: '8px', 
        border: '1px solid #f6c23e',
        flex: '1 1 200px', 
        textTransform: 'uppercase',
        outline: 'none',
        fontSize: '15px',
        color: '#333'
    },
    button: {
        padding: '12px 24px',
        background: '#f6c23e',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '15px',
        flex: '0 0 auto', 
        transition: '0.2s'
    }
};

export default UnirseViaje;