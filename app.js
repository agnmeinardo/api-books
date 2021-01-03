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

/*
*   Definición de los métodos HTTP
*
*/

// Categoría

app.get('/categoria', async (req, res) => {

    try{

        const query = "SELECT * FROM categoria";
        const respuesta = await qy(query);

        res.status(200).send(respuesta);

    }
    catch(e){
        console.log(e.message);
        res.status(413).send([]);
    }

});

app.post('/categoria', async (req, res) => {

    try{

        var nombre = req.body.nombre.toUpperCase();

        // Realizo validaciones
        if(!nombre){
            throw new Error('Faltan datos');
        }

        let query = "SELECT * FROM categoria WHERE nombre = ? ";
        let respuesta = await qy(query,[nombre]);

        if(respuesta.length > 0){
            throw new Error('Ese nombre de categoria ya existe');
        }

        query = "INSERT INTO categoria (nombre) VALUE (?)";
        respuesta = await qy(query,[nombre]);

        console.log(respuesta);
        res.status(200).send({"id": respuesta.insertId, "nombre": nombre});

    }
    catch(e){
        console.log(e.message);
        res.status(413).send({ "message": e.message});
    }

});

// Hasta acá anda bien







app.listen(port, () => { console.log("Servidor en escucha en el puerto " + port)});
