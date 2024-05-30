import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Map = () => {
    const [positions, setPositions] = useState([]);

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                const newPosition = [e.latlng.lat, e.latlng.lng];
                setPositions((current) => [...current, newPosition]);
            }
        });
        return null;
    };

    return (
        <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '100vh', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapEvents />
            {positions.length > 2 && <Polygon positions={positions} />}
        </MapContainer>
    );
};

export default Map;
