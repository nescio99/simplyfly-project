import React from 'react';
import { useNavigate } from 'react-router-dom';
const Menu = () => {
    const navigate = useNavigate();

    const username = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole');
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        navigate('/login');
    };

    return (
        <div className={"col-lg-3 col-xl-auto dashboard-menu"}>
            <div className="col-12 login-logo text-center align-content-center">
                <img className="img-fluid dashboard-img" src="Logo.png" alt="logo"/>
            </div>
            <div className={"col-auto px-2 text-center mb-5"}>
                <span className={"display-6"}>Witaj, {username}!</span><br/>
                <hr/>
                <span style={{color: "grey"}}>Rola: {role}</span>
            </div>

            <div className={"col-auto mb-2 ms-2"}>
                <a className={"dashboard-link d-inline-flex align-items-center"} href={"/dashboard"}>
                    <span className="material-symbols-outlined">home</span>
                    Strona główna
                </a>
            </div>
            <div className={"col-auto mb-2 ms-2"}>
                <a className={"dashboard-link d-inline-flex align-items-center"} href={"/missions"}>
                    <span className="material-symbols-outlined">folder</span>
                    Misje
                </a>
            </div>
            <div className={"col-auto mb-2 ms-2"} style={{display: role === 'Pilot' ? 'none' : 'block'}}>
                <a className={"dashboard-link d-inline-flex align-items-center"} href={"/plan-mission"}>
                    <span className="material-symbols-outlined">folder_managed</span>
                    Zarządzaj misjami
                </a>
            </div>
            <div className={"col-auto mb-2 ms-2"}>
                <a className={"dashboard-link d-inline-flex align-items-center"} href={"/manage-drones"}>
                    <span className="material-symbols-outlined">flight_takeoff</span>
                    Flota
                </a>
            </div>
            <div className={"col-auto mb-2 ms-2"}>
                <a className={"dashboard-link d-inline-flex align-items-center"} href={"/crew-list"}>
                    <span className="material-symbols-outlined">groups</span>
                    Załoga
                </a>
            </div>
            <div className={"col-auto mb-5 ms-2"} style={{display: role === 'Administrator' ? 'block' : 'none'}}>
                <a className={"dashboard-link d-inline-flex align-items-center"} href={"/admin"}>
                    <span className="material-symbols-outlined">admin_panel_settings</span>
                    Panel administratora
                </a>
            </div>

            <div className={"col-auto ms-2"}>
                <hr/>
                <a className={"dashboard-link d-inline-flex align-items-center"} onClick={handleLogout}><span
                    className="material-symbols-outlined">logout</span> Wyloguj się</a>
            </div>

        </div>
    );
};

export default Menu;