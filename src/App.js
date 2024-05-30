import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login/Login';
import Register from './components/Login/Register';
import Dashboard from './components/Login/Dashboard';
import DroneManager from './components/Drones/DroneManager';
import AdminPanel from './components/Admin/AdminPanel';
import MissionPlanner from './components/Mission/MissionPlanner';
import MissionList from './components/Mission/MissionList';
import CrewList from "./components/Crew/CrewList";

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    return token && userRole === 'Administrator' ? children : <Navigate to="/dashboard" />;
};

const NotPilotRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    return token && userRole !== 'Pilot' ? children : <Navigate to="/dashboard" />;
};

const PublicRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? <Navigate to="/dashboard" /> : children;
};

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/login" element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    } />
                    <Route path="/register" element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    } />
                    <Route path="/dashboard" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/manage-drones" element={
                        <PrivateRoute>
                            <DroneManager />
                        </PrivateRoute>
                    } />
                    <Route path="/admin" element={
                        <AdminRoute>
                            <AdminPanel />
                        </AdminRoute>
                    } />
                    <Route path="/plan-mission" element={
                        <NotPilotRoute>
                            <MissionPlanner />
                        </NotPilotRoute>
                    } />
                    <Route path="/missions" element={
                        <PrivateRoute>
                            <MissionList />
                        </PrivateRoute>
                    } />
                    <Route path="/crew-list" element={
                        <PrivateRoute>
                            <CrewList />
                        </PrivateRoute>
                    } />
                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;