import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!email || !password || !firstname || !lastname) {
            setError("Tüm alanlar zorunludur.");
            return;
        }


        try {
            const response = await axios.post('http://localhost:5296/api/auth/register/customer', {
                Email: email,
                Password: password,
                Firstname: firstname,
                Lastname: lastname
            });

            if (response.status === 201) {
                setSuccessMessage("Kayıt başarıyla tamamlandı! Giriş sayfasına yönlendiriliyorsunuz...");
                setTimeout(() => {
                    navigate('/login');
                }, 2000); 
            }

        } catch (err) {
            console.error("Kayıt Hatası:", err.response.data.error);
            const errorMessage = err.response.data.error;
            setError(errorMessage);
        }
    };

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    return (
        <div style={styles.container}>
            <h2>Kayıt Ol</h2>
            
            {error && <p style={styles.error}>{error}</p>}
            {successMessage && <p style={styles.success}>{successMessage}</p>}
            
            <form onSubmit={handleSubmit} style={styles.form}>
                <input
                    type="text"
                    placeholder="Ad"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    style={styles.input}
                    required
                />
                <input
                    type="text"
                    placeholder="Soyad"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    style={styles.input}
                    required
                />
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
                <button type="submit" style={styles.button}>
                    Kayıt Ol
                </button>
            </form>

            <p 
                onClick={handleLoginRedirect} 
                style={styles.link}
            >
                Hesabım Var / Firma Yetkilisiyim
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
        backgroundColor: '#28a745',
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
    success: {
        color: 'green',
        marginBottom: '10px',
        fontWeight: 'bold'
    },
    link: {
        marginTop: '15px',
        color: '#007bff',
        cursor: 'pointer',
        fontSize: '14px',
        textDecoration: 'underline'
    }
};

export default Register;