const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configuración de Multer para almacenar los archivos subidos en la carpeta 'uploads'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta para subir archivos
app.post('/upload', upload.single('file'), (req, res) => {
  res.send('Archivo subido exitosamente');
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

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
