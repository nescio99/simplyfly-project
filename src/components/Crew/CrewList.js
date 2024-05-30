import Menu from "../Login/Menu";
import axios from "axios";
import React, {useEffect, useState} from "react";


const CrewList = () => {
    const [users, setUsers] = useState([]);


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

return (
    <div className={"container-fluid vh-100"}>
        <div className={"row h-100"}>
            <Menu></Menu>
            <div className={"col dashboard-main"}>
                <div className={"col p-5"}>
                    <h2 className={"display-5"}>Załoga</h2>
                    <div className={"table-responsive card"}>
                        <table className="table table-light table-hover table-striped rounded-2">
                            <thead className={"table-dark"}>
                            <tr>
                                <th scope={"col"}>#</th>
                                <th scope={"col"}>Nazwa</th>
                                <th scope={"col"}>Email</th>
                                <th scope={"col"}>Rola</th>
                            </tr>
                            </thead>
                            <tbody className={"table-group-divider"}>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <th scope={"row"}></th>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

};

export default CrewList;