import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const Verificar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const emailUsuario = location.state?.email || ''; 

    const [codigo, setCodigo] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Estado para el banner integrado
    const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' });

    const manejarVerificacion = async (e) => {
        e.preventDefault();
        setMensajeGeneral({ tipo: '', texto: '' });

        if (!emailUsuario) {
            setMensajeGeneral({ tipo: 'error', texto: "Error: No se detectó el correo. Intenta registrarte de nuevo." });
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/verify-email', {
                email: emailUsuario,
                code: codigo
            });

            // Usamos la llave 'ACCESS_TOKEN' que usa tu Axios
            localStorage.setItem('ACCESS_TOKEN', res.data.token);
            
            setMensajeGeneral({ tipo: 'exito', texto: "¡Correo verificado con éxito! Entrando..." });
            
            // Retraso de 1.5s para que el usuario lea el mensaje de éxito antes de redirigir
            setTimeout(() => {
                navigate('/'); 
            }, 1500);

        } catch (err) {
            setMensajeGeneral({ tipo: 'error', texto: err.response?.data?.message || 'Código inválido. Revisa tu bandeja de entrada.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.icon}>📩</div>
                <h2 style={styles.title}>Confirmación de Correo</h2>
                <p style={styles.subtitle}>
                    Introduce los 6 números del código enviado a <br />
                    <b style={{ color: 'var(--text-main)', wordBreak: 'break-all' }}>{emailUsuario}</b>
                </p>

                {/* BANNER DE MENSAJES INTEGRADO */}
                {mensajeGeneral.texto && (
                    <div style={{
                        padding: '14px',
                        marginBottom: '20px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        backgroundColor: mensajeGeneral.tipo === 'exito' ? '#d1fae5' : '#fee2e2',
                        color: mensajeGeneral.tipo === 'exito' ? '#065f46' : '#dc2626',
                        border: `1px solid ${mensajeGeneral.tipo === 'exito' ? '#34d399' : '#f87171'}`,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}>
                        {mensajeGeneral.texto}
                    </div>
                )}

                <form onSubmit={manejarVerificacion} style={styles.form}>
                    <input
                        type="text"
                        maxLength="6"
                        placeholder="000000"
                        value={codigo}
                        onChange={(e) => {
                            setCodigo(e.target.value.replace(/\D/g, ''));
                            if (mensajeGeneral.texto) setMensajeGeneral({ tipo: '', texto: '' });
                        }} 
                        style={styles.input}
                        required
                        disabled={loading || mensajeGeneral.tipo === 'exito'}
                    />

                    <button 
                        type="submit" 
                        style={{ ...styles.button, opacity: (loading || codigo.length < 6) ? 0.7 : 1 }} 
                        disabled={loading || codigo.length < 6 || mensajeGeneral.tipo === 'exito'}
                    >
                        {loading ? 'Comprobando...' : 'Activar Cuenta'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', fontFamily: 'var(--sans)', padding: '20px', boxSizing: 'border-box' },
    card: { backgroundColor: 'var(--card-bg)', padding: 'clamp(25px, 5vw, 40px)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow)', maxWidth: '420px', width: '100%', textAlign: 'center', border: '1px solid #e1e5ee', boxSizing: 'border-box' },
    icon: { fontSize: '50px', marginBottom: '16px' },
    title: { margin: '0 0 12px 0', color: 'var(--text-main)', fontSize: 'clamp(20px, 5vw, 24px)', fontWeight: '800', letterSpacing: '-0.5px' },
    subtitle: { color: 'var(--text-muted)', fontSize: '15px', marginBottom: '25px', lineHeight: '1.5' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    input: { padding: '16px', fontSize: 'clamp(24px, 6vw, 32px)', letterSpacing: 'clamp(6px, 3vw, 16px)', textAlign: 'center', borderRadius: '12px', border: '2px solid #e1e5ee', outline: 'none', fontWeight: '800', color: 'var(--text-main)', backgroundColor: 'var(--bg-app)', width: '100%', boxSizing: 'border-box' },
    button: { padding: '16px', fontSize: '16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', transition: '0.2s', width: '100%' }
};

export default Verificar;