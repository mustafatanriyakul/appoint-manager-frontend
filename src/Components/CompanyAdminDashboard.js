import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5296/api/company-admin';

// Backend'deki AppointmentStatus enum'una karşılık gelen map ve seçenekler
const STATUS_MAP = {
    Pending: 0,
    Confirmed: 1,
    Cancelled: 2,
    Completed: 3,
};
const STATUS_OPTIONS = Object.keys(STATUS_MAP); // ['Pending', 'Confirmed', 'Cancelled', 'Completed']

function CompanyAdminDashboard() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // Başarı mesajları için
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Onay Modalı
    const [appointmentToDelete, setAppointmentToDelete] = useState(null); // Silinecek randevu ID'si

    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    
    // Randevuları API'den çeken ana fonksiyon
    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setError('');
        setMessage(''); // Yeni çekimde mesajı temizle

        if (!token) {
            setError("Giriş yapmalısınız. Yönlendiriliyor...");
            setTimeout(() => navigate('/login'), 1500);
            return;
        }

        try {
            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };

            const response = await axios.get(`${API_BASE_URL}/appointments`, config);
            setAppointments(response.data);
            
        } catch (err) {
            console.error("Randevu çekme hatası:", err.response || err);
            
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError("Oturum süreniz doldu veya yetkiniz yok. Lütfen tekrar giriş yapın.");
                localStorage.removeItem('token');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                const backendError = err.response?.data?.Error || "Randevuları çekerken beklenmedik bir hata oluştu.";
                setError(backendError);
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, token]);


    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);


    // Durum Güncelleme İşlevi (UpdateAppointmentStatusCommand)
    const handleStatusUpdate = async (appointmentId, newStatusString) => {
        setMessage('');
        setError('');
        
        const newStatusInt = STATUS_MAP[newStatusString]; 

        if (newStatusInt === undefined) {
            setError(`Geçersiz durum değeri: ${newStatusString}`);
            return;
        }

        try {
            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };
            
            const command = {
                AppointmentId: appointmentId,
                Status: newStatusInt 
            };
            
            await axios.put(`${API_BASE_URL}/appointments/update`, command, config);
            
            // Başarılı güncelleme sonrası listeyi YENİDEN ÇEK
            await fetchAppointments();
            setMessage(`Randevu (${appointmentId.substring(0, 8)}...) durumu başarıyla "${newStatusString}" olarak güncellendi.`);

        } catch (err) {
            console.error("Durum güncelleme hatası:", err.response || err);
            const backendError = err.response?.data?.Error || "Durum güncellenirken hata oluştu. Lütfen tekrar deneyin.";
            setError(backendError);
            fetchAppointments(); 
        }
    };
    
    // Silme Onayını Başlatma Fonksiyonu
    const confirmDelete = (appointmentId) => {
        // Hata ve mesajları temizle
        setError('');
        setMessage('');
        // Silinecek ID'yi state'e at ve modalı aç
        setAppointmentToDelete(appointmentId);
        setIsConfirmModalOpen(true);
    };

    // Randevu Silme İşlevi (DeleteAppointmentByIdCommand)
    const handleDeleteAppointment = async () => {
        if (!appointmentToDelete) return; // ID yoksa işlemi durdur

        // Modalı hemen kapat, işlem sırasında butonu yükleniyor yapamayız
        setIsConfirmModalOpen(false);
        setMessage(`Randevu (${appointmentToDelete.substring(0, 8)}...) siliniyor...`);
        setError('');
        
        try {
            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };
            
            // DELETE isteği (Backend'de {id} parametresini kullanıyoruz)
            await axios.delete(`${API_BASE_URL}/appointments/delete/${appointmentToDelete}`, config);
            
            // Başarılı silme sonrası listeyi YENİDEN ÇEK
            await fetchAppointments();
            setMessage(`Randevu başarıyla silindi.`);

        } catch (err) {
            console.error("Randevu silme hatası:", err.response || err);
            const backendError = err.response?.data?.Error || "Randevu silinirken beklenmedik bir hata oluştu.";
            setError(backendError);
            
        } finally {
            setAppointmentToDelete(null); // İşlem bitince ID'yi temizle
        }
    };


    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('tr-TR', { 
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };
    
    const getStatusColor = (status) => {
        switch(status) {
            case 'Confirmed': return '#38a169'; // Yeşil
            case 'Cancelled': return '#e53e3e'; // Kırmızı
            case 'Completed': return '#2b6cb0'; // Mavi
            case 'Pending':
            default: return '#dd6b20'; // Turuncu
        }
    };

    if (loading) {
        return <div style={styles.centerText}>Randevular yükleniyor...</div>;
    }

    if (error) {
        return (
            <div style={styles.errorContainer}>
                <p style={styles.errorMessage}>{error}</p>
                <button onClick={handleLogout} style={styles.logoutButton}>Giriş Sayfasına Dön</button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Firma Yönetici Paneli</h1>
                <button onClick={handleLogout} style={styles.logoutButton}>Çıkış Yap</button>
            </div>
            
            {/* Başarı ve Hata Mesajları */}
            {message && <div style={styles.successMessage}>{message}</div>}

            <h2 style={styles.subtitle}>Firmanızın Randevuları ({appointments.length})</h2>

            {appointments.length === 0 ? (
                <p style={styles.emptyMessage}>Firmanız için henüz randevu bulunmamaktadır.</p>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Tarih & Saat</th>
                                <th style={styles.th}>Müşteri Adı</th>
                                <th style={styles.th}>Notlar</th>
                                <th style={styles.th}>Mevcut Durum</th>
                                <th style={styles.th}>Durum Güncelle</th>
                                <th style={styles.th}>İşlemler</th> {/* Yeni Sütun */}
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((app) => (
                                <tr key={app.id} style={styles.tr}>
                                    <td style={styles.td}>{formatDate(app.date)}</td>
                                    <td style={styles.td}>{app.customerFullName}</td>
                                    <td style={styles.tdNotes}>{app.notes || '-'}</td>
                                    <td style={styles.td}>
                                        <span style={{...styles.statusBadge, backgroundColor: getStatusColor(app.status)}}>
                                            {app.status}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <select 
                                            name={`status-${app.id}`} 
                                            value={app.status}
                                            onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                                            style={{...styles.statusSelect, borderColor: getStatusColor(app.status)}}
                                        >
                                            {STATUS_OPTIONS.map(status => (
                                                <option key={status} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    {/* İşlemler Sütunu */}
                                    <td style={styles.td}>
                                        <button 
                                            onClick={() => confirmDelete(app.id)} 
                                            style={styles.deleteButton}>
                                            Sil
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Silme Onay Modalı */}
            {isConfirmModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h3 style={styles.modalTitle}>Randevu Silme Onayı</h3>
                        <p style={styles.modalText}>
                            Bu randevuyu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </p>
                        <div style={styles.modalActions}>
                            <button 
                                onClick={() => {
                                    setIsConfirmModalOpen(false);
                                    setAppointmentToDelete(null);
                                }} 
                                style={styles.cancelButton}>
                                İptal
                            </button>
                            <button 
                                onClick={handleDeleteAppointment} 
                                style={styles.confirmDeleteButton}>
                                Evet, Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sade ve Yöneticiye Uygun CSS Stilleri
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
        borderBottom: '3px solid #007bff',
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
    tableContainer: {
        overflowX: 'auto',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
    },
    th: {
        backgroundColor: '#f7fafc',
        padding: '12px 15px',
        borderBottom: '2px solid #e2e8f0',
        fontWeight: '700',
        color: '#2d3748',
        fontSize: '14px',
    },
    tr: {
        borderBottom: '1px solid #edf2f7',
        transition: 'background-color 0.1s',
        ':hover': {
            backgroundColor: '#f7fafc'
        }
    },
    td: {
        padding: '12px 15px',
        color: '#4a5568',
        fontSize: '14px',
    },
    tdNotes: {
        padding: '12px 15px',
        color: '#4a5568',
        fontSize: '14px',
        maxWidth: '200px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    statusBadge: {
        padding: '5px 10px',
        borderRadius: '15px',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px',
        display: 'inline-block',
    },
    statusSelect: {
        padding: '8px',
        borderRadius: '4px',
        borderWidth: '2px',
        fontWeight: '600',
        cursor: 'pointer',
        backgroundColor: 'white',
    },
    deleteButton: { // Yeni Sil Butonu Stili
        padding: '6px 10px',
        backgroundColor: '#f56565', // Kırmızı Ton
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '500',
        transition: 'background-color 0.3s',
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
    successMessage: {
        padding: '15px',
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
        borderRadius: '5px',
        marginBottom: '20px',
        fontWeight: '500',
        textAlign: 'center',
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
    // --- Modal Stilleri (Onay İçin) ---
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
    },
    modalTitle: {
        fontSize: '20px',
        color: '#e53e3e',
        marginBottom: '10px',
        fontWeight: '700',
    },
    modalText: {
        fontSize: '16px',
        color: '#4a5568',
        marginBottom: '25px',
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
    },
    cancelButton: {
        padding: '10px 20px',
        backgroundColor: '#a0aec0',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    },
    confirmDeleteButton: { // Silme butonu için daha çarpıcı renk
        padding: '10px 20px',
        backgroundColor: '#c53030', // Daha koyu kırmızı
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s',
    }
};

export default CompanyAdminDashboard;