import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const GestionViaje = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tab, setTab] = useState('finanzas');
    const [subTabFinanzas, setSubTabFinanzas] = useState('gastos');
    const [viaje, setViaje] = useState(null);
    const [loading, setLoading] = useState(true);

    const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' });

    const [gastos, setGastos] = useState([]);
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [pagadorId, setPagadorId] = useState('');
    const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]);

    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');

    const [planes, setPlanes] = useState([]);
    const [dia, setDia] = useState('');

    useEffect(() => {
        cargarDatosDeViaje();
    }, [id]);

    const cargarDatosDeViaje = async () => {
        const token = localStorage.getItem('ACCESS_TOKEN');
        
        if (!token || token === 'null' || token === 'undefined' || token === '') {
            setViaje({ 
                title: 'Escapada de Ejemplo (Modo Vista)', 
                destination: 'Destino de prueba', 
                participantes: [{id: 1, name: 'Viajero Anónimo'}] 
            });
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const resV = await api.get(`/trips/${id}`);
            const datosViaje = resV.data;
            
            if (!datosViaje.participantes || datosViaje.participantes.length === 0) {
                datosViaje.participantes = [{ id: 1, name: 'juanma' }];
            }
            
            setViaje(datosViaje);
            if (datosViaje.participantes.length > 0) {
                setPagadorId(datosViaje.participantes[0].id);
                setParticipantesSeleccionados(datosViaje.participantes.map(p => p.id));
            }

            try {
                const resG = await api.get(`/trips/${id}/expenses`);
                setGastos(resG.data || []);
            } catch (errG) {
                setGastos([]);
            }

            try { 
                const resA = await api.get(`/trips/${id}/activities`); 
                setPlanes(resA.data || []); 
            } catch (e) {}
            
            try { 
                const resM = await api.get(`/trips/${id}/messages`); 
                setMensajes(resM.data || []); 
            } catch (e) {}

            setLoading(false);
        } catch (err) {
            if (err.response && err.response.status === 401) {
                localStorage.removeItem('ACCESS_TOKEN');
                navigate('/login');
                return;
            }
            console.error("Error crítico cargando el viaje:", err);
            setMensajeGeneral({ tipo: 'error', texto: 'Error al cargar los datos del viaje.' });
            setLoading(false);
        }
    };

    const listaParticipantes = viaje?.participantes || [{ id: 1, name: 'juanma' }];

    const toggleParticipante = (pId) => {
        // ✅ Corregido: era 'id !== pId' en vez de 'id => id !== pId'
        if (participantesSeleccionados.includes(pId)) {
            setParticipantesSeleccionados(participantesSeleccionados.filter(id => id !== pId));
        } else {
            setParticipantesSeleccionados([...participantesSeleccionados, pId]);
        }
    };

    const toggleTodos = () => {
        if (participantesSeleccionados.length === listaParticipantes.length) {
            setParticipantesSeleccionados([]);
        } else {
            setParticipantesSeleccionados(listaParticipantes.map(p => p.id));
        }
    };

    const totalGastado = gastos.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const numeroDePersonas = listaParticipantes.length || 1;
    const gastoPorPersona = totalGastado / numeroDePersonas;

    // ✅ calcularSaldos corregido para usar participantes por gasto
    const calcularSaldos = () => {
        let saldos = {};
        listaParticipantes.forEach(p => saldos[p.name] = 0);

        gastos.forEach(g => {
            const participantesGasto = g.participantes && g.participantes.length > 0
                ? g.participantes
                : listaParticipantes.map(p => p.id);

            const numParticipantes = participantesGasto.length;
            if (numParticipantes === 0) return;

            const partePorPersona = parseFloat(g.amount) / numParticipantes;

            // El pagador suma lo que pagó
            const pagador = listaParticipantes.find(p => p.id === g.pagador_id);
            if (pagador && saldos[pagador.name] !== undefined) {
                saldos[pagador.name] += parseFloat(g.amount);
            }

            // Cada participante resta su parte
            participantesGasto.forEach(participanteId => {
                const participante = listaParticipantes.find(p => p.id === participanteId);
                if (participante && saldos[participante.name] !== undefined) {
                    saldos[participante.name] -= partePorPersona;
                }
            });
        });

        return saldos;
    };

    const calcularTransferencias = () => {
        const saldos = { ...calcularSaldos() };
        let deudores = [];
        let acreedores = [];

        Object.keys(saldos).forEach(persona => {
            if (saldos[persona] < -0.01) deudores.push({ name: persona, monto: -saldos[persona] });
            else if (saldos[persona] > 0.01) acreedores.push({ name: persona, monto: saldos[persona] });
        });

        let transferencias = [];
        let i = 0, j = 0;

        while (i < deudores.length && j < acreedores.length) {
            let deudor = deudores[i];
            let acreedor = acreedores[j];
            let montoMinimo = Math.min(deudor.monto, acreedor.monto);

            transferencias.push({ de: deudor.name, a: acreedor.name, cantidad: montoMinimo });

            deudor.monto -= montoMinimo;
            acreedor.monto -= montoMinimo;

            if (deudor.monto < 0.01) i++;
            if (acreedor.monto < 0.01) j++;
        }
        return transferencias;
    };

    const añadirGasto = async (e) => {
        e.preventDefault();
        setMensajeGeneral({ tipo: '', texto: '' });

        if (!localStorage.getItem('ACCESS_TOKEN')) {
            navigate('/login');
            return;
        }

        if (participantesSeleccionados.length === 0) {
            setMensajeGeneral({ tipo: 'error', texto: 'Debes seleccionar al menos un participante.' });
            return;
        }

        try {
            await api.post(`/trips/${id}/expenses`, {
                description: descripcion,
                amount: parseFloat(monto),
                user_id: parseInt(pagadorId),
                participantes: participantesSeleccionados
            });
            cargarDatosDeViaje();
            setDescripcion('');
            setMonto('');
            setMensajeGeneral({ tipo: 'exito', texto: '¡Gasto registrado correctamente!' });
        } catch (error) {
            setMensajeGeneral({ tipo: 'error', texto: 'Error al guardar el gasto.' });
        }
    };

    const enviarMensajeChat = async (e) => {
        e.preventDefault();
        setMensajeGeneral({ tipo: '', texto: '' });
        
        if (!localStorage.getItem('ACCESS_TOKEN')) {
            navigate('/login');
            return;
        }
        
        if (!nuevoMensaje.trim()) return;
        
        try {
            const res = await api.post(`/trips/${id}/messages`, { message: nuevoMensaje });
            setMensajes([...mensajes, res.data]);
            setNuevoMensaje('');
        } catch (err) {
            setMensajeGeneral({ tipo: 'error', texto: 'No se pudo enviar el mensaje.' });
        }
    };

    const añadirActividad = async (e) => {
        e.preventDefault();
        setMensajeGeneral({ tipo: '', texto: '' });

        if (!localStorage.getItem('ACCESS_TOKEN')) {
            navigate('/login');
            return;
        }

        const tituloAct = e.target.elements.tituloAct.value;
        const horaAct = e.target.elements.horaAct.value; 
        const fechaCompleta = `${dia} ${horaAct}:00`;

        try {
            const res = await api.post(`/trips/${id}/activities`, {
                title: tituloAct,
                description: 'Actividad programada',
                scheduled_at: fechaCompleta
            });
            setPlanes([...planes, res.data]);
            e.target.reset();
            setDia(''); 
            setMensajeGeneral({ tipo: 'exito', texto: '¡Actividad añadida al itinerario!' });
        } catch (error) {
            setMensajeGeneral({ tipo: 'error', texto: 'Error al guardar la actividad.' });
        }
    };

    const cambiarTab = (nuevoTab) => {
        setTab(nuevoTab);
        setMensajeGeneral({ tipo: '', texto: '' });
    };

    if (loading) return <div style={styles.loading}>Sincronizando la escapada con el servidor...</div>;
    if (!viaje) return <div style={styles.loading}>El viaje no pudo ser procesado.</div>;

    const saldosCalculados = calcularSaldos();
    const transferenciasCalculadas = calcularTransferencias();

    return (
        <div style={styles.container}>
            <div style={styles.hero}>
                <span style={styles.badge}>📍 {viaje.destination}</span>
                <h1 style={styles.title}>{viaje.title}</h1>
                <p style={styles.dates}>Fondo total: <strong style={{ color: 'var(--primary)' }}>{totalGastado.toFixed(2)}€</strong></p>
            </div>

            <div style={styles.tabBar}>
                <button style={tab === 'finanzas' ? styles.tabActive : styles.tab} onClick={() => cambiarTab('finanzas')}>💰 Gastos Compartidos</button>
                <button style={tab === 'itinerario' ? styles.tabActive : styles.tab} onClick={() => cambiarTab('itinerario')}>🗓️ Itinerario</button>
                <button style={tab === 'chat' ? styles.tabActive : styles.tab} onClick={() => cambiarTab('chat')}>💬 Chat</button>
            </div>

            {mensajeGeneral.texto && (
                <div style={{
                    padding: '14px', marginBottom: '25px', borderRadius: '8px', textAlign: 'center',
                    fontWeight: 'bold', fontSize: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    backgroundColor: mensajeGeneral.tipo === 'exito' ? '#d1fae5' : '#fee2e2',
                    color: mensajeGeneral.tipo === 'exito' ? '#065f46' : '#dc2626',
                    border: `1px solid ${mensajeGeneral.tipo === 'exito' ? '#34d399' : '#f87171'}`
                }}>
                    {mensajeGeneral.texto}
                </div>
            )}

            <div style={styles.contentSection}>
                
                {tab === 'finanzas' && (
                    <div>
                        <div style={styles.subTabBar}>
                            <button style={subTabFinanzas === 'gastos' ? styles.subTabActive : styles.subTab} onClick={() => {setSubTabFinanzas('gastos'); setMensajeGeneral({tipo:'', texto:''});}}>📝 Lista de Gastos</button>
                            <button style={subTabFinanzas === 'saldos' ? styles.subTabActive : styles.subTab} onClick={() => {setSubTabFinanzas('saldos'); setMensajeGeneral({tipo:'', texto:''});}}>📊 Balances</button>
                            <button style={subTabFinanzas === 'transferencias' ? styles.subTabActive : styles.subTab} onClick={() => {setSubTabFinanzas('transferencias'); setMensajeGeneral({tipo:'', texto:''});}}>🤝 Bizums Necesarios</button>
                        </div>

                        {subTabFinanzas === 'gastos' && (
                            <div style={styles.gridTwoColumns}>
                                <div style={styles.card}>
                                    <h3 style={styles.cardTitle}>➕ Registrar Gasto</h3>
                                    <form onSubmit={añadirGasto} style={styles.form}>
                                        <input type="text" placeholder="¿En qué se gastó el dinero?" value={descripcion} onChange={e => setDescripcion(e.target.value)} required style={styles.input} />
                                        <input type="number" step="0.01" placeholder="Monto total (€)" value={monto} onChange={e => setMonto(e.target.value)} required style={styles.input} />
                                        
                                        <label style={styles.label}>¿Quién pagó?</label>
                                        <select value={pagadorId} onChange={e => setPagadorId(e.target.value)} style={styles.input}>
                                            {listaParticipantes.map(p => (
                                                <option key={p.id} value={p.id}>Pagó: {p.name}</option>
                                            ))}
                                        </select>
                                        
                                        <label style={styles.label}>¿Quiénes participan?</label>
                                        <div style={styles.checkboxContainer}>
                                            <label style={styles.checkboxLabel}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={participantesSeleccionados.length === listaParticipantes.length} 
                                                    onChange={toggleTodos} 
                                                />
                                                <strong>Todos los miembros</strong>
                                            </label>
                                            {listaParticipantes.map(p => (
                                                <label key={p.id} style={styles.checkboxLabel}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={participantesSeleccionados.includes(p.id)} 
                                                        onChange={() => toggleParticipante(p.id)} 
                                                    />
                                                    {p.name}
                                                </label>
                                            ))}
                                        </div>

                                        <button type="submit" style={styles.btnPrimary}>Guardar Registro</button>
                                    </form>
                                </div>
                                <div style={styles.card}>
                                    <h3 style={styles.cardTitle}>📋 Historial de Cuentas</h3>
                                    {gastos.length === 0 ? <p style={styles.noData}>No hay gastos registrados.</p> : (
                                        <ul style={styles.list}>
                                            {gastos.map(g => (
                                                <li key={g.id} style={styles.listItem}>
                                                    <div>
                                                        <strong style={{ color: 'var(--text-main)', wordBreak: 'break-word' }}>{g.descripcion || g.description}</strong>
                                                        <small style={styles.blockTime}>Abonado por: <b>{g.pagador_name || 'Usuario'}</b></small>
                                                        {/* ✅ Mostramos cuántos participaron */}
                                                        {g.participantes && <small style={styles.blockTime}>Participantes: <b>{g.participantes.length}</b></small>}
                                                    </div>
                                                    <span style={styles.amountText}>{parseFloat(g.amount || g.monto).toFixed(2)}€</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}

                        {subTabFinanzas === 'saldos' && (
                            <div style={{...styles.card, maxWidth: '600px', margin: '0 auto'}}>
                                <h3 style={styles.cardTitle}>📊 Estado de Balances</h3>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px'}}>
                                    {Object.keys(saldosCalculados).map(persona => {
                                        const saldo = saldosCalculados[persona];
                                        const esPositivo = saldo >= 0;
                                        return (
                                            <div key={persona} style={{...styles.balanceRow, borderLeft: `4px solid ${esPositivo ? '#00a651' : '#e13c3c'}`}}>
                                                <span style={{ color: 'var(--text-main)' }}>👤 <b>{persona}</b></span>
                                                <span style={{fontWeight: '700', color: esPositivo ? '#00a651' : '#e13c3c', textAlign: 'right'}}>
                                                    {esPositivo ? `Le deben: +${saldo.toFixed(2)}€` : `Debe: ${Math.abs(saldo).toFixed(2)}€`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {subTabFinanzas === 'transferencias' && (
                            <div style={{...styles.card, maxWidth: '600px', margin: '0 auto'}}>
                                <h3 style={styles.cardTitle}>🤝 Bizums sugeridos</h3>
                                {transferenciasCalculadas.length === 0 ? (
                                    <p style={{...styles.noData, color: '#00a651', fontWeight: '700'}}>🎉 ¡Cuentas claras! Nadie le debe a nadie.</p>
                                ) : (
                                    <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                        {transferenciasCalculadas.map((t, idx) => (
                                            <div key={idx} style={styles.transferCard}>
                                                📱 <b>{t.de}</b> debe enviarle un Bizum a <b>{t.a}</b> de <span style={{fontWeight:'800', color:'var(--primary)'}}>{t.cantidad.toFixed(2)}€</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'itinerario' && (
                    <div style={styles.gridTwoColumns}>
                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>➕ Programar Plan</h3>
                            <form onSubmit={añadirActividad} style={styles.form}>
                                <input type="text" name="tituloAct" placeholder="Ej: Cena en el centro..." required style={styles.input} />
                                <label style={styles.label}>Día de la actividad</label>
                                <input type="date" value={dia} onChange={(e) => setDia(e.target.value)} required style={styles.input} />
                                <label style={styles.label}>Hora programada</label>
                                <input type="time" name="horaAct" required style={styles.input} />
                                <button type="submit" style={styles.btnPrimary}>Añadir al Cronograma</button>
                            </form>
                        </div>
                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>⏱️ Agenda de Actividades</h3>
                            {planes.length === 0 ? (
                                <p style={styles.noData}>Aún no hay actividades planificadas.</p>
                            ) : (
                                <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px'}}>
                                    {planes.map(p => (
                                        <div key={p.id} style={{...styles.balanceRow, borderLeft: '4px solid var(--primary)'}}>
                                            <span style={{ color: 'var(--text-main)' }}>⏰ <b>{p.hora || (p.scheduled_at ? p.scheduled_at.substring(11, 16) : '00:00')} h</b> - {p.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'chat' && (
                    <div style={{...styles.card, maxWidth: '700px', margin: '0 auto'}}>
                        <h3 style={styles.cardTitle}>💬 Chat de la Escapada</h3>
                        <div style={styles.chatBox}>
                            {mensajes.length === 0 ? <p style={styles.noData}>¡Escribe el primer mensaje!</p> : (
                                mensajes.map(msg => (
                                    <div key={msg.id} style={styles.chatBubble}>
                                        <small style={styles.chatUser}>{msg.user_name || 'Amigo'}</small>
                                        <div style={{ color: 'var(--text-main)', wordBreak: 'break-word' }}>{msg.message}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <form onSubmit={enviarMensajeChat} style={styles.chatForm}>
                            <input type="text" placeholder="Escribe un mensaje..." value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)} style={{...styles.input, flex: '1 1 200px'}} />
                            <button type="submit" style={{...styles.btnPrimary, flex: '0 0 auto', padding: '14px 24px', marginTop: 0}}>Enviar</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { maxWidth: '1100px', margin: '0 auto', padding: '20px 15px', fontFamily: 'var(--sans)', width: '100%', boxSizing: 'border-box' },
    loading: { textAlign: 'center', padding: '50px', color: 'var(--text-muted)', fontSize: '16px', fontWeight: '600' },
    hero: { backgroundColor: 'var(--bg-nav)', borderRadius: 'var(--radius-card)', color: 'white', padding: '40px 20px', textAlign: 'center', marginBottom: '30px', boxShadow: 'var(--shadow)', wordBreak: 'break-word' },
    title: { fontSize: 'clamp(24px, 5vw, 32px)', margin: '15px 0 10px', fontWeight: '800', letterSpacing: '-0.5px' },
    badge: { backgroundColor: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 'var(--radius-btn)', fontSize: '13px', fontWeight: '600' },
    dates: { fontSize: '16px', color: 'rgba(255,255,255,0.8)', margin: 0 },
    tabBar: { display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px', flexWrap: 'wrap' },
    tab: { flex: '1 1 auto', minWidth: '140px', padding: '12px 20px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', transition: '0.2s', fontSize: '15px' },
    tabActive: { flex: '1 1 auto', minWidth: '140px', padding: '12px 20px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,98,227,0.3)', fontSize: '15px' },
    subTabBar: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '30px', backgroundColor: '#e1e5ee', padding: '6px', borderRadius: 'var(--radius-btn)', maxWidth: '600px', margin: '0 auto 30px' },
    subTab: { flex: '1 1 120px', padding: '10px', border: 'none', background: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', borderRadius: 'var(--radius-btn)', color: 'var(--text-muted)', textAlign: 'center', transition: '0.2s' },
    subTabActive: { flex: '1 1 120px', padding: '10px', border: 'none', backgroundColor: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', borderRadius: 'var(--radius-btn)', color: 'var(--primary)', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
    gridTwoColumns: { display: 'flex', flexWrap: 'wrap', gap: '24px' },
    card: { flex: '1 1 280px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-card)', padding: 'clamp(15px, 4vw, 30px)', boxShadow: 'var(--shadow)', border: '1px solid #e1e5ee', boxSizing: 'border-box' },
    cardTitle: { fontSize: '18px', marginBottom: '20px', fontWeight: '800', color: 'var(--text-main)', marginTop: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    input: { padding: '14px 16px', borderRadius: '12px', border: '1px solid #e1e5ee', fontSize: '15px', outline: 'none', backgroundColor: '#fff', color: 'var(--text-main)', width: '100%', boxSizing: 'border-box' },
    label: { fontSize: '13px', color: 'var(--text-muted)', marginBottom: '-8px', fontWeight: '600', marginTop: '4px' },
    btnPrimary: { backgroundColor: 'var(--primary)', color: 'white', padding: '16px', border: 'none', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', textAlign: 'center', marginTop: '10px', fontSize: '15px', transition: '0.2s', width: '100%' },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #e1e5ee', alignItems: 'center', gap: '10px' },
    amountText: { fontWeight: '800', color: 'var(--primary)', fontSize: '16px', flexShrink: 0 },
    blockTime: { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
    balanceRow: { display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: '12px', fontSize: '15px', alignItems: 'center', gap: '10px' },
    transferCard: { padding: '16px', backgroundColor: 'rgba(0, 98, 227, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--primary)', fontSize: '15px', color: 'var(--text-main)' },
    noData: { textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '15px', fontStyle: 'italic' },
    contentSection: { width: '100%' },
    chatBox: { height: '400px', overflowY: 'auto', border: '1px solid #e1e5ee', padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '12px' },
    chatBubble: { padding: '12px 16px', backgroundColor: 'white', borderRadius: '16px 16px 16px 4px', alignSelf: 'flex-start', maxWidth: '85%', boxShadow: '0 2px 5px rgba(0,0,0,0.04)', fontSize: '15px' },
    chatUser: { display: 'block', fontWeight: '700', color: 'var(--primary)', fontSize: '12px', marginBottom: '4px' },
    chatForm: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' },
    checkboxContainer: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', backgroundColor: 'var(--bg-app)', borderRadius: '12px', border: '1px solid #e1e5ee' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14.5px', color: 'var(--text-main)', cursor: 'pointer', wordBreak: 'break-word' }
};

export default GestionViaje;