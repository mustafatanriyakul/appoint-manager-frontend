import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5296/api/customer';

function CustomerDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generalError, setGeneralError] = useState(''); 
    const [bookingError, setBookingError] = useState(''); 
    const [message, setMessage] = useState(''); 

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null); 
    const [appointmentDate, setAppointmentDate] = useState('');
    const [notes, setNotes] = useState('');
    const [isBooking, setIsBooking] = useState(false); 

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    
    const fetchData = useCallback(async () => {
        setLoading(true);
        setGeneralError('');

        if (!token) {
            setGeneralError("Giriş yapmalısınız. Yönlendiriliyor...");
            setTimeout(() => navigate('/login'), 1500);
            return;
        }

        try {
            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };

            const appointmentsResponse = await axios.get(`${API_BASE_URL}/appointments`, config);
            setAppointments(appointmentsResponse.data);

            const companiesResponse = await axios.get(`${API_BASE_URL}/companies`, config);
            setCompanies(companiesResponse.data);
            
        } catch (err) {
            console.error("Veri çekme hatası:", err.response || err);
            
            if (err.response?.status === 401 || err.response?.status === 403) {
                setGeneralError("Oturum süreniz doldu veya yetkiniz yok. Lütfen tekrar giriş yapın.");
                localStorage.removeItem('token');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                const backendError = err.response?.data?.Error || "Dashboard verileri yüklenirken beklenmedik bir hata oluştu.";
                setGeneralError(backendError);
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, token]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('tr-TR', { 
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
    };
    
    const handleBookAppointment = (companyId, companyName) => {
        setSelectedCompany({ id: companyId, name: companyName });
        
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const minDate = now.toISOString().slice(0, 16);
        setAppointmentDate(minDate); 

        setNotes('');
        setMessage('');
        setBookingError('');
        setIsModalOpen(true);
    };

    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        setBookingError('');
        setMessage('');
        
        if (!selectedCompany || !appointmentDate) {
            setBookingError("Lütfen firma ve randevu tarihi seçin.");
            return;
        }

        setIsBooking(true);

        const command = {
            CompanyId: selectedCompany.id,
            Date: appointmentDate, 
            Notes: notes.trim()
        };

        try {
            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };

            const response = await axios.post(`${API_BASE_URL}/appointments`, command, config);

            setMessage(`Randevunuz başarıyla oluşturuldu!`);
            await fetchData();
            
            setIsModalOpen(false);
            setSelectedCompany(null);

        } catch (err) {
            console.error("Randevu oluşturma hatası:", err.response || err);
            
            let errorMessage = err.response.data.error;
            setBookingError(errorMessage);
        } finally {
            setIsBooking(false);
        }
    };


    if (loading) {
        return <div style={styles.centerText}>Veriler yükleniyor...</div>;
    }

    if (generalError) {
        return (
            <div style={styles.errorContainer}>
                <p style={styles.errorMessage}>{generalError}</p>
                <button onClick={handleLogout} style={styles.logoutButton}>Giriş Sayfasına Dön</button>
            </div>
        );
    }

    const sortedAppointments = appointments
        .slice()
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Müşteri Paneli</h1>
                <button onClick={handleLogout} style={styles.logoutButton}>Çıkış Yap</button>
            </div>
            
            {message && <div style={styles.successMessage}>{message}</div>}


            <h2 style={{...styles.subtitle, borderLeft: '5px solid #007bff', paddingLeft: '10px'}}>
                Randevularınız ({appointments.length})
            </h2>

            {appointments.length === 0 ? (
                <p style={styles.emptyMessage}>Henüz kayıtlı bir randevunuz bulunmamaktadır.</p>
            ) : (
                <div style={styles.cardContainer}>
                    {sortedAppointments.map((appointment) => (
                        <div key={appointment.id} style={{ ...styles.card, 
                            backgroundColor: appointment.status === 'Completed' ? '#e9f7ef' : 
                                             appointment.status === 'Cancelled' ? '#fdebeb' : '#f0f8ff' }}>
                            
                            <p style={styles.cardTitle}>{formatDate(appointment.date)}</p>
                            
                            <div style={styles.detailRow}>
                                <span style={styles.label}>Firma:</span>
                                <span style={styles.value}>{appointment.companyName}</span>
                            </div>
                            <div style={styles.detailRow}>
                                <span style={styles.label}>Durum:</span>
                                <span style={{...styles.value, ...styles.statusBadge(appointment.status)}}>
                                    {appointment.status}
                                </span>
                            </div>
                            <div style={styles.notesBox}>
                                <strong>Not:</strong> {appointment.notes || "Yok"}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <h2 style={{...styles.subtitle, marginTop: '40px', borderLeft: '5px solid #28a745', paddingLeft: '10px'}}>
                Randevu Alınabilecek Firmalar ({companies.length})
            </h2>

            {companies.length === 0 ? (
                <p style={styles.emptyMessage}>Sistemde kayıtlı firma bulunmamaktadır.</p>
            ) : (
                <div style={styles.cardContainer}>
                    {companies.map((company) => (
                        <div key={company.id} style={{ ...styles.companyCard }}>
                            <h3 style={styles.companyName}>{company.name}</h3>
                            <p style={styles.companyDetail}>
                                <strong>Adres:</strong> {company.address}
                            </p>
                            <p style={styles.companyDetail}>
                                <strong>Tel:</strong> {company.phoneNumber}
                            </p>
                            <button 
                                onClick={() => handleBookAppointment(company.id, company.name)} 
                                style={styles.bookButton}>
                                Randevu Al
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && selectedCompany && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>{selectedCompany.name} için Randevu Oluştur</h3>
                        
                        {bookingError && <div style={styles.errorMessageInModal}>{bookingError}</div>}

                        <form onSubmit={handleCreateAppointment}>
                            
                            <div style={styles.formGroup}>
                                <label htmlFor="appointmentDate" style={styles.label}>Randevu Tarihi ve Saati:</label>
                                <input
                                    id="appointmentDate"
                                    type="datetime-local"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} 
                                    required
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label htmlFor="notes" style={styles.label}>Notlar (Opsiyonel):</label>
                                <textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    maxLength="250"
                                    rows="3"
                                    style={styles.textarea}
                                />
                            </div>

                            <div style={styles.modalActions}>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setBookingError('');
                                    }} 
                                    style={styles.cancelButton}>
                                    Kapat
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isBooking}
                                    style={styles.submitButton}>
                                    {isBooking ? 'Oluşturuluyor...' : 'Randevuyu Onayla'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '20px auto',
        padding: '20px',
        fontFamily: 'Inter, sans-serif',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '10px',
        borderBottom: '2px solid #ddd',
    },
    title: {
        color: '#1a202c',
        fontSize: '28px',
        margin: 0,
        fontWeight: '700',
    },
    subtitle: {
        color: '#4a5568',
        fontSize: '22px',
        marginBottom: '25px',
        fontWeight: '600',
    },
    logoutButton: {
        padding: '8px 15px',
        backgroundColor: '#e53e3e',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'background-color 0.3s',
    },
    cardContainer: {
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        marginBottom: '30px',
    },
    card: {
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        transition: 'transform 0.2s',
    },
    cardTitle: {
        fontWeight: '700',
        fontSize: '15px',
        color: '#007bff',
        borderBottom: '1px solid #cbd5e0',
        paddingBottom: '8px',
        marginBottom: '10px',
    },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
    },
    label: {
        fontWeight: '500',
        color: '#718096',
        fontSize: '14px',
    },
    value: {
        fontWeight: '600',
        fontSize: '14px',
    },
    notesBox: {
        marginTop: '10px',
        padding: '8px',
        backgroundColor: '#edf2f7',
        borderRadius: '4px',
        fontSize: '13px',
        color: '#2d3748',
    },
    companyCard: {
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid #90cdf4',
        backgroundColor: '#f7fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    },
    companyName: {
        fontSize: '20px',
        color: '#2b6cb0',
        marginBottom: '10px',
        fontWeight: 'bold',
    },
    companyDetail: {
        fontSize: '14px',
        color: '#4a5568',
        margin: '3px 0',
    },
    bookButton: {
        marginTop: '15px',
        padding: '10px 20px',
        backgroundColor: '#38a169',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '600',
        transition: 'background-color 0.3s, transform 0.1s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    },
    emptyMessage: {
        textAlign: 'center',
        fontSize: '16px',
        color: '#a0aec0',
        padding: '20px',
        border: '1px dashed #e2e8f0',
        borderRadius: '5px',
    },
    centerText: {
        textAlign: 'center',
        fontSize: '18px',
        color: '#777',
        marginTop: '50px',
    },
    statusBadge: (status) => {
        let color = '#6c757d';
        if (status === 'Confirmed' || status === 'Pending') color = '#dd6b20';
        if (status === 'Completed') color = '#38a169';
        if (status === 'Cancelled') color = '#e53e3e';
        
        return {
            fontWeight: 'bold',
            color: color,
        };
    },
    errorContainer: {
        textAlign: 'center', 
        padding: '50px', 
        backgroundColor: '#fff3f4', 
        border: '1px solid #f9d9da', 
        borderRadius: '10px',
        margin: '50px auto',
        maxWidth: '400px',
    },
    errorMessage: { 
        color: '#d64545', 
        fontSize: '18px', 
        marginBottom: '20px',
    },
    errorMessageInModal: { 
        padding: '10px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        marginBottom: '15px',
        fontSize: '14px',
        fontWeight: '600',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        position: 'relative',
    },
    modalTitle: {
        fontSize: '24px',
        color: '#007bff',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px',
        marginBottom: '20px',
    },
    formGroup: {
        marginBottom: '15px',
        display: 'flex',
        flexDirection: 'column',
    },
    input: {
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        marginTop: '5px',
        fontSize: '16px',
    },
    textarea: {
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        marginTop: '5px',
        fontSize: '16px',
        resize: 'vertical',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px',
    },
    cancelButton: {
        padding: '10px 15px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    submitButton: {
        padding: '10px 15px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    }
};

export default CustomerDashboard;