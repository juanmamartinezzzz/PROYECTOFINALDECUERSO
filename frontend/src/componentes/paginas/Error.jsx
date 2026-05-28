import { Link } from "react-router-dom";

const Error = () => {
    return (
        <section style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>404 - Ruta no encontrada</h2>
            <p>Lo sentimos, el destino al que intentas viajar no existe.</p>
            <Link to="/">Volver al inicio</Link>
        </section>
    );
};

export default Error;