import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const GestionViaje = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tab, setTab] = useState('finanzas');
    const [subTabFinanzas, setSubTabFinanzas] = useState('gastos');
    const [subTabItinerario, setSubTabItinerario] = useState('actividades');

    const [viaje, setViaje] = useState(null);
    const [loading, setLoading] = useState(true);
    const [miRol, setMiRol] = useState(null);
    const [mensajeGeneral, setMensajeGeneral] = useState({ tipo: '', texto: '' });
    const [dialogoConfirmacion, setDialogoConfirmacion] = useState({ visible: false, mensaje: '', accionConfirmada: null });

    // ✅ Estados del modal de Pagos
    const [modalBizum, setModalBizum] = useState(null);
    const [pasoModal, setPasoModal] = useState(1);
    const [datosBizum, setDatosBizum] = useState({ telefono: '', concepto: '' });
    const [metodoPago, setMetodoPago] = useState('bizum');
    
    // ✅ Estados para las Tarjetas
    const [tarjetasGuardadas, setTarjetasGuardadas] = useState([]);
    const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(null);
    const [guardandoTarjeta, setGuardandoTarjeta] = useState(false);
    const [datosTarjeta, setDatosTarjeta] = useState({ card_holder: '', card_number: '', card_expiry: '', card_cvv: '', card_type: 'visa' });

    const [gastos, setGastos] = useState([]);
    const [planes, setPlanes] = useState([]);
    const [hoteles, setHoteles] = useState([]);
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [pagadorId, setPagadorId] = useState('');
    const [participantesSeleccionados, setParticipantesSeleccionados] = useState([]);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [dia, setDia] = useState('');
    const [editandoViaje, setEditandoViaje] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({ title: '', destination: '', start_date: '', end_date: '' });

    useEffect(() => { cargarDatosDeViaje(); }, [id]);

    const cargarDatosDeViaje = async () => {
        const token = localStorage.getItem('ACCESS_TOKEN');
        if (!token) { navigate('/login'); return; }

        try {
            setLoading(true);
            const [resV, resRol] = await Promise.all([
                api.get(`/trips/${id}`),
                api.get(`/trips/${id}/mi-rol`)
            ]);

            const datosViaje = resV.data;
            setViaje(datosViaje);
            setMiRol(resRol.data.rol);
            setDatosEdicion({
                title: datosViaje.title || '',
                destination: datosViaje.destination || '',
                start_date: datosViaje.start_date || '',
                end_date: datosViaje.end_date || ''
            });

            if (datosViaje.participantes?.length > 0) {
                setPagadorId(datosViaje.participantes[0].id);
                setParticipantesSeleccionados(datosViaje.participantes.map(p => p.id));
            }

            api.get(`/trips/${id}/expenses`).then(res => setGastos(res.data || [])).catch(() => {});
            api.get(`/trips/${id}/activities`).then(res => setPlanes(res.data || [])).catch(() => {});
            api.get(`/trips/${id}/hotels`).then(res => setHoteles(res.data || [])).catch(() => {});
            api.get(`/trips/${id}/messages`).then(res => setMensajes(res.data || [])).catch(() => {});

            setLoading(false);
        } catch (err) {
            setMensajeGeneral({ tipo: 'error', texto: 'Error al cargar los datos del viaje.' });
            setLoading(false);
        }
    };

    const listaParticipantes = viaje?.participantes || [];

    const toggleParticipante = (pId) => {
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

    const calcularSaldos = () => {
        let saldos = {};
        listaParticipantes.forEach(p => saldos[p.name] = 0);
        gastos.forEach(g => {
            const participantesGasto = g.participantes?.length > 0 ? g.participantes : listaParticipantes.map(p => p.id);
            const numParticipantes = participantesGasto.length;
            if (numParticipantes === 0) return;
            const partePorPersona = parseFloat(g.amount) / numParticipantes;
            const pagador = listaParticipantes.find(p => p.id === g.pagador_id);
            if (pagador && saldos[pagador.name] !== undefined) saldos[pagador.name] += parseFloat(g.amount);
            participantesGasto.forEach(participanteId => {
                const participante = listaParticipantes.find(p => p.id === participanteId);
                if (participante && saldos[participante.name] !== undefined) saldos[participante.name] -= partePorPersona;
            });
        });
        return saldos;
    };

    const calcularTransferencias = () => {
        const saldos = { ...calcularSaldos() };
        let deudores = [], acreedores = [];
        Object.keys(saldos).forEach(persona => {
            if (saldos[persona] < -0.01) deudores.push({ name: persona, monto: -saldos[persona] });
            else if (saldos[persona] > 0.01) acreedores.push({ name: persona, monto: saldos[persona] });
        });
        let transferencias = [], i = 0, j = 0;
        while (i < deudores.length && j < acreedores.length) {
            let deudor = deudores[i], acreedor = acreedores[j];
            let montoMinimo = Math.min(deudor.monto, acreedor.monto);
            transferencias.push({ de: deudor.name, a: acreedor.name, cantidad: montoMinimo });
            deudor.monto -= montoMinimo; acreedor.monto -= montoMinimo;
            if (deudor.monto < 0.01) i++;
            if (acreedor.monto < 0.01) j++;
        }
        return transferencias;
    };

    const añadirGasto = async (e) => {
        e.preventDefault();
        setMensajeGeneral({ tipo: '', texto: '' });
        if (participantesSeleccionados.length === 0) { setMensajeGeneral({ tipo: 'error', texto: 'Selecciona al menos un participante.' }); return; }
        try {
            await api.post(`/trips/${id}/expenses`, { description: descripcion, amount: parseFloat(monto), user_id: parseInt(pagadorId), participantes: participantesSeleccionados });
            cargarDatosDeViaje(); setDescripcion(''); setMonto('');
            setMensajeGeneral({ tipo: 'exito', texto: '¡Gasto registrado!' });
        } catch (error) { setMensajeGeneral({ tipo: 'error', texto: 'Error al guardar el gasto.' }); }
    };

    const enviarMensajeChat = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim()) return;
        try {
            const res = await api.post(`/trips/${id}/messages`, { message: nuevoMensaje });
            setMensajes([...mensajes, res.data]); setNuevoMensaje('');
        } catch (err) { setMensajeGeneral({ tipo: 'error', texto: 'No se pudo enviar el mensaje.' }); }
    };

    const añadirActividad = async (e) => {
        e.preventDefault();
        const tituloAct = e.target.elements.tituloAct.value;
        const horaAct = e.target.elements.horaAct.value;
        try {
            const res = await api.post(`/trips/${id}/activities`, { title: tituloAct, description: 'Actividad programada', scheduled_at: `${dia} ${horaAct}:00` });
            setPlanes([...planes, res.data]); e.target.reset(); setDia('');
            setMensajeGeneral({ tipo: 'exito', texto: '¡Actividad añadida!' });
        } catch (error) { setMensajeGeneral({ tipo: 'error', texto: 'Error al guardar la actividad.' }); }
    };

    const registrarHotel = async (e) => {
        e.preventDefault();
        setMensajeGeneral({ tipo: '', texto: '' });
        const form = e.target.elements;
        try {
            const res = await api.post(`/trips/${id}/hotels`, { name: form.hotelNombre.value, address: form.hotelDireccion.value, booking_url: form.hotelUrl.value, check_in: form.hotelIn.value, check_out: form.hotelOut.value });
            setHoteles([...hoteles, res.data]); e.target.reset();
            setMensajeGeneral({ tipo: 'exito', texto: '¡Alojamiento registrado!' });
        } catch (error) { setMensajeGeneral({ tipo: 'error', texto: 'Error al guardar el alojamiento.' }); }
    };

    const expulsarMiembro = (userId, userName) => {
        setDialogoConfirmacion({ visible: true, mensaje: `¿Seguro que quieres expulsar a ${userName}?`, accionConfirmada: async () => {
            try { await api.post(`/trips/${id}/expulsar/${userId}`); setMensajeGeneral({ tipo: 'exito', texto: `${userName} ha sido expulsado.` }); cargarDatosDeViaje(); }
            catch (err) { setMensajeGeneral({ tipo: 'error', texto: err.response?.data?.message || 'Error al expulsar.' }); }
        }});
    };

    const transferirRol = (userId, userName) => {
        setDialogoConfirmacion({ visible: true, mensaje: `¿Transferir el rol de organizador a ${userName}?`, accionConfirmada: async () => {
            try { await api.post(`/trips/${id}/transferir-rol/${userId}`); setMensajeGeneral({ tipo: 'exito', texto: `Rol transferido a ${userName}.` }); cargarDatosDeViaje(); }
            catch (err) { setMensajeGeneral({ tipo: 'error', texto: err.response?.data?.message || 'Error al transferir rol.' }); }
        }});
    };

    const abandonarViaje = () => {
        setDialogoConfirmacion({ visible: true, mensaje: '¿Seguro que quieres abandonar este viaje?', accionConfirmada: async () => {
            try { await api.post(`/trips/${id}/abandonar`); navigate('/viajes'); }
            catch (err) { setMensajeGeneral({ tipo: 'error', texto: err.response?.data?.message || 'Error al abandonar.' }); }
        }});
    };

    const borrarViaje = () => {
        setDialogoConfirmacion({ visible: true, mensaje: '¿Seguro que quieres BORRAR este viaje? Acción irreversible.', accionConfirmada: async () => {
            try { await api.delete(`/trips/${id}`); navigate('/viajes'); }
            catch (err) { setMensajeGeneral({ tipo: 'error', texto: err.response?.data?.message || 'Error al borrar.' }); }
        }});
    };

    const guardarEdicion = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/trips/${id}/editar`, datosEdicion);
            setMensajeGeneral({ tipo: 'exito', texto: 'Viaje actualizado correctamente.' });
            setEditandoViaje(false); cargarDatosDeViaje();
        } catch (err) { setMensajeGeneral({ tipo: 'error', texto: 'Error al actualizar el viaje.' }); }
    };

    const cargarTarjetas = async () => {
        try {
            const res = await api.get('/user/tarjetas');
            setTarjetasGuardadas(res.data || []);
        } catch (e) {}
    };

    // ✅ FUNCIÓN DE PAGO UNIVERSAL (BIZUM Y TARJETA)
    // ✅ FUNCIÓN DE PAGO UNIVERSAL CORREGIDA
    const procesarPago = async (e) => {
        e.preventDefault();
        
        // 1. Pasamos a la pantalla de "Procesando"
        setPasoModal(3);
        
        // 2. Si es tarjeta nueva y quiere guardarla
        if (metodoPago === 'tarjeta' && guardandoTarjeta && datosTarjeta.card_number.length >= 4) {
            try {
                await api.post('/user/tarjetas', {
                    card_holder: datosTarjeta.card_holder,
                    card_number_last4: datosTarjeta.card_number.slice(-4),
                    card_expiry: datosTarjeta.card_expiry,
                    card_type: datosTarjeta.card_type
                });
            } catch (e) {}
        }

        // 3. REGISTRAR EL PAGO EN LA BASE DE DATOS PARA CANCELAR LA DEUDA
        try {
            // Buscamos los IDs de los usuarios implicados usando la lista de participantes
            const deudor = listaParticipantes.find(p => p.name === modalBizum.de);
            const acreedor = listaParticipantes.find(p => p.name === modalBizum.a);

            if (deudor && acreedor) {
                // Creamos un "gasto especial" que equilibra los saldos
                await api.post(`/trips/${id}/expenses`, {
                    description: `💸 Pago de deuda (${metodoPago === 'bizum' ? 'Bizum' : 'Tarjeta'})`,
                    amount: parseFloat(modalBizum.cantidad),
                    user_id: deudor.id, // El que debía dinero es el que paga este ticket
                    participantes: [acreedor.id] // El acreedor es el único "beneficiado"
                });

                // Recargar los gastos de la base de datos para que los saldos pasen a cero
                const resGastos = await api.get(`/trips/${id}/expenses`);
                setGastos(resGastos.data || []);
            }
        } catch (e) {
            console.error("Error al registrar el pago en la BD", e);
        }

        // 4. Pasado el tiempo de simulación, saltamos a la pantalla de éxito
        setTimeout(() => setPasoModal(4), 2500);
    };

    const eliminarTarjeta = async (cardId) => {
        try {
            await api.delete(`/user/tarjetas/${cardId}`);
            setTarjetasGuardadas(tarjetasGuardadas.filter(t => t.id !== cardId));
        } catch (e) {}
    };

    // ✅ FUNCIÓN ÚNICA Y LIMPIA PARA CERRAR EL MODAL DE PAGO
    const cerrarModal = () => {
        setModalBizum(null);
        setPasoModal(1);
        setMetodoPago('bizum');
        setDatosBizum({ telefono: '', concepto: '' });
        setDatosTarjeta({ card_holder: '', card_number: '', card_expiry: '', card_cvv: '', card_type: 'visa' });
        setTarjetaSeleccionada(null);
        setGuardandoTarjeta(false);
    };

    const cambiarTab = (nuevoTab) => { setTab(nuevoTab); setMensajeGeneral({ tipo: '', texto: '' }); };

    if (loading) return <div style={styles.loading}>Sincronizando la escapada...</div>;
    if (!viaje) return <div style={styles.loading}>El viaje no pudo cargarse.</div>;

    const saldosCalculados = calcularSaldos();
    const transferenciasCalculadas = calcularTransferencias();

    return (
        <div style={styles.container}>

            <div style={{
                ...styles.hero,
                backgroundImage: viaje.image_url
                    ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url("${viaje.image_url}")`
                    : `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80")`,
                backgroundSize: 'cover', backgroundPosition: 'center', border: 'none'
            }}>
                <div style={{ marginBottom: '10px' }}>
                    <span style={styles.badge}>📍 {viaje.destination}</span>
                    <span style={{ ...styles.badge, backgroundColor: miRol === 'organizador' ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.15)', marginLeft: '10px' }}>
                        {miRol === 'organizador' ? '👑 Organizador' : '🧳 Viajero'}
                    </span>
                </div>
                <h1 style={{ ...styles.title, color: '#ffffff', textShadow: '0 2px 5px rgba(0,0,0,0.6)' }}>{viaje.title}</h1>
                <p style={styles.dates}>Fondo total: <strong style={{ color: '#66b2ff' }}>{totalGastado.toFixed(2)}€</strong></p>
            </div>

            <div style={styles.tabBar}>
                <button style={tab === 'finanzas' ? styles.tabActive : styles.tab} onClick={() => cambiarTab('finanzas')}>💰 Gastos</button>
                <button style={tab === 'itinerario' ? styles.tabActive : styles.tab} onClick={() => cambiarTab('itinerario')}>🗓️ Itinerario</button>
                <button style={tab === 'chat' ? styles.tabActive : styles.tab} onClick={() => cambiarTab('chat')}>💬 Chat</button>
                <button style={tab === 'miembros' ? styles.tabActive : styles.tab} onClick={() => cambiarTab('miembros')}>👥 Miembros</button>
            </div>

            {mensajeGeneral.texto && (
                <div style={{
                    padding: '14px', marginBottom: '25px', borderRadius: '8px', textAlign: 'center',
                    fontWeight: 'bold', fontSize: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    backgroundColor: mensajeGeneral.tipo === 'exito' ? '#d1fae5' : '#fee2e2',
                    color: mensajeGeneral.tipo === 'exito' ? '#065f46' : '#dc2626',
                    border: `1px solid ${mensajeGeneral.tipo === 'exito' ? '#34d399' : '#f87171'}`
                }}>{mensajeGeneral.texto}</div>
            )}

            <div style={styles.contentSection}>

                {/* FINANZAS */}
                {tab === 'finanzas' && (
                    <div>
                        <div style={styles.subTabBar}>
                            <button style={subTabFinanzas === 'gastos' ? styles.subTabActive : styles.subTab} onClick={() => setSubTabFinanzas('gastos')}>📝 Gastos</button>
                            <button style={subTabFinanzas === 'saldos' ? styles.subTabActive : styles.subTab} onClick={() => setSubTabFinanzas('saldos')}>📊 Balances</button>
                            <button style={subTabFinanzas === 'transferencias' ? styles.subTabActive : styles.subTab} onClick={() => setSubTabFinanzas('transferencias')}>🤝 Bizums</button>
                        </div>

                        {subTabFinanzas === 'gastos' && (
                            <div style={styles.gridTwoColumns}>
                                <div style={styles.card}>
                                    <h3 style={styles.cardTitle}>➕ Registrar Gasto</h3>
                                    <form onSubmit={añadirGasto} style={styles.form}>
                                        <input type="text" placeholder="¿En qué se gastó?" value={descripcion} onChange={e => setDescripcion(e.target.value)} required style={styles.input} />
                                        <input type="number" step="0.01" placeholder="Monto (€)" value={monto} onChange={e => setMonto(e.target.value)} required style={styles.input} />
                                        <label style={styles.label}>¿Quién pagó?</label>
                                        <select value={pagadorId} onChange={e => setPagadorId(e.target.value)} style={styles.input}>
                                            {listaParticipantes.map(p => <option key={p.id} value={p.id}>Pagó: {p.name}</option>)}
                                        </select>
                                        <label style={styles.label}>¿Quiénes participan?</label>
                                        <div style={styles.checkboxContainer}>
                                            <label style={styles.checkboxLabel}>
                                                <input type="checkbox" checked={participantesSeleccionados.length === listaParticipantes.length} onChange={toggleTodos} />
                                                <strong>Todos</strong>
                                            </label>
                                            {listaParticipantes.map(p => (
                                                <label key={p.id} style={styles.checkboxLabel}>
                                                    <input type="checkbox" checked={participantesSeleccionados.includes(p.id)} onChange={() => toggleParticipante(p.id)} />
                                                    {p.name}
                                                </label>
                                            ))}
                                        </div>
                                        <button type="submit" style={styles.btnPrimary}>Guardar Gasto</button>
                                    </form>
                                </div>
                                <div style={styles.card}>
                                    <h3 style={styles.cardTitle}>📋 Historial</h3>
                                    {gastos.length === 0 ? <p style={styles.noData}>No hay gastos registrados.</p> : (
                                        <ul style={styles.list}>
                                            {gastos.map(g => (
                                                <li key={g.id} style={styles.listItem}>
                                                    <div>
                                                        <strong style={{ color: 'var(--text-main)' }}>{g.descripcion || g.description}</strong>
                                                        <small style={styles.blockTime}>Pagó: <b>{g.pagador_name}</b></small>
                                                        {g.participantes && <small style={styles.blockTime}>Participantes: <b>{g.participantes.length}</b></small>}
                                                    </div>
                                                    <span style={styles.amountText}>{parseFloat(g.amount).toFixed(2)}€</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        )}

                        {subTabFinanzas === 'saldos' && (
                            <div style={{...styles.card, maxWidth: '600px', margin: '0 auto'}}>
                                <h3 style={styles.cardTitle}>📊 Balances</h3>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px'}}>
                                    {Object.keys(saldosCalculados).map(persona => {
                                        const saldo = saldosCalculados[persona];
                                        const esPositivo = saldo >= 0;
                                        return (
                                            <div key={persona} style={{...styles.balanceRow, borderLeft: `4px solid ${esPositivo ? '#00a651' : '#e13c3c'}`}}>
                                                <span>👤 <b>{persona}</b></span>
                                                <span style={{fontWeight: '700', color: esPositivo ? '#00a651' : '#e13c3c'}}>
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
                                    <p style={{...styles.noData, color: '#00a651', fontWeight: '700'}}>🎉 ¡Cuentas claras!</p>
                                ) : (
                                    <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                        {transferenciasCalculadas.map((t, idx) => (
                                            <div key={idx} style={{...styles.transferCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
                                                <span>📱 <b>{t.de}</b> → <b>{t.a}</b>: <span style={{fontWeight:'800', color:'var(--primary)'}}>{t.cantidad.toFixed(2)}€</span></span>
                                                {/* Botón Pagar Deuda */}
                                                <button
                                                    onClick={() => { setModalBizum(t); setPasoModal(1); }}
                                                    style={{ backgroundColor: '#00a3e0', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                                                >
                                                    💳 Pagar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ITINERARIO */}
                {tab === 'itinerario' && (
                    <div>
                        <div style={styles.subTabBar}>
                            <button style={subTabItinerario === 'actividades' ? styles.subTabActive : styles.subTab} onClick={() => setSubTabItinerario('actividades')}>🎯 Actividades</button>
                            <button style={subTabItinerario === 'hoteles' ? styles.subTabActive : styles.subTab} onClick={() => setSubTabItinerario('hoteles')}>🏨 Alojamiento</button>
                        </div>

                        {subTabItinerario === 'actividades' && (
                            <div style={styles.gridTwoColumns}>
                                <div style={styles.card}>
                                    <h3 style={styles.cardTitle}>➕ Programar Plan</h3>
                                    <form onSubmit={añadirActividad} style={styles.form}>
                                        <input type="text" name="tituloAct" placeholder="Ej: Cena en el centro..." required style={styles.input} />
                                        <label style={styles.label}>Día</label>
                                        <input type="date" value={dia} onChange={e => setDia(e.target.value)} required style={styles.input} />
                                        <label style={styles.label}>Hora</label>
                                        <input type="time" name="horaAct" required style={styles.input} />
                                        <button type="submit" style={styles.btnPrimary}>Añadir al Cronograma</button>
                                    </form>
                                </div>
                                <div style={styles.card}>
                                    <h3 style={styles.cardTitle}>⏱️ Agenda</h3>
                                    {planes.length === 0 ? <p style={styles.noData}>No hay actividades planificadas.</p> : (
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                            {planes.map(p => (
                                                <div key={p.id} style={styles.itemRow}>
                                                    <span>⏰ <b>{p.scheduled_at ? p.scheduled_at.substring(11, 16) : '00:00'} h</b> - {p.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {subTabItinerario === 'hoteles' && (
                            <div style={styles.gridTwoColumns}>
                                <div style={styles.card}>
                                    <h3 style={styles.cardTitle}>🏨 Registrar Alojamiento</h3>
                                    <form onSubmit={registrarHotel} style={styles.form}>
                                        <input type="text" name="hotelNombre" placeholder="Nombre del hotel / apartamento" required style={styles.input} />
                                        <input type="text" name="hotelDireccion" placeholder="Dirección física" style={styles.input} />
                                        <input type="url" name="hotelUrl" placeholder="Enlace de reserva" style={styles.input} />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={styles.label}>Check-in</label>
                                                <input type="date" name="hotelIn" required style={styles.input} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={styles.label}>Check-out</label>
                                                <input type="date" name="hotelOut" required style={styles.input} />
                                            </div>
                                        </div>
                                        <button type="submit" style={styles.btnPrimary}>Guardar Hotel</button>
                                    </form>
                                </div>
                                <div style={styles.card}>
                                    <h3 style={styles.cardTitle}>🛌 Alojamientos Guardados</h3>
                                    {hoteles.length === 0 ? <p style={styles.noData}>No hay alojamientos registrados.</p> : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {hoteles.map(h => (
                                                <div key={h.id} style={{ ...styles.itemRow, flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                                        <strong>🏢 {h.name}</strong>
                                                        {h.booking_url && <a href={h.booking_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '13px' }}>🔗 Enlace</a>}
                                                    </div>
                                                    <small style={{ color: 'var(--text-muted)' }}>📍 {h.address || 'Sin dirección'}</small>
                                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>📅 {h.check_in} al {h.check_out}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* CHAT */}
                {tab === 'chat' && (
                    <div style={{...styles.card, maxWidth: '700px', margin: '0 auto'}}>
                        <h3 style={styles.cardTitle}>💬 Chat de la Escapada</h3>
                        <div style={styles.chatBox}>
                            {mensajes.length === 0 ? <p style={styles.noData}>¡Escribe el primer mensaje!</p> : (
                                mensajes.map(msg => (
                                    <div key={msg.id} style={styles.chatBubble}>
                                        <small style={styles.chatUser}>{msg.user_name || 'Amigo'}</small>
                                        <div style={{ wordBreak: 'break-word' }}>{msg.message}</div>
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

                {/* MIEMBROS */}
                {tab === 'miembros' && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                        {miRol === 'organizador' && (
                            <div style={styles.card}>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                                    <h3 style={styles.cardTitle}>✏️ Datos del Viaje</h3>
                                    <button onClick={() => setEditandoViaje(!editandoViaje)} style={styles.btnSecondary}>{editandoViaje ? 'Cancelar' : 'Editar'}</button>
                                </div>
                                {editandoViaje ? (
                                    <form onSubmit={guardarEdicion} style={styles.form}>
                                        <input type="text" placeholder="Título" value={datosEdicion.title} onChange={e => setDatosEdicion({...datosEdicion, title: e.target.value})} style={styles.input} />
                                        <input type="text" placeholder="Destino" value={datosEdicion.destination} onChange={e => setDatosEdicion({...datosEdicion, destination: e.target.value})} style={styles.input} />
                                        <input type="date" value={datosEdicion.start_date} onChange={e => setDatosEdicion({...datosEdicion, start_date: e.target.value})} style={styles.input} />
                                        <input type="date" value={datosEdicion.end_date} onChange={e => setDatosEdicion({...datosEdicion, end_date: e.target.value})} style={styles.input} />
                                        <button type="submit" style={styles.btnPrimary}>💾 Guardar Cambios</button>
                                    </form>
                                ) : (
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                        <p style={{margin: 0}}>📍 <b>Destino:</b> {viaje.destination}</p>
                                        <p style={{margin: 0}}>📅 <b>Inicio:</b> {viaje.start_date}</p>
                                        <p style={{margin: 0}}>📅 <b>Fin:</b> {viaje.end_date}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={styles.card}>
                            <h3 style={styles.cardTitle}>👥 Miembros del Viaje</h3>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                {listaParticipantes.map(p => (
                                    <div key={p.id} style={{...styles.balanceRow, flexWrap: 'wrap', gap: '10px'}}>
                                        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                            <div style={styles.avatarMini}>{p.name.substring(0,2).toUpperCase()}</div>
                                            <div>
                                                <strong>{p.name}</strong>
                                                <small style={{display: 'block', color: 'var(--text-muted)'}}>
                                                    {p.role === 'organizador' ? '👑 Organizador' : '🧳 Viajero'}
                                                </small>
                                            </div>
                                        </div>
                                        {miRol === 'organizador' && p.role !== 'organizador' && (
                                            <div style={{display: 'flex', gap: '8px', marginLeft: 'auto'}}>
                                                <button onClick={() => transferirRol(p.id, p.name)} style={styles.btnWarning}>👑 Hacer Organizador</button>
                                                <button onClick={() => expulsarMiembro(p.id, p.name)} style={styles.btnDanger}>❌ Expulsar</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={styles.card}>
                            <h3 style={{...styles.cardTitle, color: '#e13c3c'}}>⚠️ Zona de Peligro</h3>
                            <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                                {miRol !== 'organizador' && <button onClick={abandonarViaje} style={styles.btnDanger}>🚪 Abandonar Viaje</button>}
                                {miRol === 'organizador' && <button onClick={borrarViaje} style={styles.btnDanger}>🗑️ Borrar Viaje</button>}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL CONFIRMACIÓN (Expulsar/Abandonar) */}
            {dialogoConfirmacion.visible && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalBox}>
                        <h3 style={{ marginTop: 0, color: 'var(--text-main)', fontSize: '20px' }}>⚠️ Confirmación requerida</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '25px' }}>{dialogoConfirmacion.mensaje}</p>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                            <button onClick={() => setDialogoConfirmacion({ visible: false, mensaje: '', accionConfirmada: null })} style={styles.btnCancelarModal}>Cancelar</button>
                            <button onClick={() => { dialogoConfirmacion.accionConfirmada(); setDialogoConfirmacion({ visible: false, mensaje: '', accionConfirmada: null }); }} style={styles.btnConfirmarModal}>Sí, estoy seguro</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✅ MODAL PAGOS (BIZUM / TARJETA) */}
            {modalBizum && (
            <div style={{...styles.modalOverlay, zIndex: 1100}}>
                <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '35px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center', maxHeight: '90vh', overflowY: 'auto' }}>

                    {/* PASO 1: Elegir método */}
                    {pasoModal === 1 && (
                        <>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>💳</div>
                            <h2 style={{ margin: '0 0 5px 0', color: '#1a1a1a' }}>Pagar deuda</h2>
                            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>Elige cómo quieres pagar</p>
                            <div style={{ backgroundColor: '#f0f9ff', borderRadius: '12px', padding: '15px', marginBottom: '25px', textAlign: 'left' }}>
                                <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Enviando a</p>
                                <p style={{ margin: '0 0 8px 0', fontWeight: '800', fontSize: '18px' }}>{modalBizum.a}</p>
                                <p style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: '#00a3e0' }}>{modalBizum.cantidad.toFixed(2)}€</p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                <button onClick={() => { setMetodoPago('bizum'); setPasoModal(2); }} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '2px solid #00a3e0', backgroundColor: '#f0f9ff', cursor: 'pointer', fontWeight: '700', fontSize: '15px', color: '#00a3e0' }}>
                                    📱 Bizum
                                </button>
                                <button onClick={() => { setMetodoPago('tarjeta'); setPasoModal(2); cargarTarjetas(); }} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '2px solid #6366f1', backgroundColor: '#f5f3ff', cursor: 'pointer', fontWeight: '700', fontSize: '15px', color: '#6366f1' }}>
                                    💳 Tarjeta
                                </button>
                            </div>
                            <button onClick={cerrarModal} style={{ backgroundColor: 'transparent', color: '#999', border: 'none', padding: '8px', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
                        </>
                    )}

                    {/* PASO 2A: Formulario Bizum */}
                    {pasoModal === 2 && metodoPago === 'bizum' && (
                        <>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📱</div>
                            <h2 style={{ margin: '0 0 20px 0', color: '#00a3e0' }}>Pagar con Bizum</h2>
                            {/* ✅ CORREGIDO: onSubmit apunta a procesarPago */}
                            <form onSubmit={procesarPago} style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'left' }}>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Teléfono del destinatario</label>
                                    <input type="tel" placeholder="612 345 678" value={datosBizum.telefono} onChange={e => setDatosBizum({...datosBizum, telefono: e.target.value})} required maxLength={9} style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e1e5ee', fontSize: '16px', width: '100%', boxSizing: 'border-box', outline: 'none', letterSpacing: '2px' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Concepto</label>
                                    <input type="text" placeholder={`Viaje - ${modalBizum.de} a ${modalBizum.a}`} value={datosBizum.concepto} onChange={e => setDatosBizum({...datosBizum, concepto: e.target.value})} style={{ padding: '14px', borderRadius: '10px', border: '1px solid #e1e5ee', fontSize: '15px', width: '100%', boxSizing: 'border-box', outline: 'none' }} />
                                </div>
                                <button type="submit" style={{ backgroundColor: '#00a3e0', color: 'white', padding: '16px', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}>
                                    Enviar {modalBizum.cantidad.toFixed(2)}€
                                </button>
                                <button type="button" onClick={() => setPasoModal(1)} style={{ backgroundColor: 'transparent', color: '#999', border: 'none', padding: '8px', cursor: 'pointer', fontSize: '14px' }}>← Volver</button>
                            </form>
                        </>
                    )}

                    {/* PASO 2B: Formulario Tarjeta */}
                    {pasoModal === 2 && metodoPago === 'tarjeta' && (
                        <>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💳</div>
                            <h2 style={{ margin: '0 0 20px 0', color: '#6366f1' }}>Pagar con Tarjeta</h2>

                            {/* Tarjetas guardadas */}
                            {tarjetasGuardadas.length > 0 && (
                                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: '#555', marginBottom: '10px' }}>Tarjetas guardadas:</p>
                                    {tarjetasGuardadas.map(t => (
                                        <div key={t.id} onClick={() => setTarjetaSeleccionada(t.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '10px', border: `2px solid ${tarjetaSeleccionada === t.id ? '#6366f1' : '#e1e5ee'}`, marginBottom: '8px', cursor: 'pointer', backgroundColor: tarjetaSeleccionada === t.id ? '#f5f3ff' : 'white' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '600' }}>
                                                {t.card_type === 'visa' ? '💙' : '🟠'} **** {t.card_number_last4} — {t.card_holder}
                                            </span>
                                            <button onClick={(e) => { e.stopPropagation(); eliminarTarjeta(t.id); }} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Formulario nueva tarjeta */}
                            {!tarjetaSeleccionada && (
                                <form onSubmit={procesarPago} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Titular de la tarjeta</label>
                                        <input type="text" placeholder="NOMBRE APELLIDO" value={datosTarjeta.card_holder} onChange={e => setDatosTarjeta({...datosTarjeta, card_holder: e.target.value.toUpperCase()})} required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e1e5ee', fontSize: '15px', width: '100%', boxSizing: 'border-box', outline: 'none' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Número de tarjeta</label>
                                        <input type="text" placeholder="1234 5678 9012 3456" value={datosTarjeta.card_number} onChange={e => setDatosTarjeta({...datosTarjeta, card_number: e.target.value.replace(/\D/g, '').slice(0, 16)})} required maxLength={16} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e1e5ee', fontSize: '15px', width: '100%', boxSizing: 'border-box', outline: 'none', letterSpacing: '2px' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Caducidad</label>
                                            <input type="text" placeholder="MM/AA" value={datosTarjeta.card_expiry} onChange={e => setDatosTarjeta({...datosTarjeta, card_expiry: e.target.value})} required maxLength={5} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e1e5ee', fontSize: '15px', width: '100%', boxSizing: 'border-box', outline: 'none' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>CVV</label>
                                            <input type="password" placeholder="***" value={datosTarjeta.card_cvv} onChange={e => setDatosTarjeta({...datosTarjeta, card_cvv: e.target.value.replace(/\D/g, '').slice(0, 3)})} required maxLength={3} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e1e5ee', fontSize: '15px', width: '100%', boxSizing: 'border-box', outline: 'none' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Tipo</label>
                                        <select value={datosTarjeta.card_type} onChange={e => setDatosTarjeta({...datosTarjeta, card_type: e.target.value})} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #e1e5ee', fontSize: '15px', width: '100%', boxSizing: 'border-box', outline: 'none' }}>
                                            <option value="visa">💙 Visa</option>
                                            <option value="mastercard">🟠 Mastercard</option>
                                        </select>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={guardandoTarjeta} onChange={e => setGuardandoTarjeta(e.target.checked)} />
                                        Guardar tarjeta para futuros pagos
                                    </label>
                                    <button type="submit" style={{ backgroundColor: '#6366f1', color: 'white', padding: '16px', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '16px', cursor: 'pointer', marginTop: '5px' }}>
                                        Pagar {modalBizum.cantidad.toFixed(2)}€
                                    </button>
                                </form>
                            )}

                            {/* Pagar con tarjeta guardada */}
                            {tarjetaSeleccionada && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ color: '#555', fontSize: '14px' }}>Pagarás con la tarjeta seleccionada.</p>
                                    <button onClick={procesarPago} style={{ backgroundColor: '#6366f1', color: 'white', padding: '16px', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}>
                                        Pagar {modalBizum.cantidad.toFixed(2)}€
                                    </button>
                                    <button onClick={() => setTarjetaSeleccionada(null)} style={{ backgroundColor: 'transparent', color: '#999', border: 'none', padding: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                        Usar otra tarjeta
                                    </button>
                                </div>
                            )}

                            <button type="button" onClick={() => setPasoModal(1)} style={{ backgroundColor: 'transparent', color: '#999', border: 'none', padding: '8px', cursor: 'pointer', fontSize: '14px', marginTop: '10px' }}>← Volver</button>
                        </>
                    )}

                    {/* PASO 3: Procesando */}
                    {pasoModal === 3 && (
                        <>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                            <h2 style={{ color: '#333', marginBottom: '10px' }}>Procesando pago...</h2>
                            <p style={{ color: '#666', fontSize: '14px' }}>Conectando con la pasarela</p>
                            <div style={{ marginTop: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '15px', fontSize: '13px', color: '#999', textAlign: 'left' }}>
                                <p style={{ margin: '4px 0' }}>✅ Autenticando usuario...</p>
                                <p style={{ margin: '4px 0' }}>✅ Verificando saldo...</p>
                                <p style={{ margin: '4px 0' }}>🔄 Procesando transacción...</p>
                            </div>
                        </>
                    )}

                    {/* PASO 4: Confirmado */}
                    {pasoModal === 4 && (
                        <>
                            <div style={{ fontSize: '64px', marginBottom: '15px' }}>✅</div>
                            <h2 style={{ color: '#00a651', marginBottom: '10px' }}>¡Pago realizado!</h2>
                            <p style={{ color: '#666', fontSize: '15px', marginBottom: '20px' }}>
                                Has enviado <strong>{modalBizum.cantidad.toFixed(2)}€</strong> a <strong>{modalBizum.a}</strong>
                            </p>
                            <div style={{ backgroundColor: '#d1fae5', borderRadius: '12px', padding: '15px', marginBottom: '25px', fontSize: '13px', color: '#065f46', textAlign: 'left' }}>
                                <p style={{ margin: '4px 0' }}>💳 Método: {metodoPago === 'bizum' ? 'Bizum' : 'Tarjeta'}</p>
                                {metodoPago === 'bizum' && <p style={{ margin: '4px 0' }}>📱 Teléfono: {datosBizum.telefono}</p>}
                                {metodoPago === 'tarjeta' && !tarjetaSeleccionada && <p style={{ margin: '4px 0' }}>💳 Tarjeta: **** {datosTarjeta.card_number.slice(-4)}</p>}
                                <p style={{ margin: '4px 0' }}>🕐 {new Date().toLocaleTimeString()}</p>
                                <p style={{ margin: '4px 0', fontWeight: '700' }}>✅ Deuda eliminada del grupo</p>
                            </div>
                            <button onClick={cerrarModal} style={{ backgroundColor: '#00a651', color: 'white', padding: '14px 30px', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', width: '100%' }}>
                                Cerrar
                            </button>
                        </>
                    )}
                </div>
            </div>
            )}
        </div>
    );
};

const styles = {
    container: { maxWidth: '1100px', margin: '0 auto', padding: '20px 15px', fontFamily: 'var(--sans)', width: '100%', boxSizing: 'border-box' },
    loading: { textAlign: 'center', padding: '50px', color: 'var(--text-muted)', fontSize: '16px', fontWeight: '600' },
    hero: { borderRadius: 'var(--radius-card)', color: 'white', padding: '40px 20px', textAlign: 'center', marginBottom: '30px', boxShadow: 'var(--shadow)', wordBreak: 'break-word' },
    title: { fontSize: 'clamp(24px, 5vw, 32px)', margin: '15px 0 10px', fontWeight: '800' },
    badge: { backgroundColor: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: 'var(--radius-btn)', fontSize: '13px', fontWeight: '600' },
    dates: { fontSize: '16px', color: 'rgba(255,255,255,0.8)', margin: '10px 0 0 0' },
    tabBar: { display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '30px', flexWrap: 'wrap' },
    tab: { flex: '1 1 auto', minWidth: '120px', padding: '12px 20px', border: 'none', backgroundColor: 'transparent', color: 'var(--text-muted)', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', fontSize: '15px' },
    tabActive: { flex: '1 1 auto', minWidth: '120px', padding: '12px 20px', border: 'none', backgroundColor: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,98,227,0.3)', fontSize: '15px' },
    subTabBar: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '30px', backgroundColor: '#e1e5ee', padding: '6px', borderRadius: 'var(--radius-btn)', maxWidth: '400px', margin: '0 auto 30px' },
    subTab: { flex: '1', padding: '10px', border: 'none', background: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', borderRadius: 'var(--radius-btn)', color: 'var(--text-muted)' },
    subTabActive: { flex: '1', padding: '10px', border: 'none', backgroundColor: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', borderRadius: 'var(--radius-btn)', color: 'var(--primary)', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
    gridTwoColumns: { display: 'flex', flexWrap: 'wrap', gap: '24px' },
    card: { flex: '1 1 280px', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--radius-card)', padding: 'clamp(15px, 4vw, 30px)', boxShadow: 'var(--shadow)', border: '1px solid #e1e5ee', boxSizing: 'border-box' },
    cardTitle: { fontSize: '18px', marginBottom: '20px', fontWeight: '800', color: 'var(--text-main)', marginTop: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    input: { padding: '14px 16px', borderRadius: '12px', border: '1px solid #e1e5ee', fontSize: '15px', outline: 'none', backgroundColor: '#fff', color: 'var(--text-main)', width: '100%', boxSizing: 'border-box' },
    label: { fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' },
    btnPrimary: { backgroundColor: 'var(--primary)', color: 'white', padding: '16px', border: 'none', borderRadius: 'var(--radius-btn)', fontWeight: '700', cursor: 'pointer', fontSize: '15px', width: '100%', marginTop: '10px' },
    btnSecondary: { backgroundColor: '#e8f0fe', color: '#1a73e8', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    btnWarning: { backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffc107', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' },
    btnDanger: { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #e1e5ee', alignItems: 'center', gap: '10px' },
    amountText: { fontWeight: '800', color: 'var(--primary)', fontSize: '16px', flexShrink: 0 },
    blockTime: { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
    balanceRow: { display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: '12px', fontSize: '15px', alignItems: 'center', gap: '10px' },
    transferCard: { padding: '16px', backgroundColor: 'rgba(0,98,227,0.05)', borderRadius: '12px', borderLeft: '4px solid var(--primary)', fontSize: '15px' },
    noData: { textAlign: 'center', color: 'var(--text-muted)', padding: '20px', fontSize: '15px', fontStyle: 'italic' },
    contentSection: { width: '100%' },
    chatBox: { height: '400px', overflowY: 'auto', border: '1px solid #e1e5ee', padding: '20px', borderRadius: '12px', backgroundColor: 'var(--bg-app)', display: 'flex', flexDirection: 'column', gap: '12px' },
    chatBubble: { padding: '12px 16px', backgroundColor: 'white', borderRadius: '16px 16px 16px 4px', alignSelf: 'flex-start', maxWidth: '85%', boxShadow: '0 2px 5px rgba(0,0,0,0.04)', fontSize: '15px' },
    chatUser: { display: 'block', fontWeight: '700', color: 'var(--primary)', fontSize: '12px', marginBottom: '4px' },
    chatForm: { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' },
    checkboxContainer: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', backgroundColor: 'var(--bg-app)', borderRadius: '12px', border: '1px solid #e1e5ee' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14.5px', cursor: 'pointer' },
    avatarMini: { width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg-nav)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 },
    itemRow: { display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'var(--bg-app)', borderRadius: '12px', borderLeft: '4px solid var(--primary)', width: '100%', boxSizing: 'border-box' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modalBox: { backgroundColor: 'var(--card-bg)', padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
    btnCancelarModal: { padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#e1e5ee', color: 'var(--text-main)', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },
    btnConfirmarModal: { padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }
};

export default GestionViaje;