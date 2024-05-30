import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Menu from "../Login/Menu";

const DroneManager = () => {
    const [drones, setDrones] = useState([]);
    const [newDrone, setNewDrone] = useState({
        name: '',
        type: '',
        serial_number: '',
        technical_status: 'Dobry',
        availability: true
    });
    const [editingDrone, setEditingDrone] = useState(null);
    const [userRole, setUserRole] = useState('');

    const fetchDrones = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get('http://localhost:3001/drones', {
                headers: {
                    'Authorization': token
                }
            });
            setDrones(response.data);
        } catch (error) {
            console.error('Error fetching drones:', error);
        }
    };

    const fetchUserRole = () => {
        const role = localStorage.getItem('userRole');
        setUserRole(role);
    };

    useEffect(() => {
        fetchDrones();
        fetchUserRole();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (editingDrone) {
            setEditingDrone({ ...editingDrone, [name]: value });
        } else {
            setNewDrone({ ...newDrone, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            if (editingDrone) {
                await axios.put(`http://localhost:3001/drones/${editingDrone.id}`, editingDrone, {
                    headers: {
                        'Authorization': token
                    }
                });
            } else {
                await axios.post('http://localhost:3001/drones', newDrone, {
                    headers: {
                        'Authorization': token
                    }
                });
            }
            fetchDrones();
            setNewDrone({ name: '', type: '', serial_number: '', technical_status: 'Dobry', availability: true });
            setEditingDrone(null);
        } catch (error) {
            console.error('Error saving drone:', error);
        }
    };

    const handleEdit = (drone) => {
        setEditingDrone(drone);
    };

    const handleDelete = async (id) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:3001/drones/${id}`, {
                headers: {
                    'Authorization': token
                }
            });
            fetchDrones();
        } catch (error) {
            console.error('Error deleting drone:', error);
        }
    };

    return (
        <div className={"container-fluid vh-100"}>
            <div className={"row h-100"}>
                <Menu></Menu>
                <div className={"col dashboard-main"}>
                    <div className={"row h-100 p-5"}>

                        {(userRole === 'Administrator' || userRole === 'Operator') && (
                            <div className={"col"}>
                                <form onSubmit={handleSubmit}>
                                    <h2 className={"display-5"}>Zarządzaj flotą</h2>
                                    <div className={"mb-2"}>
                                        <label className={"form-label"}>Nazwa</label>
                                        <input className={"form-control"} type="text" name="name"
                                               value={editingDrone ? editingDrone.name : newDrone.name}
                                               onChange={handleChange} required/>
                                    </div>
                                    <div className={"mb-2"}>
                                        <label className={"form-label"}>Rodzaj</label>
                                        <input className={"form-control"} type="text" name="type"
                                               value={editingDrone ? editingDrone.type : newDrone.type}
                                               onChange={handleChange} required/>
                                    </div>
                                    <div className={"mb-2"}>
                                        <label className={"form-label"}>Numer seryjny</label>
                                        <input className={"form-control"} type="text" name="serial_number"
                                               value={editingDrone ? editingDrone.serial_number : newDrone.serial_number}
                                               onChange={handleChange} required/>
                                    </div>
                                    <div className={"mb-2"}>
                                        <label className={"form-label"}>Stan techniczny</label>
                                        <select className={"form-select"} name="technical_status"
                                                value={editingDrone ? editingDrone.technical_status : newDrone.technical_status}
                                                onChange={handleChange}>
                                            <option value="Dobry">Dobry</option>
                                            <option value="Średni">Średni</option>
                                            <option value="Słaby">Słaby</option>
                                        </select>
                                    </div>
                                    <div className={"form-check form-switch mb-2"}>
                                        <label className={"form-check-label"}></label>
                                        <input className={"form-check-input"} type="checkbox" name="availability"
                                               checked={editingDrone ? editingDrone.availability : newDrone.availability}
                                               onChange={(e) => handleChange({
                                                   target: {
                                                       name: 'availability',
                                                       value: e.target.checked
                                                   }
                                               })}/>
                                        <label>{editingDrone ? (editingDrone.availability ? 'Dostępny' : 'Niedostępny') : (newDrone.availability ? 'Dostępny' : 'Niedostępny')}</label>
                                    </div>
                                    <button className={"btn btn-outline-primary mt-2"}
                                            type="submit">{editingDrone ? 'Edytuj drona' : 'Dodaj drona'}</button>
                                </form>
                            </div>
                        )}
                        <div className={"col"}>
                            <h2 className={"display-5"}>Flota</h2>
                            <div className={"table-responsive card"}>
                                <table className="table table-light table-hover table-striped rounded-2">
                                    <thead className={"table-dark"}>
                                    <tr>
                                        <th scope={"col"}>#</th>
                                        <th scope={"col"}>Nazwa</th>
                                        <th scope={"col"}>Typ</th>
                                        <th scope={"col"}>Nr ser.</th>
                                        <th scope={"col"}>Stan</th>
                                        <th scope={"col"}>Dostępność</th>
                                        {(userRole === 'Administrator' || userRole === 'Operator') && (<th scope={"col"}>#</th>)}
                                        {(userRole === 'Administrator') && (<th scope={"col"}>#</th>)}
                                    </tr>
                                    </thead>
                                    <tbody className={"table-group-divider"}>
                                    {drones.map((drone) => (
                                        <tr key={drone.id}>
                                                <th scope={"row"}></th>
                                                <td>{drone.name}</td>
                                                <td>{drone.type}</td>
                                                <td>{drone.serial_number}</td>
                                                <td>{drone.technical_status}</td>
                                                <td>{drone.availability ? 'Dostępny' : 'Niedostępny'}</td>

                                                {(userRole === 'Administrator' || userRole === 'Operator') && (
                                                    <>
                                                        <td><button className={"btn btn-outline-primary mx-2 btn-sm"} onClick={() => handleEdit(drone)}>Edytuj</button></td>
                                                        {userRole === 'Administrator' &&
                                                            <td><button className={"btn btn-outline-danger btn-sm"} onClick={() => handleDelete(drone.id)}>Usuń</button></td>
                                                        }
                                                    </>
                                                )}
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

export default DroneManager;
