'use strict'

const { json } = require('express');
const express = require('express');
const mysql = require('mysql');
const util = require('util');

const port = 3000;
const app = express();

app.use(express.json());

// Creo la conexión a la base
const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'books'
});

// Conecto con la base
conexion.connect((error) => {

    if(error){
        throw(error);
    }

    console.log("Se estableció la conexión con la base de datos");

});

// Permito el uso de async-await en la conexión para que no se quede trabaja la aplicación esperando la respuesta. Con async-await se hace asíncronamente la respuesta (sigo ejecutando lo demás de la aplicación).
const qy = util.promisify(conexion.query).bind(conexion);

// Comentario

app.listen(port, () => { console.log("Servidor en escucha en el puerto " + port)});
