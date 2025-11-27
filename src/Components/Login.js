import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [requestedRole, setRequestedRole] = useState('Customer');
    const [error, setError] = useState('');
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 

        if (!email || !password) {
            setError("E-posta ve şifre zorunludur.");
            return;
        }

        try {
            const response = await axios.post('http://localhost:5296/api/auth/login', {
                Email: email,
                Password: password,
                RequestedRole: requestedRole
            });

            const token = response.data.token;

             if (token) {
                console.log("Token Başarıyla Alındı. Yönlendiriliyor.");
                localStorage.setItem('token', token);
                
                if (requestedRole === 'Customer') {
                    navigate('/customer-dashboard');
                } else if (requestedRole === 'CompanyAdmin') {
                    navigate('/company-admin-dashboard');
                }
            } else {
                setError("Giriş başarısız oldu: Sunucudan geçerli bir kimlik doğrulama verisi alınamadı.");
            }


        } catch (err) {
            const errorMessage = err.response?.data?.error;
            setError(errorMessage);
        }
    };

    const handleRegisterRedirect = () => {
        navigate('/');
    };

    return (
        <div style={styles.container}>
            <h2>Giriş Yap</h2>
            
            {error && <p style={styles.error}>{error}</p>}
            
            <form onSubmit={handleSubmit} style={styles.form}>
                <input
                    type="email"
                    placeholder="E-posta"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                    required
                />
                <input
                    type="password"
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                    required
                />
                <select 
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value)}
                    style={styles.input}
                    required
                >
                    <option value="Customer">Müşteri</option>
                    <option value="CompanyAdmin">Firma Yöneticisi</option>
                </select>
                <button type="submit" style={styles.button}>
                    Giriş
                </button>
            </form>

            <p 
                onClick={handleRegisterRedirect} 
                style={styles.link}
            >
                Hesabım Yok, Kayıt Ol
            </p>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '400px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    input: {
        padding: '10px',
        margin: '10px 0',
        borderRadius: '4px',
        border: '1px solid #ddd',
        fontSize: '16px'
    },
    button: {
        padding: '10px',
        margin: '10px 0',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
    },
    error: {
        color: 'red',
        marginBottom: '10px'
    },
    link: {
        marginTop: '15px',
        color: '#007bff',
        cursor: 'pointer',
        fontSize: '14px',
        textDecoration: 'underline'
    }
};

export default Login;