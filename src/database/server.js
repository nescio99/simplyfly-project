const express = require('express');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const dbConfig = {
    user: 'sa',
    password: 'sql123',
    server: 'LOCALHOST\\SQLEXPRESS2',
    database: 'simplifly_db',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    }
};

const secretKey = 'your_secret_key';

sql.on('error', err => {
    console.error('Global SQL error handler:', err);
});

// Swagger setup
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'simpliFly API',
            version: '1.0.0',
            description: 'API do zarządzania misjami i załogą drona',
        },
        servers: [
            {
                url: 'http://localhost:3001',
            },
        ],
    },
    apis: ['./src/database/server.js'], // Ścieżka do API Docs
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Existing routes...

app.get('/', (req, res) => {
    res.send('Witaj w API simplyFly');
});

/**
 * @swagger
 * /test-connection:
 *   get:
 *     summary: Test the connection to the database
 *     responses:
 *       200:
 *         description: Connection to the database was successful
 *       500:
 *         description: Error connecting to the database
 */
app.get('/test-connection', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        res.send('Connection to the database was successful!');
    } catch (err) {
        console.error('Error connecting to the database:', err);
        res.status(500).send('Error connecting to the database: ' + err.message);
    }
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Użytkownik poprawnie zarejestrowany
 *       500:
 *         description: Błąd podczas rejestracji
 */
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    console.log('Received registration request:', { username, email });
    try {
        let pool = await sql.connect(dbConfig);
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed password:', hashedPassword);
        let result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('email', sql.NVarChar, email)
            .input('role', sql.NVarChar, 'Pilot')
            .query('INSERT INTO users (username, password, email, role) VALUES (@username, @password, @email, @role)');
        console.log('Użytkownik poprawnie zarejestrowany:', result);
        res.status(201).json({ message: 'Użytkownik poprawnie zarejestrowany' });
    } catch (err) {
        console.error('Błąd podczas rejestracji:', err);
        res.status(500).send('Błąd podczas rejestracji: ' + err.message);
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Niepoprawne hasło lub login
 *       500:
 *         description: Error logging in user
 */
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Received login request:', { username });
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('username', sql.NVarChar, username)
            .query('SELECT * FROM users WHERE username = @username');

        if (result.recordset.length === 0) {
            console.log('User not found');
            return res.status(400).json({ message: 'Niepoprawne hasło lub login' });
        }

        const user = result.recordset[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log('Invalid password');
            return res.status(400).json({ message: 'Niepoprawne hasło lub login' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secretKey, { expiresIn: '1h' });
        console.log('User logged in successfully:', { token, username: user.username, role: user.role});
        res.json({ token, username: user.username, role: user.role });
    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).send('Error logging in user: ' + err.message);
    }
});

// Middlewares for authentication and authorization
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(403);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get user dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Welcome to your dashboard
 *       403:
 *         description: Access denied
 */
app.get('/dashboard', authenticateToken, (req, res) => {
    res.json({ message: `Welcome to your dashboard, ${req.user.username}!` });
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *       500:
 *         description: Error fetching users
 */
app.get('/users', authenticateToken, async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query('SELECT id, username, email, role FROM users');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Error fetching users: ' + err.message);
    }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Add a new user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User added successfully
 *       500:
 *         description: Error adding user
 */
app.post('/users', authenticateToken, authorizeRoles('Administrator'), async (req, res) => {
    const { username, password, email, role } = req.body;
    try {
        let pool = await sql.connect(dbConfig);
        const hashedPassword = await bcrypt.hash(password, 10);
        let result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, hashedPassword)
            .input('email', sql.NVarChar, email)
            .input('role', sql.NVarChar, role)
            .query('INSERT INTO users (username, password, email, role) VALUES (@username, @password, @email, @role)');
        res.status(201).json({ message: 'User added successfully' });
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).send('Error adding user: ' + err.message);
    }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       500:
 *         description: Error updating user
 */
app.put('/users/:id', authenticateToken, authorizeRoles('Administrator'), async (req, res) => {
    const { id } = req.params;
    const { username, email, role } = req.body;
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('id', sql.Int, id)
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('role', sql.NVarChar, role)
            .query('UPDATE users SET username = @username, email = @email, role = @role WHERE id = @id');
        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).send('Error updating user: ' + err.message);
    }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       500:
 *         description: Error deleting user
 */
app.delete('/users/:id', authenticateToken, authorizeRoles('Administrator'), async (req, res) => {
    const { id } = req.params;
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM users WHERE id = @id');
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Error deleting user: ' + err.message);
    }
});

/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     summary: Update user role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       500:
 *         description: Error updating user role
 */
app.put('/users/:id/role', authenticateToken, authorizeRoles('Administrator'), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('id', sql.Int, id)
            .input('role', sql.NVarChar, role)
            .query('UPDATE users SET role = @role WHERE id = @id');
        res.json({ message: 'User role updated successfully' });
    } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).send('Error updating user role: ' + err.message);
    }
});

/**
 * @swagger
 * /drones:
 *   get:
 *     summary: Get all drones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of drones
 *       500:
 *         description: Error fetching drones
 */
app.get('/drones', authenticateToken, async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query('SELECT * FROM drones');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching drones:', err);
        res.status(500).send('Error fetching drones: ' + err.message);
    }
});

/**
 * @swagger
 * /drones:
 *   post:
 *     summary: Add a new drone
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               serial_number:
 *                 type: string
 *               technical_status:
 *                 type: string
 *               availability:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Drone added successfully
 *       500:
 *         description: Error adding drone
 */
