const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');


const app = express();
const PORT = process.env.PORT || 8000;

const mongodbURI = process.env.MONGODB_URI;
const dbName = 'openlib';

console.log(mongodbURI);

const client = new MongoClient(mongodbURI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    }
});

const db = client.db(dbName);

// Configuración de Multer para almacenar los archivos subidos en la carpeta 'uploads'

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const folderName = req.body.folder;
        const folderPath = path.join(__dirname, 'uploads', folderName);
        
        // Crear la carpeta si no existe
        await fs.ensureDir(folderPath);
        
        cb(null, folderPath);
    },
    filename: function (req, file, cb) {
        // Obtener el índice del archivo en el array de archivos
        const index = req.files.indexOf(file);
        const filename = `${index}${path.extname(file.originalname)}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));

app.post('/upload', upload.array('files'), (req, res) => {
    const username = req.body.username;
    const title = req.body.title;
    const type = req.body.type;
    const filepaths = req.files.map((file, index) => path.join('uploads', folder, `${index}${path.extname(file.originalname)}`));

    documento = {
      "username": username,
      "title" : title,
      "type": type,
      "comments" : [],
      "tags": []
    }

    const collection = db.collection('publicaciones');

    collection.insertOne(documento)
    .then(response => {
        console.log("Nueva Publicacion");
        console.log(documento);
    })
    .catch(error => {
        console.error(error);
        res.status(500).send('Error cargando la noticia.');
    });

    newUpload.save((err, savedUpload) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Files uploaded and saved successfully!', upload: savedUpload });
    });
});

// Ruta para listar y descargar archivos
app.get('/files', (req, res) => {
  fs.readdir(path.join(__dirname, 'uploads'), (err, files) => {
    if (err) {
      return res.status(500).send('Error al leer la carpeta de archivos');
    }

    let fileListHtml = '<h1>Archivos disponibles para descargar</h1><ul>';
    files.forEach(file => {
      fileListHtml += `<li><a href="/uploads/${file}" download>${file}</a></li>`;
    });
    fileListHtml += '</ul>';
    res.send(fileListHtml);
  });
});

app.get('/', (req, res) => { 
  console.log("muy buenas");
  res.sendFile(__dirname + '/public/main.html')
});

app.get('/subir', (req, res) => { 
  res.sendFile(__dirname + '/public/subir.html')
});


// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
