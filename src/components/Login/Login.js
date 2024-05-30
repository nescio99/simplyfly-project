import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:3001/login', { username, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userRole', response.data.role); // Przechowywanie roli użytkownika
            localStorage.setItem('userName', response.data.username);
            navigate('/dashboard'); // Przekierowanie na dashboard
        } catch (error) {
            console.error('Error logging in:', error);
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError('Invalid username or password');
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
                        <label>Login</label><br />
                        <input
                            className="form-control login-input mb-3 p-3"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="col-auto">
                        <label>Hasło</label><br />
                        <input
                            className="form-control login-input mb-3 p-3"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="col-auto">
                        <p>Nie masz konta? <a href="/register">Zarejestruj się!</a></p>
                    </div>
                    <div className="col-auto text-center mt-5">
                        <button className="login-button p-4" type="submit">Zaloguj się</button>
                    </div>
                </form>
            </div>

            <Modal show={showModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Błąd logowania</Modal.Title>
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

export default Login;
