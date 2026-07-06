// Entry Point of the API server

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

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

const upload = multer({ dest: './../public/images/', limits: { fileSize: 10 * 1024 * 1024 } });
const modelUpload = multer({ dest: './../public/models/', limits: { fileSize: 25 * 1024 * 1024 } });

// Resolved upload roots and a helper to confine a client-supplied name to that root.
// Strips any path components, blocks traversal, and enforces an extension allowlist.
const imagesBase = path.resolve(__dirname, '../public/images');
const modelsBase = path.resolve(__dirname, '../public/models');

function safeUploadTarget(base, rawName, allowedExt) {
    const safeName = path.basename(String(rawName || ''));
    if (!safeName || !allowedExt.test(safeName)) return null;
    const target = path.resolve(base, safeName);
    if (target !== base && !target.startsWith(base + path.sep)) return null;
    return target;
}

// app.use(function(req, res, next) {
//     // res.header('Access-Control-Allow-Origin', '*');
//     // res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:3000');
//     res.header('Access-Control-Allow-Origin', 'http://139.182.76.138');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     next();
// });

// origin: ['http://139.182.76.138', 'http://139.182.112.89', 'http://137.184.187.45', 'http://127.0.0.1:3000'],

let corsOptions = {
    origin: ['https://devapp02.libretexts.org', 'https://137.184.187.45:80', 'http://127.0.0.1:3000'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
}

app.use(cors(corsOptions))

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

// These endpoints are dev/test only and must never be reachable in production.
const blockInProd = (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Endpoint disabled in production' });
    }
    next();
};

app.get('/api/testdata', blockInProd, (req, res, next) => {
    const { id } = req.query;
    if (!/^\d+$/.test(String(id))) {
        return res.status(400).json({ error: 'Invalid id' });
    }
    pool.query('SELECT filecall, labels FROM test WHERE id = $1', [id])
        .then(testData => {
            res.send(testData.rows);
        })
        .catch(e => {
            console.error(e);
            res.status(500).json({ error: 'Query failed' });
        });
})

app.get('/api/getall', (req, res, next) => {
    pool.query('SELECT filename, preview, id, classtype FROM test ORDER BY id')
        .then(data => {
            res.send(data);
        })
        .catch(e => {
            console.log(e);
        })
})

// handle database insert
app.post('/api/testdata', blockInProd, (req, res, next) => {
    const name = req.query["filename"];
    const preview = req.query['image'];
    const classname = req.query['classtype'];
    if (!name) {
        return res.status(400).json({ error: 'Missing filename' });
    }
    const fixedName = String(name).split(".")[0];
    // NOTE: labels is still coerced from a raw string into a Postgres array literal.
    // Validate/rebuild it from an allow-listed list before trusting it fully.
    const labels = req.query["labels"] === "undefined" ? '{}' : '{' + req.query["labels"] + '}';
    pool.query(
        `INSERT INTO test (filename, filecall, preview, classType, labels)
         VALUES ($1, $2, $3, $4, $5)`,
        [fixedName, `models/${name}.glb`, `images/${preview}.png`, classname, labels]
    )
        .then(result => {
            res.send("Uploaded successfully");
        })
        .catch(e => {
            console.error(e);
            res.status(500).json({ error: 'Insert failed' });
        });
})

// handles file uploads with multer
app.post('/api/upload', upload.single('image'), (req, res, next) => {
    console.log("in image upload");
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const imageName = req.file;
    const target = safeUploadTarget(imagesBase, req.body.filename, /\.(png|jpe?g|webp|gif)$/i);
    if (!target) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: 'Invalid filename' });
    }

    fs.rename(req.file.path, target, (err) => {
        if (err) {
            console.error('Image rename failed', err);
            fs.unlink(req.file.path, () => {});
            return res.status(500).json({ error: 'Upload failed' });
        }
        console.log("\nFile renamed to " + path.basename(target));
        res.send({ imageName });
    });
})

// handle new model
app.post('/api/uploadmodel', modelUpload.single('model'), (req, res, next) => {
    console.log("in model upload");
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const modelName = req.file;
    const target = safeUploadTarget(modelsBase, req.body.modelname, /\.(glb|obj|stl)$/i);
    if (!target) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: 'Invalid filename' });
    }

    // rename model filepath
    fs.rename(req.file.path, target, (err) => {
        if (err) {
            console.error('Model rename failed', err);
            fs.unlink(req.file.path, () => {});
            return res.status(500).json({ error: 'Upload failed' });
        }
        console.log("\nFile renamed to " + path.basename(target));
        res.send({ modelName });
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