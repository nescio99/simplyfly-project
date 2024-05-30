import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from './Menu';

const Dashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);


    return (
        <div className={"container-fluid vh-100"}>
            <div className={"row h-100"}>
                <Menu></Menu>
                <div className={"col-auto dashboard-main"}>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
