// Entry Point of the API server

const express = require('express');

// creates an Express application, and express() is a top-level function from express module

const app = express();
const Pool = require('pg').Pool;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'tempbackend',
    password: 'Pw4admin',
    dialect: 'postgres',
    port: 5432
});

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// To handle HTTP methods the Body Parser is used, to exteract the entire body portion of an incoming request
// also exposes it on req.body

const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));

pool.connect((err, client, release) => {
    if (err) {
        return console.error(
            'Error acquiring client', err.stack)
    }
    client.query('SELECT NOW()', (err, result) => {
        release()
        if (err) {
            return console.error(
                'Error executing query', err.stack)
        }
        console.log("Connected to Database !")
    })
})

app.get('/testdata', (req, res, next) => {
    const id = req.query["id"];
    console.log("TEST DATA :");
    // pool.query('Select * from test')
    pool.query('SELECT filecall FROM test WHERE id=' + id)
        .then(testData => {
            console.log(testData);
            res.send(testData.rows);
        })
})

// require the Routes API to create a server and run it on port 8000
const server = app.listen(8000, function () {
    console.log("callback")
    let host = server.address().address
    let port = server.address().port
    // starting the server at port 3000
})

// possible insert into database INSERT INTO models (model_data) VALUES ('{ "name": "My 3D Model", "vertices": 1000, "faces": 500 }');