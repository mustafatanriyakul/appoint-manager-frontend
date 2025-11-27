import logo from './logo.svg';
import './App.css';
import { Route, Routes } from 'react-router-dom';
import Register from './Components/Register';
import Login from './Components/Login';
import CustomerDashboard from './Components/CustomerDashboard';
import CompanyAdminDashboard from './Components/CompanyAdminDashboard';



function App() {
  return (
      <Routes>
        <Route path='/' element={<Register />}/>
        <Route path='/login' element={<Login />}/>
        <Route path='/customer-dashboard' element={<CustomerDashboard />}/>
        <Route path='/company-admin-dashboard' element={<CompanyAdminDashboard />}/>
      </Routes>
    
  );
}

export default App;
