import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const Perfil = () => {
    const navigate = useNavigate();
    
    const [usuario, setUsuario] = useState({
        name: '', email: '', bio: '', preferencia: '', transporte: '', avatar_url: null
    });

    const [editando, setEditando] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Estados para los mensajes visuales
    const [errores, setErrores] = useState({});
    const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' }); 

    const fileInputRef = useRef(null);
    const [nuevaFotoFile, setNuevaFotoFile] = useState(null);
    const [previewFoto, setPreviewFoto] = useState(null);

    useEffect(() => {
        cargarPerfil();
    }, []);

    const cargarPerfil = async () => {
        // Buscamos la llave con el nombre correcto de tu app
        const token = localStorage.getItem('ACCESS_TOKEN');
        
        if (!token || token === 'null' || token === 'undefined' || token === '') {
            return;
        }

        try {
            // Ya no hace falta mandar el token a mano, tu Axios lo hace solo
            const res = await api.get('/user/profile');
            
            const dataUser = res.data.user || res.data; 
            
            setUsuario({
                name: dataUser.name || '',
                email: dataUser.email || '',
                bio: dataUser.bio || '',
                preferencia: dataUser.preferencia || 'Playa / Relax',
                transporte: dataUser.transporte || 'Avión',
                avatar_url: dataUser.avatar_url || null
            });
        } catch (error) {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('ACCESS_TOKEN');
            }
            console.error("Error al cargar el perfil", error);
        }
    };

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setNuevaFotoFile(file);
            setPreviewFoto(URL.createObjectURL(file)); 
            setMensajeGeneral({ tipo: '', texto: '' });
        } else {
            setMensajeGeneral({ tipo: 'error', texto: 'Por favor, selecciona un archivo de imagen válido (JPG, PNG).' });
        }
    };

    const validarPerfil = () => {
        const nuevosErrores = {};
        
        if (!usuario.name.trim()) {
            nuevosErrores.name = "El nombre de usuario es obligatorio.";
        } else if (usuario.name.length > 20) {
            nuevosErrores.name = "El nombre no puede superar los 20 caracteres.";
        }
        
        if (localStorage.getItem('ACCESS_TOKEN')) {
            if (!usuario.email.trim()) {
                nuevosErrores.email = "El correo electrónico es obligatorio.";
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.email)) {
                nuevosErrores.email = "El formato del correo no es válido.";
            }
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        setMensajeGeneral({ tipo: '', texto: '' });

        // Comprobamos el ACCESS_TOKEN antes de guardar
        const token = localStorage.getItem('ACCESS_TOKEN');
        if (!token || token === 'null' || token === 'undefined' || token === '') {
            navigate('/login');
            return;
        }

        if (!validarPerfil()) {
            setMensajeGeneral({ tipo: 'error', texto: 'Por favor, revisa los campos marcados en rojo.' });
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', usuario.name);
            formData.append('bio', usuario.bio || '');
            formData.append('preferencia', usuario.preferencia || '');
            formData.append('transporte', usuario.transporte || '');

            if (nuevaFotoFile) {
                formData.append('avatar', nuevaFotoFile);
            }

            // Enviamos los datos sin cabeceras extra, tu Axios se encarga del resto
            const res = await api.post('/user/update', formData);

            const u = res.data.user || res.data;
            setUsuario({
                name: u.name || '',
                email: u.email || '',
                bio: u.bio || '',
                preferencia: u.preferencia || '',
                transporte: u.transporte || '',
                avatar_url: u.avatar_url || null
            });

            setEditando(false);
            setNuevaFotoFile(null);
            setPreviewFoto(null);
            setMensajeGeneral({ tipo: 'exito', texto: '¡Perfil actualizado correctamente!' });

        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('ACCESS_TOKEN');
                navigate('/login');
                return;
            }

            if (err.response?.status === 422) {
                const backendErrors = err.response.data.errors || {};
                const mapeoErrores = {};
                if (backendErrors.name) mapeoErrores.name = backendErrors.name[0];
                setErrores(mapeoErrores);
                setMensajeGeneral({ tipo: 'error', texto: 'Revisa los campos marcados.' });
            } else {
                setMensajeGeneral({ tipo: 'error', texto: 'Ha ocurrido un error al intentar actualizar.' });
            }
        } finally {
            setLoading(false);
        }
    };

    const mostrarAvatar = () => {
        if (previewFoto) return <img src={previewFoto} alt="Previsualización" style={styles.avatarImage} />;
        if (usuario.avatar_url) return <img src={usuario.avatar_url} alt="Avatar de usuario" style={styles.avatarImage} />;
        return usuario.name ? usuario.name.substring(0, 2).toUpperCase() : '👤';
    };

    return (
        <div style={styles.pageBackground}>
            <div style={styles.container}>
                
                <div style={styles.profileHeaderCard}>
                    <div style={styles.avatarContainer}>
                        <div style={styles.avatarCircle} onClick={() => editando && fileInputRef.current.click()}>
                            {mostrarAvatar()}
                            {editando && <div style={styles.editAvatarOverlay}>📷</div>}
                        </div>
                        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFotoChange}/>
                    </div>
                    <div style={styles.headerInfo}>
                        <h2 style={styles.userName}>{usuario.name || 'Viajero Anónimo'}</h2>
                        <p style={styles.userEmail}>📍 {usuario.email || 'Sin correo registrado'}</p>
                        <p style={styles.userBio}>"{usuario.bio || '¡Añade una biografía para que otros viajeros te conozcan!'}"</p>
                    </div>
                </div>

                <div style={styles.detailsSection}>
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h3>⚙️ Ajustes del Perfil</h3>
                            <button 
                                onClick={() => {
                                    setEditando(!editando);
                                    setMensajeGeneral({ tipo: '', texto: '' }); 
                                    if(editando) { 
                                        setPreviewFoto(null); 
                                        setNuevaFotoFile(null); 
                                        setErrores({}); 
                                        cargarPerfil(); 
                                    } 
                                }} 
                                style={editando ? styles.btnCancel : styles.btnEdit}
                                type="button"
                            >
                                {editando ? 'Cancelar' : 'Editar Perfil'}
                            </button>
                        </div>

                        {mensajeGeneral.texto && (
                            <div style={{
                                padding: '12px',
                                marginBottom: '20px',
                                borderRadius: '8px',
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

                        <form onSubmit={handleGuardar} style={styles.form} noValidate>
                            <div style={styles.formGroupTwoColumns}>
                                
                                <div style={styles.inputWrapper}>
                                    <label style={styles.label}>Nombre de usuario</label>
                                    <input 
                                        type="text" 
                                        maxLength={20}
                                        value={usuario.name} 
                                        disabled={!editando} 
                                        onChange={e => {
                                            setUsuario({...usuario, name: e.target.value});
                                            if(errores.name) setErrores({...errores, name: ''}); 
                                            if(mensajeGeneral.texto) setMensajeGeneral({ tipo: '', texto: '' });
                                        }} 
                                        style={{...styles.input, borderColor: errores.name ? '#dc2626' : '#ced4da'}} 
                                    />
                                    {errores.name && <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 'bold' }}>{errores.name}</span>}
                                </div>

                                <div style={styles.inputWrapper}>
                                    <label style={styles.label}>Correo Electrónico</label>
                                    <input 
                                        type="email" 
                                        value={usuario.email} 
                                        disabled={true} 
                                        style={{...styles.input, backgroundColor: '#f5f5f5', cursor: 'not-allowed', borderColor: errores.email ? '#dc2626' : '#ced4da'}} 
                                    />
                                    {errores.email && <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 'bold' }}>{errores.email}</span>}
                                </div>
                            </div>

                            <div style={styles.inputWrapper}>
                                <label style={styles.label}>Tu Biografía Viajera</label>
                                <textarea value={usuario.bio} disabled={!editando} onChange={e => setUsuario({...usuario, bio: e.target.value})} style={{...styles.input, height: '80px', resize: 'none'}} />
                            </div>

                            <h4 style={styles.subSectionTitle}>✈️ Preferencias de Aventura</h4>
                            <div style={styles.formGroupTwoColumns}>
                                <div style={styles.inputWrapper}>
                                    <label style={styles.label}>Ambiente Ideal</label>
                                    <select value={usuario.preferencia} disabled={!editando} onChange={e => setUsuario({...usuario, preferencia: e.target.value})} style={styles.input}>
                                        <option value="Playa / Relax">🌴 Playa y Relax</option>
                                        <option value="Montaña / Aventura">🏔️ Montaña y Senderismo</option>
                                        <option value="Ciudad / Cultura">🏛️ Escapada Cultural Urbana</option>
                                    </select>
                                </div>
                                <div style={styles.inputWrapper}>
                                    <label style={styles.label}>Transporte favorito</label>
                                    <select value={usuario.transporte} disabled={!editando} onChange={e => setUsuario({...usuario, transporte: e.target.value})} style={styles.input}>
                                        <option value="Avión">✈️ Avión</option>
                                        <option value="Coche / Roadtrip">🚗 Coche (Roadtrips)</option>
                                        <option value="Tren">🚄 Tren</option>
                                    </select>
                                </div>
                            </div>

                            {editando && (
                                <button type="submit" disabled={loading} style={styles.btnSave}>
                                    {loading ? 'Guardando...' : '💾 Guardar Cambios'}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageBackground: { backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '30px 15px' },
    container: { maxWidth: '850px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
    profileHeaderCard: { display: 'flex', flexWrap: 'wrap', gap: '25px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', alignItems: 'center', marginBottom: '25px', border: '1px solid #eef2f5' },
    avatarContainer: { flex: '0 0 auto', margin: '0 auto', position: 'relative' },
    avatarCircle: { width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(58,123,213,0.3)', cursor: 'pointer', overflow: 'hidden', position: 'relative' },
    avatarImage: { width: '100%', height: '100%', objectFit: 'cover' },
    editAvatarOverlay: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', textAlign: 'center', fontSize: '14px', padding: '4px 0', cursor: 'pointer' },
    headerInfo: { flex: '1 1 400px', textAlign: 'left' },
    userName: { fontSize: '26px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 5px 0' },
    userEmail: { fontSize: '14px', color: '#7f8c8d', margin: '0 0 12px 0', fontWeight: '500' },
    userBio: { fontSize: '15px', color: '#555', margin: 0, fontStyle: 'italic', lineHeight: '1.5' },
    detailsSection: { marginTop: '20px' },
    card: { backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', border: '1px solid #eef2f5' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f4f7', paddingBottom: '15px', marginBottom: '20px' },
    btnEdit: { backgroundColor: '#e8f0fe', color: '#1a73e8', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
    btnCancel: { backgroundColor: '#fce8e6', color: '#d93025', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formGroupTwoColumns: { display: 'flex', flexWrap: 'wrap', gap: '15px' },
    inputWrapper: { flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '13px', color: '#555', fontWeight: '600' },
    input: { padding: '12px 14px', borderRadius: '10px', border: '1px solid #ced4da', fontSize: '15px', outline: 'none', backgroundColor: '#fff' },
    subSectionTitle: { fontSize: '16px', fontWeight: '700', color: '#2c3e50', margin: '15px 0 5px 0', borderTop: '1px solid #f0f4f7', paddingTop: '15px' },
    btnSave: { backgroundColor: '#2c3e50', color: 'white', padding: '14px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: '10px' }
};

export default Perfil;