import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

const CrearViaje = () => {
    const navigate = useNavigate();
    
    // Obtenemos la fecha de hoy en formato YYYY-MM-DD para el atributo 'min'
    const hoy = new Date().toISOString().split('T')[0];

    const [datos, setDatos] = useState({
        title: "",
        destination: "",
        start_date: "",
        end_date: "",
        invitados: []
    });

    const [amigos, setAmigos] = useState([]);
    
    // Estado para los mensajes visuales y bloqueo del botón
    const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' });
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        // Comprobación a prueba de balas: nos aseguramos de que haya token válido
        const token = localStorage.getItem('ACCESS_TOKEN');
        
        if (token && token !== 'null' && token !== 'undefined' && token !== '') {
            api.get('/amigos/listado')
                .then(res => setAmigos(res.data))
                .catch(err => {
                    // Si el servidor responde 401, el token guardado ya no sirve. Lo borramos.
                    if (err.response && err.response.status === 401) {
                        localStorage.removeItem('ACCESS_TOKEN');
                    }
                    console.error("Error cargando amigos", err);
                });
        }
    }, []);

    const handleChange = (e) => {
        setDatos({
            ...datos,
            [e.target.name]: e.target.value
        });
        // Limpiamos el mensaje si el usuario empieza a corregir
        if (mensajeGeneral.texto) setMensajeGeneral({ tipo: '', texto: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensajeGeneral({ tipo: '', texto: '' });

        // LÓGICA DE PROTECCIÓN: Si no hay token real, lo mandamos al login de inmediato
        const token = localStorage.getItem('ACCESS_TOKEN');
        if (!token || token === 'null' || token === 'undefined' || token === '') {
            navigate('/login');
            return;
        }

        setCargando(true);

        try {
            await api.post('/trips', datos);
            setMensajeGeneral({ tipo: 'exito', texto: '¡Viaje creado con éxito! Preparando maletas...' });
            
            // Esperamos 1.5 segundos para que el usuario lea el mensaje de éxito antes de cambiar de vista
            setTimeout(() => {
                navigate('/viajes'); 
            }, 1500);

        } catch (error) {
            setCargando(false);
            if (error.response && error.response.status === 422) {
                const errores = error.response.data.errors;
                // Juntamos los errores de forma amigable por si hay más de uno
                const mensaje = Object.values(errores).flat().join(" | ");
                setMensajeGeneral({ tipo: 'error', texto: "Revisa los datos: " + mensaje });
            } else {
                setMensajeGeneral({ tipo: 'error', texto: "Hubo un error al procesar la solicitud. Inténtalo de nuevo." });
            }
        }
    };

    return (
        <section style={styles.container}>
            <h2 style={styles.headerText}>✈️ Planear Nuevo Viaje</h2>
            
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

            <div style={styles.card}>
                <form onSubmit={handleSubmit} style={styles.form}>
                    
                    <div style={styles.campo}>
                        <label style={styles.label}>Nombre del Viaje:</label>
                        <input 
                            type="text" 
                            name="title" 
                            value={datos.title} 
                            onChange={handleChange} 
                            placeholder="Ej: Verano en la playa"
                            required 
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.campo}>
                        <label style={styles.label}>¿A dónde vais?</label>
                        <input 
                            type="text" 
                            name="destination" 
                            value={datos.destination} 
                            onChange={handleChange} 
                            placeholder="Ciudad o País"
                            required 
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.datesContainer}>
                        <div style={styles.campoMitad}>
                            <label style={styles.label}>Salida:</label>
                            <input 
                                type="date" 
                                name="start_date" 
                                min={hoy}
                                value={datos.start_date}
                                onChange={handleChange} 
                                required 
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.campoMitad}>
                            <label style={styles.label}>Regreso:</label>
                            <input 
                                type="date" 
                                name="end_date" 
                                min={datos.start_date || hoy}
                                value={datos.end_date}
                                onChange={handleChange} 
                                required 
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div style={styles.campo}>
                        <label style={styles.label}>Invitar amigos (Opcional):</label>
                        <select 
                            multiple 
                            onChange={(e) => {
                                const values = Array.from(e.target.selectedOptions, option => option.value);
                                setDatos({...datos, invitados: values});
                            }}
                            style={styles.select}
                        >
                            {amigos.map(amigo => (
                                <option key={amigo.id} value={amigo.id} style={{ padding: '10px', borderBottom: '1px solid #f0f4f7' }}>
                                    {amigo.name}
                                </option>
                            ))}
                        </select>
                        <small style={styles.hint}>Mantén Ctrl (o Cmd en Mac) para seleccionar varios</small>
                    </div>

                    <button type="submit" style={{ ...styles.btn, opacity: cargando ? 0.7 : 1 }} disabled={cargando}>
                        {cargando ? 'Creando viaje...' : 'Crear Grupo de Viaje'}
                    </button>
                </form>
            </div>
        </section>
    );
};

const styles = {
    container: { maxWidth: '650px', margin: '20px auto 40px', padding: '0 15px', fontFamily: 'var(--sans)', width: '100%', boxSizing: 'border-box' },
    headerText: { textAlign: 'center', marginBottom: '30px', fontSize: 'clamp(24px, 5vw, 32px)', color: 'var(--text-main)', fontWeight: '800', letterSpacing: '-0.5px' },
    card: { backgroundColor: 'var(--card-bg)', padding: 'clamp(20px, 5vw, 40px)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow)', border: '1px solid #e1e5ee' },
    form: { display: 'flex', flexDirection: 'column', gap: '24px' },
    campo: { display: 'flex', flexDirection: 'column', gap: '8px' },
    datesContainer: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
    campoMitad: { display: 'flex', flexDirection: 'column', gap: '8px', flex: '1 1 200px' },
    label: { fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' },
    input: { padding: '14px 16px', borderRadius: '12px', border: '1px solid #e1e5ee', fontSize: '15px', outline: 'none', backgroundColor: '#fff', color: 'var(--text-main)', width: '100%', boxSizing: 'border-box' },
    select: { padding: '5px', borderRadius: '12px', border: '1px solid #e1e5ee', fontSize: '15px', outline: 'none', backgroundColor: '#fff', color: 'var(--text-main)', height: '150px', width: '100%', boxSizing: 'border-box' },
    hint: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' },
    btn: { backgroundColor: 'var(--primary)', color: 'white', padding: '16px', border: 'none', borderRadius: 'var(--radius-btn)', fontWeight: '700', fontSize: '16px', cursor: 'pointer', marginTop: '10px', transition: '0.2s', width: '100%' }
};

export default CrearViaje;