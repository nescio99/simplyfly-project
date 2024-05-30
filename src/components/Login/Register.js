import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Podane hasła różnią się od siebie');
            setShowModal(true);
            return;
        }
        try {
            await axios.post('http://localhost:3001/register', { username, password, email });
            navigate('/login');
        } catch (error) {
            console.error('Błąd rejestracji:', error);
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError('Błąd podczas rejestracji');
            }
            setShowModal(true);
        }
    };

    const handleClose = () => setShowModal(false);

    return (
        <div className="container-fluid vh-100 d-flex justify-content-center align-items-center">
            <div className="row login-page">
                <div className="col-12 login-logo py-3 text-center align-content-center">
                    <img className="img-fluid logo-img mt-4" src="Logo.png" alt="logo" />
                </div>
                <form onSubmit={handleSubmit} className="login-form pt-5 px-5">
                    <div className="col-auto mt-4">
                        <label>Login</label>
                        <input
                            className="form-control login-input mb-3 p-3"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="col-auto">
                        <label>Email</label>
                        <input
                            className="form-control login-input mb-3 p-3"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="col-auto">
                        <label>Hasło</label>
                        <input
                            className="form-control login-input mb-3 p-3"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="col-auto">
                        <label>Potwierdź hasło</label>
                        <input
                            className="form-control login-input mb-3 p-3"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="col-auto">
                        <p>Masz konto? <a href="/login">Zaloguj się!</a></p>
                    </div>
                    <div className="col-auto text-center mt-2">
                        <button className="login-button p-4" type="submit">Zarejestruj się</button>
                    </div>
                </form>
            </div>

            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Błąd rejestracji</Modal.Title>
                </Modal.Header>
                <Modal.Body>{error}</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Zamknij
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Register;
