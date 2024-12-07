
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password:  process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    port:'3306'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
});

//function to calculate the distance between the user and the school based on the coordinates of the user and school
function Calculate_distance(latitude1, longitude1, latitude2, longitude2) {
    const earthRadius = 6371;
    const radianLatitude1 = latitude1 * Math.PI / 180;
    const radianLatitude2 = latitude2 * Math.PI / 180;
    const deltaLatitude = (latitude2 - latitude1) * Math.PI / 180;
    const deltaLongitude = (longitude2 - longitude1) * Math.PI / 180;

    const a = Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
              Math.cos(radianLatitude1) * Math.cos(radianLatitude2) * 
              Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceInKilometers = earthRadius * c;
    return distanceInKilometers;
}

app.get('/',(req,res)=>{
    res.status(201).send({message:"hello , welcome"});
})

//api to add the information of the school
app.post('/addSchool', (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    if (!name || !address || !latitude || !longitude) {
        
        return res.status(400).send({ error: 'All fields are required' });
    }

    const query = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    db.query(query, [name, address, latitude, longitude], (err, result) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to add school' });
        }
        res.status(201).send({ message: 'School added successfully', id: result.insertId });
    });
});


//api for fetching the llist of schools based on user latitude and longitude
app.get('/listSchools', (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
        console.log(req.query);
        return res.status(400).send({ error: 'User latitude and longitude are required' });
    }

    const query = 'SELECT * FROM schools';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to retrieve schools' });
        }

        const sortedSchools = results.map(school => {
            const distance = Calculate_distance(latitude, longitude, school.latitude, school.longitude);
            return { ...school, distance };
        }).sort((a, b) => a.distance - b.distance);

        res.status(200).send(sortedSchools);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
