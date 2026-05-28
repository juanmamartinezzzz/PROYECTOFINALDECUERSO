import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { contextoAuth } from "../../contextos/ProveedorAuth";

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    
    // Estados para errores visuales integrados
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState("");
    
    const { login, register } = useContext(contextoAuth);
    const navigate = useNavigate();

    const validarFormulario = () => {
        const nuevosErrores = {};
        
        // Validar Nombre (solo en registro) con límite de 20 caracteres
        if (!isLogin) {
            if (!formData.name.trim()) {
                nuevosErrores.name = "El nombre es obligatorio.";
            } else if (formData.name.length > 20) {
                nuevosErrores.name = "El nombre no puede tener más de 20 caracteres.";
            }
        }
        
        // Validar Email
        if (!formData.email.trim()) {
            nuevosErrores.email = "Debes introducir un correo.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            nuevosErrores.email = "Formato de correo no válido (ej: usuario@mail.com)";
        }

        // Validar Contraseña
        if (!formData.password) {
            nuevosErrores.password = "La contraseña es obligatoria.";
        } else if (!isLogin) {
            const regexSeguridad = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
            if (!regexSeguridad.test(formData.password)) {
                nuevosErrores.password = "Debe tener 8 caracteres, 1 mayúscula, 1 minúscula y 1 número.";
            }
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Limpiar errores visuales al escribir
        if (errores[name]) setErrores({ ...errores, [name]: '' });
        if (errorGeneral) setErrorGeneral('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorGeneral("");

        if (!validarFormulario()) return; 

        try {
            if (isLogin) {
                await login(formData);
            } else {
                await register(formData);
                navigate('/verificar', { state: { email: formData.email } });
            }
        } catch (error) {
            if (error.response?.status === 422) { 
                const backendErrors = error.response.data.errors;
                const mapeoErrores = {};
                
                if (backendErrors.name) mapeoErrores.name = backendErrors.name[0];
                if (backendErrors.email) mapeoErrores.email = backendErrors.email[0];
                if (backendErrors.password) mapeoErrores.password = backendErrors.password[0];
                
                setErrores(mapeoErrores);
            } else if (error.response?.status === 401) {
                setErrorGeneral("El correo o la contraseña no son correctos.");
            } else {
                setErrorGeneral("Error de conexión con el servidor.");
            }
        }
    };

    const cambiarModo = () => {
        setIsLogin(!isLogin);
        setErrores({});
        setErrorGeneral("");
        setFormData({ name: '', email: '', password: '' });
    };

    return (
        <section className="login" style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
            
            {errorGeneral && (
                <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px', textAlign: 'center', border: '1px solid #f87171' }}>
                    {errorGeneral}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }} noValidate>
                
                {!isLogin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <input 
                            type="text" 
                            name="name"
                            maxLength={20} // Bloqueo visual a 20 caracteres
                            placeholder="Nombre de usuario" 
                            value={formData.name}
                            onChange={handleChange} 
                            style={{ padding: '10px', borderColor: errores.name ? '#dc2626' : '#ccc', borderWidth: '1px', borderStyle: 'solid', borderRadius: '4px', outline: 'none' }}
                        />
                        {errores.name && <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 'bold' }}>{errores.name}</span>}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <input 
                        type="email" 
                        name="email"
                        placeholder="Correo Electrónico" 
                        value={formData.email}
                        onChange={handleChange} 
                        style={{ padding: '10px', borderColor: errores.email ? '#dc2626' : '#ccc', borderWidth: '1px', borderStyle: 'solid', borderRadius: '4px', outline: 'none' }}
                    />
                    {errores.email && <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 'bold' }}>{errores.email}</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <input 
                        type="password" 
                        name="password"
                        placeholder="Contraseña" 
                        value={formData.password}
                        onChange={handleChange} 
                        style={{ padding: '10px', borderColor: errores.password ? '#dc2626' : '#ccc', borderWidth: '1px', borderStyle: 'solid', borderRadius: '4px', outline: 'none' }}
                    />
                    {errores.password && <span style={{ color: '#dc2626', fontSize: '12px', fontWeight: 'bold' }}>{errores.password}</span>}
                </div>

                <button type="submit" style={{ padding: '12px', backgroundColor: '#11998e', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                    {isLogin ? 'Entrar' : 'Crear Cuenta'}
                </button>
            </form>

            <p onClick={cambiarModo} style={{ cursor: 'pointer', color: '#1a73e8', textAlign: 'center', marginTop: '20px', fontWeight: 'bold', fontSize: '14px' }}>
                {isLogin ? "¿No tienes cuenta? Regístrate aquí" : "¿Ya tienes cuenta? Entra aquí"}
            </p>
        </section>
    );
};

export default Login;