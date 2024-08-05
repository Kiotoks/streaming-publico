const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const fsog = require('fs');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');


index = 0;
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

// Configuración de Multer para almacenar los archivos subidos en la carpeta 'public'

function removeSpacesAndSpecialChars(str) {
  return str.replace(/[\s~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|_+=-]/g, '');
}

async function getPub(codigo){

  try {
      const collection = db.collection('publicaciones');
      const documents = await  collection.findOne({ url: codigo });
      return documents;
  } catch (error) {
      console.error('Error al obtener los documentos:', error);
      throw error;
  }

}

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const folderName = removeSpacesAndSpecialChars(req.body.title);
        const folderPath = path.join(__dirname, 'public', folderName);
        
        // Crear la carpeta si no existe
        await fs.ensureDir(folderPath);
        
        cb(null, folderPath);
    },
    filename: function (req, file, cb) {
        // Obtener el índice del archivo en el array de archivos
        const filename = `${index}${path.extname(file.originalname)}`;
        index ++;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.post('/upload', upload.array('files'), (req, res) => {
    const username = req.body.username;
    const title = req.body.title;
    const type = req.body.type;
    const url = removeSpacesAndSpecialChars(title)
    const filepaths = req.body.url;

    documento = {
      "username": username,
      "title" : title,
      "type": type,
      "comments" : [],
      "tags": [],
      "url": url
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
});

app.get('/', (req, res) => { 
  res.render('main')
});

app.get('/subir', (req, res) => { 
  res.render('subir')
});

app.get('/post/:cod', (req, res) => {
  const urlPub = req.params.cod.toString();
  getPub(urlPub)
  .then(post =>{
      console.log(post)
      const directoryPath = path.join(__dirname, 'public', post.url);
      console.log(directoryPath);
      fs.readdir(directoryPath, function (err, files) {
        params = {
          info: post,
          filenames : files
        }
        console.log(params);
        res.render(post.type, { params: params });
      });
  })
  .catch(error => {
      console.error('Error en la funcion de mostrar post:', error);
  });
  
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
