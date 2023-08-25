// Entry Point of the API server

const express = require('express');
const multer = require('multer');
const fs = require('fs');

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

const upload = multer({ dest: './../public/images/' });
const modelUpload = multer({ dest: './../public/models/'});

app.use(function(req, res, next) {
    // res.header('Access-Control-Allow-Origin', '*');
    // res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
    res.header('Access-Control-Allow-Origin', 'http://139.182.76.138');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// To handle HTTP methods the Body Parser is used, to extract the entire body portion of an incoming request
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
    pool.query('SELECT filecall FROM test WHERE id=' + id)
        .then(testData => {
            console.log(testData);
            res.send(testData.rows);
        })
})

app.get('/getall', (req, res, next) => {
    pool.query('SELECT filename, preview, id FROM test')
        .then(data => {
            res.send(data);
        })
})

// handle database insert
app.post('/testdata', (req, res, next) => {
    const name = req.query["filename"];
    const preview = req.query['image']
    const fixedName = name.split(".")[0];
    pool.query('INSERT INTO test (filename, filecall, preview) VALUES (\'' + fixedName + '\', \'models/' + name + '.glb\', \'images/' + preview + '.png\');')
        .then(result => {
            res.send("Uploaded successfully");
        })
})

// handles file uploads with multer
app.post('/upload', upload.single('image'), (req, res, next) => {
    console.log("in image upload");
    const imageName = req.file;
    const originalName = req.body.filename;

    fs.rename(req.file.path, '.\\' +  __dirname + '.\\..\\public\\images\\' + originalName, (err) => {
        // if(err) throw err; 
        console.log("\nFile renamed to " + originalName); 
        res.send({imageName});
    });
})

// handle new model
app.post('/uploadmodel', modelUpload.single('model'), (req, res, next) => {
    console.log("in model upload");
    console.log(req.file);
    console.log(req.file.path);
    const modelName = req.file;
    const originalName = req.body.modelname;

    // rename model filepath
    fs.rename(req.file.path, '.\\' + __dirname + '\\..\\public\\models\\' + originalName, (err) => {
        if(err) throw err; 
        console.log("\nFile renamed to " + originalName); 
        res.send({modelName});
    });
})

// require the Routes API to create a server and run it on port 8000
const server = app.listen(8000, function () {
    console.log("callback")
    let host = server.address().address
    let port = server.address().port
    // starting the server at port 3000
})

// possible insert into database INSERT INTO models (model_data) VALUES ('{ "name": "My 3D Model", "vertices": 1000, "faces": 500 }');