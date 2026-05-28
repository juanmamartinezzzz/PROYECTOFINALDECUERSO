import { BrowserRouter } from 'react-router-dom'; 
import Cabecera from './componentes/estructura/Cabecera';
import Navegacion from './componentes/estructura/Navegacion';
import Contenido from './componentes/estructura/Contenido';
import PiePagina from './componentes/estructura/PiePagina';
import ProveedorAuth from './contextos/ProveedorAuth';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <Cabecera />
        <Navegacion />
        <Contenido />
        <PiePagina />
      </ProveedorAuth>
    </BrowserRouter>
  );
}

export default App;