app.post('/drones', authenticateToken, authorizeRoles('Administrator', 'Operator'), async (req, res) => {
    const { name, type, serial_number, technical_status, availability } = req.body;
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('type', sql.NVarChar, type)
            .input('serial_number', sql.NVarChar, serial_number)
            .input('technical_status', sql.NVarChar, technical_status)
            .input('availability', sql.Bit, availability)
            .query('INSERT INTO drones (name, type, serial_number, technical_status, availability) VALUES (@name, @type, @serial_number, @technical_status, @availability)');
        res.status(201).json({ message: 'Drone added successfully' });
    } catch (err) {
        console.error('Error adding drone:', err);
        res.status(500).send('Error adding drone: ' + err.message);
    }
});

/**
 * @swagger
 * /drones/{id}:
 *   put:
 *     summary: Update a drone
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               serial_number:
 *                 type: string
 *               technical_status:
 *                 type: string
 *               availability:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Drone updated successfully
 *       500:
 *         description: Error updating drone
 */
app.put('/drones/:id', authenticateToken, authorizeRoles('Administrator', 'Operator'), async (req, res) => {
    const { id } = req.params;
    const { name, type, serial_number, technical_status, availability } = req.body;
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('type', sql.NVarChar, type)
            .input('serial_number', sql.NVarChar, serial_number)
            .input('technical_status', sql.NVarChar, technical_status)
            .input('availability', sql.Bit, availability)
            .query('UPDATE drones SET name = @name, type = @type, serial_number = @serial_number, technical_status = @technical_status, availability = @availability WHERE id = @id');
        res.json({ message: 'Drone updated successfully' });
    } catch (err) {
        console.error('Error updating drone:', err);
        res.status(500).send('Error updating drone: ' + err.message);
    }
});

/**
 * @swagger
 * /drones/{id}:
 *   delete:
 *     summary: Delete a drone
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Drone deleted successfully
 *       500:
 *         description: Error deleting drone
 */
app.delete('/drones/:id', authenticateToken, authorizeRoles('Administrator'), async (req, res) => {
    const { id } = req.params;
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM drones WHERE id = @id');
        res.json({ message: 'Drone deleted successfully' });
    } catch (err) {
        console.error('Error deleting drone:', err);
        res.status(500).send('Error deleting drone: ' + err.message);
    }
});

/**
 * @swagger
 * /missions:
 *   post:
 *     summary: Save a new mission
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               drone_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               crew_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               area:
 *                 type: array
 *                 items:
 *                   type: number
 *                   format: float
 *     responses:
 *       201:
 *         description: Mission saved successfully
 *       500:
 *         description: Error saving mission
 */
app.post('/missions', authenticateToken, authorizeRoles('Administrator', 'Operator'), async (req, res) => {
    const { name, date, drone_ids, crew_ids, area } = req.body;
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('date', sql.DateTime, date)
            .input('drone_ids', sql.NVarChar, JSON.stringify(drone_ids))
            .input('crew_ids', sql.NVarChar, JSON.stringify(crew_ids))
            .input('area', sql.NVarChar, JSON.stringify(area))
            .query('INSERT INTO missions (name, date, drone_ids, crew_ids, area) VALUES (@name, @date, @drone_ids, @crew_ids, @area)');
        res.status(201).json({ message: 'Mission saved successfully' });
    } catch (err) {
        console.error('Error saving mission:', err);
        res.status(500).send('Error saving mission: ' + err.message);
    }
});

/**
 * @swagger
 * /missions:
 *   get:
 *     summary: Get all missions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of missions
 *       500:
 *         description: Error fetching missions
 */
app.get('/missions', authenticateToken, async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query('SELECT * FROM missions');
        const missions = result.recordset.map(mission => ({
            ...mission,
            drone_ids: JSON.parse(mission.drone_ids),
            crew_ids: JSON.parse(mission.crew_ids),
            area: JSON.parse(mission.area)
        }));
        console.log('Missions:', missions);
        res.json(missions);
    } catch (err) {
        console.error('Error fetching missions:', err);
        res.status(500).send('Error fetching missions: ' + err.message);
    }
});

/**
 * @swagger
 * /missions/{id}:
 *   put:
 *     summary: Update a mission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               drone_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               crew_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               area:
 *                 type: array
 *                 items:
 *                   type: number
 *                   format: float
 *     responses:
 *       200:
 *         description: Mission updated successfully
 *       500:
 *         description: Error updating mission
 */
app.put('/missions/:id', authenticateToken, authorizeRoles('Administrator', 'Operator'), async (req, res) => {
    const { id } = req.params;
    const { name, date, drone_ids, crew_ids, area } = req.body;
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('date', sql.DateTime, date)
            .input('drone_ids', sql.NVarChar, JSON.stringify(drone_ids))
            .input('crew_ids', sql.NVarChar, JSON.stringify(crew_ids))
            .input('area', sql.NVarChar, JSON.stringify(area))
            .query('UPDATE missions SET name = @name, date = @date, drone_ids = @drone_ids, crew_ids = @crew_ids, area = @area WHERE id = @id');
        res.json({ message: 'Mission updated successfully' });
    } catch (err) {
        console.error('Error updating mission:', err);
        res.status(500).send('Error updating mission: ' + err.message);
    }
});

/**
 * @swagger
 * /missions/{id}:
 *   delete:
 *     summary: Delete a mission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mission deleted successfully
 *       500:
 *         description: Error deleting mission
 */
app.delete('/missions/:id', authenticateToken, authorizeRoles('Administrator', 'Operator'), async (req, res) => {
    const { id } = req.params;
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM missions WHERE id = @id');
        res.json({ message: 'Mission deleted successfully' });
    } catch (err) {
        console.error('Error deleting mission:', err);
        res.status(500).send('Error deleting mission: ' + err.message);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
