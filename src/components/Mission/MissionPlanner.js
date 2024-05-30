import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, Marker, Popup } from 'react-leaflet';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import Menu from "../Login/Menu";
import {useNavigate} from "react-router-dom";
import {FormControl} from "react-bootstrap";


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

const MissionPlanner = () => {
    const [selectedDrones, setSelectedDrones] = useState([]);
    const [selectedCrew, setSelectedCrew] = useState([]);
    const [missionArea, setMissionArea] = useState([]);
    const [drones, setDrones] = useState([]);
    const [crew, setCrew] = useState([]);
    const [missionName, setMissionName] = useState('');
    const [missionDate, setMissionDate] = useState(new Date());

    const fetchDronesAndCrew = async () => {
        const token = localStorage.getItem('token');
        try {
            const dronesResponse = await axios.get('http://localhost:3001/drones', {
                headers: { 'Authorization': token }
            });
            const crewResponse = await axios.get('http://localhost:3001/users', {
                headers: { 'Authorization': token }
            });

            setDrones(dronesResponse.data);
            setCrew(crewResponse.data.filter(user => ['Operator', 'Administrator', 'Pilot'].includes(user.role)));
        } catch (error) {
            console.error('Error fetching drones or crew:', error);
        }
    };

    useEffect(() => {
        fetchDronesAndCrew();
    }, []);

    const handleMapClick = (event) => {
        setMissionArea([...missionArea, [event.latlng.lat, event.latlng.lng]]);
    };

    const navigate = useNavigate();
    const handleAbort = () => {
        navigate('/dashboard');
    };


    const handleMarkerClick = (index) => {
        const newMissionArea = missionArea.filter((_, i) => i !== index);
        setMissionArea(newMissionArea);
    };

    const handleExport = () => {
        const data = missionArea.map((point) => ({
            lat: point[0],
            lng: point[1],
            drones: selectedDrones.map(drone => drone.label).join(', '),
            crew: selectedCrew.map(member => member.label).join(', '),
            missionName,
            missionDate: missionDate.toLocaleDateString()
        }));
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `${missionName || 'mission'}_data.csv`);
    };

    const handleSaveMission = async () => {
        const token = localStorage.getItem('token');
        const missionData = {
            name: missionName,
            date: missionDate,
            drone_ids: selectedDrones.map(drone => drone.value),
            crew_ids: selectedCrew.map(member => member.value),
            area: missionArea
        };
        try {
            await axios.post('http://localhost:3001/missions', missionData, {
                headers: { 'Authorization': token }
            });
            alert('Mission saved successfully!');
        } catch (error) {
            console.error('Error saving mission:', error);
            alert('Error saving mission');
        }
    };

    const MapEvents = () => {
        useMapEvents({
            click: handleMapClick,
        });
        return null;
    };

    return (
            <div className={"container-fluid vh-100"}>
                <div className={"row h-100"}>
                    <Menu></Menu>
                    <div className={"col dashboard-main"}>
                        <div className={"row h-100 p-5"}>
                            <div className={"col-6"}>
                                <h2 className={"display-5"}>Planowanie misji</h2>
                                <form>
                                    <div className={"mb-2"}>
                                        <label className={"form-label"}>Nazwa misji</label>
                                        <input className={"form-control"} type="text" value={missionName}
                                               onChange={(e) => setMissionName(e.target.value)} required/>
                                    </div>
                                    <div className={"mb-2"}>
                                        <label className={"form-label"}>Wybierz datę misji</label><br/>
                                        <DatePicker customInput={<FormControl/>} dateFormat="dd/MM/yyyy" selected={missionDate} onChange={(date) => setMissionDate(date)}/>
                                    </div>
                                    <div className={"mb-2"}>
                                        <label className={"form-label"}>Wybierz drony</label>
                                        <Select placeholder={"Wybierz..."} styles={customStyles}
                                                options={drones.map(drone => ({value: drone.id, label: drone.name}))}
                                                isMulti onChange={setSelectedDrones}/>
                                    </div>
                                    <div>
                                        <label className={"form-label"}>Wybierz członków misji</label>
                                        <Select placeholder={"Wybierz..."} styles={customStyles}
                                                options={crew.map(member => ({
                                                    value: member.id,
                                                    label: member.username
                                                }))} isMulti onChange={setSelectedCrew}/>
                                    </div>
                                </form>
                                <div className={"col-auto mt-4"}>
                                    <button className={"btn btn-outline-success me-2"} onClick={handleSaveMission}>Zapisz misję</button>
                                    <button className={"btn btn-outline-light me-2"} onClick={handleExport}>Eksportuj do pliku</button>
                                    <button className={"btn btn-outline-danger "} onClick={handleAbort}>Anuluj</button>
                                </div>
                            </div>
                            <div className={"col-6"}>
                                <MapContainer style={{height: "800px", width: "100%", borderRadius: "25px"}}
                                              center={[52.2297, 21.0122]}
                                              zoom={13}>
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
                    </div>
                </div>
            </div>


    );
};

export default MissionPlanner;
