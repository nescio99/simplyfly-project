import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MapContainer, TileLayer, Polygon, useMapEvents, Marker, Popup } from 'react-leaflet';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import Menu from "../Login/Menu";
import { useNavigate } from 'react-router-dom';
import { FormControl } from "react-bootstrap";

const customStyles = {
    option: (provided, state) => ({
        ...provided,
        color: state.isSelected ? 'black' : 'black', // Kolor czcionki czarny
    }),
    multiValue: (provided) => ({
        ...provided,
        backgroundColor: '#e5e5e5',
    }),
    multiValueLabel: (provided) => ({
        ...provided,
        color: 'black', // Kolor czcionki czarny
    }),
};

const MissionList = () => {
    const [missions, setMissions] = useState([]);
    const [editingMission, setEditingMission] = useState(null);
    const [drones, setDrones] = useState([]);
    const [crew, setCrew] = useState([]);
    const [missionName, setMissionName] = useState('');
    const [missionDate, setMissionDate] = useState(new Date());
    const [selectedDrones, setSelectedDrones] = useState([]);
    const [selectedCrew, setSelectedCrew] = useState([]);
    const [missionArea, setMissionArea] = useState([]);
    const [mapCenter, setMapCenter] = useState([52.2297, 21.0122]); // Domyślne centrum mapy

    const fetchMissions = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get('http://localhost:3001/missions', {
                headers: { 'Authorization': token }
            });
            console.log('Missions fetched:', response.data);
            setMissions(response.data);
        } catch (error) {
            console.error('Error fetching missions:', error);
        }
    };

    const fetchDronesAndCrew = async () => {
        const token = localStorage.getItem('token');
        try {
            const dronesResponse = await axios.get('http://localhost:3001/drones', {
                headers: { 'Authorization': token }
            });
            const crewResponse = await axios.get('http://localhost:3001/users', {
                headers: { 'Authorization': token }
            });

            console.log('Drones fetched:', dronesResponse.data);
            console.log('Crew fetched:', crewResponse.data);

            setDrones(dronesResponse.data);
            setCrew(crewResponse.data.filter(user => ['Operator', 'Administrator', 'Pilot'].includes(user.role)));
        } catch (error) {
            console.error('Error fetching drones or crew:', error);
        }
    };

    useEffect(() => {
        fetchMissions();
        fetchDronesAndCrew();
    }, []);

    const handleEditMission = (mission) => {
        console.log('Editing mission:', mission);
        const selectedDrones = Array.isArray(mission.drone_ids)
            ? mission.drone_ids.map(id => {
                const drone = drones.find(drone => drone.id === id);
                console.log('Drone:', drone);
                return drone;
            }).filter(Boolean)
            : [];
        console.log('Selected drones:', selectedDrones);

        const selectedCrew = Array.isArray(mission.crew_ids)
            ? crew.filter(member => mission.crew_ids.includes(member.id))
            : [];
        console.log('Selected crew:', selectedCrew);

        setEditingMission(mission);
        setMissionName(mission.name);
        setMissionDate(new Date(mission.date));
        setSelectedDrones(selectedDrones);
        setSelectedCrew(selectedCrew);
        setMissionArea(Array.isArray(mission.area) ? mission.area : []);

        if (mission.area && mission.area.length > 0) {
            const latSum = mission.area.reduce((sum, point) => sum + point[0], 0);
            const lngSum = mission.area.reduce((sum, point) => sum + point[1], 0);
            const centerLat = latSum / mission.area.length;
            const centerLng = lngSum / mission.area.length;
            setMapCenter([centerLat, centerLng]);
        }
    };

    const handleUpdateMission = async () => {
        const token = localStorage.getItem('token');
        const updatedMission = {
            id: editingMission.id,
            name: missionName,
            date: missionDate,
            drone_ids: selectedDrones.map(drone => drone.id),
            crew_ids: selectedCrew.map(member => member.id),
            area: missionArea
        };
        try {
            await axios.put(`http://localhost:3001/missions/${editingMission.id}`, updatedMission, {
                headers: { 'Authorization': token }
            });
            alert('Misja poprawnie zaktualizowana!');
            setEditingMission(null);
            fetchMissions();
        } catch (error) {
            console.error('Error updating mission:', error);
            alert('Błąd przy aktualizacji misji');
        }
    };

    const handleDeleteMission = async (id) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:3001/missions/${id}`, {
                headers: { 'Authorization': token }
            });
            alert('Misja usunięta poprawnie!');
            fetchMissions();
        } catch (error) {
            console.error('Error deleting mission:', error);
            alert('Błąd przy usuwaniu misji');
        }
    };

    const navigate = useNavigate();
    const handleAbort = () => {
        navigate('/dashboard');
    };

    const handleMapClick = (event) => {
        setMissionArea([...missionArea, [event.latlng.lat, event.latlng.lng]]);
    };

    const handleMarkerClick = (index) => {
        const newMissionArea = missionArea.filter((_, i) => i !== index);
        setMissionArea(newMissionArea);
    };

    const handleExportMission = () => {
        if (!editingMission) return;

        const data = missionArea.map((point, index) => ({
            missionName: missionName,
            missionDate: missionDate.toLocaleDateString(),
            pointIndex: index + 1,
            latitude: point[0],
            longitude: point[1],
            drones: selectedDrones.map(drone => drone.name).join(', '),
            crew: selectedCrew.map(member => member.username).join(', '),
        }));

        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${missionName || 'mission'}_data.csv`);
    };

    const MapEvents = () => {
        useMapEvents({
            click: handleMapClick,
        });
        return null;
    };

    const role = localStorage.getItem('userRole');

    return (
        <div className={"container-fluid vh-100"}>
            <div className={"row h-100"}>
                <Menu></Menu>
                <div className={"col dashboard-main"}>
                    {editingMission ? (
                        <div className={"row h-100 p-5"}>
                            <div className={"col-6"}>
                                <h3 className={"display-5"}>Edytuj misję</h3>
                                <form>
                                    <div className={"mb-2"}>
                                        <label className={"form-label"}>Nazwa misji</label>
                                        <input className={"form-control"} type="text" value={missionName}
                                               onChange={(e) => setMissionName(e.target.value)} required/>
                                    </div>
                                    <div className={"mb-2"}>
                                        <label className={"form-label"}>Wybierz datę misji</label><br/>
                                        <DatePicker customInput={<FormControl/>} selected={missionDate} onChange={(date) => setMissionDate(date)}/>
                                    </div>
                                    <div className={"mb-2"}>
                                        <label className={"form-label"}>Wybierz drony</label>
                                        <Select placeholder={"Wybierz..."} styles={customStyles} options={drones.map(drone => ({value: drone.id, label: drone.name}))}
                                                isMulti
                                                value={selectedDrones.map(drone => ({value: drone.id, label: drone.name}))}
                                                onChange={selected => {
                                                    console.log('Selected drone IDs:', selected);
                                                    const updatedSelectedDrones = selected.map(s => {
                                                        const drone = drones.find(drone => drone.id === s.value);
                                                        console.log('Found drone:', drone);
                                                        return drone;
                                                    }).filter(Boolean);
                                                    setSelectedDrones(updatedSelectedDrones);
                                                }}/>
                                    </div>
                                    <div>
                                        <label className={"form-label"}>Wybierz członków misji</label>
                                        <Select placeholder={"Wybierz..."} styles={customStyles} options={crew.map(member => ({value: member.id, label: member.username}))}
                                                isMulti
                                                value={selectedCrew.map(member => ({
                                                    value: member.id,
                                                    label: member.username
                                                }))}
                                                onChange={members => setSelectedCrew(members.map(m => crew.find(member => member.id === m.value)))}/>
                                    </div>
                                </form>
                                <div className={"col-auto mt-4"}>
                                    <button className={"btn btn-outline-success me-2"} onClick={handleUpdateMission}>Zapisz
                                        misję
                                    </button>
                                    <button className={"btn btn-outline-light me-2"} onClick={handleExportMission}>Eksportuj do pliku</button>
                                    <button className={"btn btn-outline-danger"} onClick={handleAbort}>Anuluj zmiany</button>
                                </div>
                            </div>
                            <div className={"col-6"}>
                                <MapContainer style={{height: "800px", width: "100%", borderRadius: "25px"}}
                                              center={mapCenter} zoom={13}>
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <Polygon positions={missionArea}/>
                                    {missionArea.map((position, index) => (
                                        <Marker key={index} position={position}
                                                eventHandlers={{click: () => handleMarkerClick(index)}}>
                                            <Popup>Kliknij by usunąć</Popup>
                                        </Marker>
                                    ))}
                                    <MapEvents/>
                                </MapContainer>
                            </div>
                        </div>
                    ) : (
                        <div className={"row p-5 justify-content-sm-center justify-content-md-start"}>
                            <h2 className={"display-5"}>Lista misji</h2>
                            {missions.map(mission => (
                                <div className={"col-6 col-lg-4 mt-4"}>
                                    <div className={"card text-bg-light border-light m-1"} key={mission.id}>
                                        <div className={"card-header"}>ID: {mission.id}</div>
                                        <div className={"card-body"}>
                                            <h5 className={"card-title"}>Nazwa misji: {mission.name}</h5>
                                        </div>
                                        <ul className={"list-group list-group-flush"}>
                                            <li className={"list-group-item"}>Data misji: {new Date(mission.date).toLocaleDateString()}</li>
                                            <li className={"list-group-item"}>Drony: {Array.isArray(mission.drone_ids) ? mission.drone_ids.map(id => {
                                                const drone = drones.find(drone => drone?.id === id);
                                                console.log('Found drone for mission:', id, drone);
                                                return drone ? drone.name : 'Unknown';
                                            }).join(', ') : 'No drones'}</li>
                                            <li className={"list-group-item"}>Członkowie: {Array.isArray(mission.crew_ids) ? mission.crew_ids.map(id => crew.find(member => member.id === id)?.username || 'Unknown').join(', ') : 'No crew'}</li>
                                            <div className={"card-body"}>
                                                <button className={"card-link btn btn-outline-primary"} style={{display: role === 'Pilot' ? 'none' : 'inline'}}
                                                        onClick={() => handleEditMission(mission)}>Edytuj
                                                </button>
                                                <button className={"card-link btn btn-outline-danger"} style={{display: role === 'Pilot' ? 'none' : 'inline'}}
                                                        onClick={() => handleDeleteMission(mission.id)}>Usuń
                                                </button>
                                            </div>

                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MissionList;
