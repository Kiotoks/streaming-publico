const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const fsog = require('fs');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');


index = 0;
const app = express();
const PORT = 8000;

const mongodbURI = process.env.MONGODB_URI;
const dbName = 'openlib';


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

async function getLastFivePosts(multiplier){
  try {
      
      const pipeline = [
        {
            $skip: multiplier * 5, // Skip items for previous pages
        },
        {
            $limit: 10, // Limit the number of items on the current page
        },
      ];
      const collection = db.collection('publicaciones');
      const itemsOnPage = await collection.aggregate(pipeline).toArray();
      return itemsOnPage; 
  } catch (error) {
      console.error('Error en getLastFivePosts():', error);
      throw error;
  }
}

async function getPostsDeUsuario(usuario) {
  const collectionName = 'publicaciones';
  try {
      const collection = db.collection(collectionName);
      const documents = await collection.find({username: usuario}).toArray();
      return documents;
  } catch (error) {
      console.error('Error al obtener los documentos:', error);
      throw error;
  }
}

async function chequearUsuContra(usuario, contra){

  try {
      const collection = db.collection('usuarios');
      const document = await  collection.findOne({ usuario: usuario });
      if(document){
        if (document.contra === contra){
          return true;
        }
      }
      return false;
  } catch (error) {
      console.error('Error al obtener los documentos:', error);
      throw error;
  }

}

async function getPub(codigo){

  try {
      const collection = db.collection('publicaciones');
      const documents = await  collection.findOne({ url: codigo });
      return documents;
  } catch (error) {
      console.error('Error en getPub():', error);
      throw error;
  }

}

const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const folderName = removeSpacesAndSpecialChars(req.body.title);
        const folderPath = path.join(__dirname, 'public/posts', folderName);
        
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

const storageUser = multer.diskStorage({
  destination: async function (req, file, cb) {
      const folderName = removeSpacesAndSpecialChars(req.body.username);
      const folderPath = path.join(__dirname, 'public/icons/');
      
      // Crear la carpeta si no existe
      await fs.ensureDir(folderPath);
      
      cb(null, folderPath);
  },
  filename: function (req, file, cb) {
      // Obtener el índice del archivo en el array de archivos
      const filename = `${req.body.username}${path.extname(file.originalname)}`
      cb(null, filename);
  }
});


const upload = multer({ storage: storage });
const savePfp = multer({ storage: storageUser });

app.use(session({
  secret: 'mi_clave_secreta',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.json());

app.use(express.static('public'));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.post('/upload', upload.array('files'), (req, res) => {
    const title = req.body.title;
    const url = removeSpacesAndSpecialChars(title)
    const filepaths = req.body.url;
    
    if(req.session.loggedIn){
      console.log(req.session.username)
      username = req.session.username;

      documento = {
        "username": username,
        "title" : title,
        "comments" : [],
        "tags": [],
        "url": url
      }

      const collection = db.collection('publicaciones');

      collection.insertOne(documento)
      .then(response => {
          console.log("Nueva Publicacion");
      })
      .catch(error => {
          console.error(error);
          res.status(500).send('Error cargando la publicacion.');
      });
    }
    else{
      res.status(500).send('Error cargando la publicacion.');
    }
});

app.post('/register', savePfp.array('files'), (req, res) => {
  const username = req.body.username;
  const contra = req.body.contra;

  documento = {
    "username": username,
    "contra" : contra
  }

  const collection = db.collection('usuarios');

  collection.insertOne(documento)
  .then(response => {
     console.log("Nuevo Usuario");

      req.session.loggedIn = true;
      req.session.username = username;
      
      return res.json({ success: true });
  })
  .catch(error => {
      console.error(error);
      res.status(500).send('Error cargando la publicacion.');
      return res.json({ success: true });
  });
});

app.get('/', (req, res) => {
  getLastFivePosts(0)
    .then(response => {
      let finalResponse = [];

      // Create an array of Promises for all `fs.readdir` calls
      const filePromises = response.map(post => {
        return new Promise((resolve, reject) => {
          const directoryPath = path.join(__dirname, 'public/posts', post.url);
          
          fs.readdir(directoryPath, function (err, files) {
            if (err) {
              reject(err); // Reject the promise if there is an error
            } else {
              let params = {
                info: post,
                filenames: files
              };
              finalResponse.push(params);// Push the result to the finalResponse array
              resolve(); // Resolve the promise after processing the files
            }
          });
        });
      });

      // Wait for all the file reading operations to finish
      Promise.all(filePromises)
        .then(() => { 
          let username = ""
          if(req.session.loggedIn){
            console.log(req.session.username)
            username = req.session.username;
          }
          res.render('main', { params: finalResponse, user: username}); // Send the final response
        })
        .catch(error => {
          console.error(error);
          res.status(500).send('Error cargando la noticia.');
        });

    })
    .catch(error => {
      console.error(error);
      res.status(500).send('Error cargando la noticia.');
    });
});

app.get('/subir', (req, res) => {
  if (req.session.loggedIn) {
    res.render('subir', {user: req.session.username}) // Responder en formato JSON
  } else {
    res.render('login') // Si las credenciales son incorrectas
  }
});

app.get('/login', (req, res) => { 
  res.render('login')
});

app.get('/register', (req, res) => { 
  res.render('register')
});

app.get('/user/:usu', (req, res) => {
  const urlUsu = req.params.usu.toString();
  getPostsDeUsuario(urlUsu)
  .then(response =>{
    let finalResponse = [];

    // Create an array of Promises for all `fs.readdir` calls
    const filePromises = response.map(post => {
      return new Promise((resolve, reject) => {
        const directoryPath = path.join(__dirname, 'public/posts', post.url);
        
        fs.readdir(directoryPath, function (err, files) {
          if (err) {
            reject(err); // Reject the promise if there is an error
          } else {
            let params = {
              info: post,
              filenames: files
            };
            finalResponse.push(params);// Push the result to the finalResponse array
            resolve(); // Resolve the promise after processing the files
          }
        });
      });
    });

    // Wait for all the file reading operations to finish
    Promise.all(filePromises)
      .then(() => {
        let username = ""
        if(req.session.loggedIn){
          console.log(req.session.username)
          username = req.session.username;
        }
        res.render('usuario', { params: finalResponse, user: username, usuVista: urlUsu}); // Send the final response
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Error cargando la noticia.');
      });
  })
  .catch(error => {
      console.error('Error en la funcion de mostrar post:', error);
  });
  
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  chequearUsuContra(username, password)
  .then(response => {
    if (response) {
      req.session.loggedIn = true;
      req.session.username = username;
      return res.json({ success: true });  // Responder en formato JSON
    } else {
      return res.json({ success: false });  // Si las credenciales son incorrectas
    }
  });
});

// Cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error al cerrar sesión.');
    }
    res.redirect('/');
  });
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
