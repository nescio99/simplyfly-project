import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Menu from "../Login/Menu";

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        role: 'Pilot'
    });
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get('http://localhost:3001/users', {
                headers: {
                    'Authorization': token
                }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (editingUser) {
            setEditingUser({ ...editingUser, [name]: value });
        } else {
            setNewUser({ ...newUser, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            if (editingUser) {
                await axios.put(`http://localhost:3001/users/${editingUser.id}`, editingUser, {
                    headers: {
                        'Authorization': token
                    }
                });
            } else {
                await axios.post('http://localhost:3001/users', newUser, {
                    headers: {
                        'Authorization': token
                    }
                });
            }
            fetchUsers();
            setNewUser({ username: '', email: '', password: '', role: 'Pilot' });
            setEditingUser(null);
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:3001/users/${id}`, {
                headers: {
                    'Authorization': token
                }
            });
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    return (
        <div className={"container-fluid vh-100"}>
            <div className={"row h-100"}>
                <Menu></Menu>
                <div className={"col dashboard-main"}>
                    <div className={"row h-100 p-5"}>
                        <div className={"col"}>
                            <h2 className={"display-5"}>Panel administratora</h2>
                            <form onSubmit={handleSubmit}>
                                <div className={"mb-2"}>
                                    <label className={"form-label"}>Nazwa użytkownika</label>
                                    <input className={"form-control"} type="text" name="username"
                                           value={editingUser ? editingUser.username : newUser.username} onChange={handleChange}
                                           required/>
                                </div>
                                <div className={"mb-2"}>
                                    <label className={"form-label"}>Email</label>
                                    <input className={"form-control"} type="email" name="email" value={editingUser ? editingUser.email : newUser.email}
                                           onChange={handleChange} required/>
                                </div>
                                {!editingUser && (
                                    <div className={"mb-2"}>
                                        <label className={"form-label"}>Hasło</label>
                                        <input className={"form-control"} type="password" name="password" value={newUser.password} onChange={handleChange}
                                               required/>
                                    </div>
                                )}
                                <div className={"mb-2"}>
                                    <label className={"form-label"}>Rola</label>
                                    <select className={"form-select"} name="role" value={editingUser ? editingUser.role : newUser.role}
                                            onChange={handleChange}>
                                        <option value="Administrator">Administrator</option>
                                        <option value="Operator">Operator</option>
                                        <option value="Pilot">Pilot</option>
                                    </select>
                                </div>
                                <button className={"btn btn-outline-primary mt-2"} type="submit">{editingUser ? 'Edytuj' : 'Dodaj'}</button>
                            </form>
                        </div>
                        <div className={"col"}>
                            <h2 className={"display-5"}>Lista użytkowników</h2>
                            <div className={"table-responsive card"}>
                                <table className="table table-light table-hover table-striped rounded-2">
                                    <thead className={"table-dark"}>
                                    <tr>
                                        <th scope={"col"}>#</th>
                                        <th scope={"col"}>Nazwa</th>
                                        <th scope={"col"}>Email</th>
                                        <th scope={"col"}>Rola</th>
                                        <th scope={"col"}>#</th>
                                        <th scope={"col"}>#</th>
                                    </tr>
                                    </thead>
                                    <tbody className={"table-group-divider"}>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <th scope={"row"}></th>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>{user.role}</td>
                                            <td><button className={"btn btn-outline-primary btn-sm"} onClick={() => handleEdit(user)}>Edytuj</button></td>
                                            <td><button className={"btn btn-outline-danger btn-sm"} onClick={() => handleDelete(user.id)}>Usuń</button></td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>


    );
};

export default AdminPanel;
