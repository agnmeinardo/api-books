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

/**
 *  Email validator sin dependencias
 */
var emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

function isEmailValid(email) {
    if (!email)
        return false;

    if(email.length>254)
        return false;

    var valid = emailRegex.test(email);
    if(!valid)
        return false;

    var parts = email.split("@");
    if(parts[0].length>64)
        return false;

    var domainParts = parts[1].split(".");
    if(domainParts.some(function(part) { return part.length>63; }))
        return false;

    return true;
}


/*
*   Definición de los métodos HTTP
*
*/

/**
 * Categoría
 */

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

app.get('/categoria/:id', async (req, res) => {

    try{

        console.log(req.params.id);
        const query = "SELECT * FROM categoria WHERE id_categoria = ?";

        const respuesta = await qy(query,[req.params.id]);
        console.log(respuesta);

        if(respuesta.length == 0) {
            throw new Error('Categoria no encontrada');
        }

        res.status(200).send({"id": respuesta[0].id_categoria, "nombre": respuesta[0].nombre});

    }
    catch(e){
        console.log(e.message);
        res.status(413).send({"message": e.message});
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

app.delete('/categoria/:id', async (req,res) => {

    try{

        const id = req.params.id;
        let query = "SELECT * FROM categoria WHERE id_categoria = ?";
        let respuesta = await qy(query,[id]);

        console.log(respuesta);

        if(respuesta.length == 0){
            throw new Error('No existe la categoria indicada');
        }

        query = "SELECT COUNT(*) AS cantidad FROM libro WHERE id_categoria = ?";
        respuesta = await qy(query,[id]);
        const cantidad = respuesta[0].cantidad;
        
        if(cantidad > 0){
            throw new Error('Categoria con libros asociados; no se puede eliminar');
        }

        query = "DELETE FROM categoria WHERE id_categoria = ?";
        respuesta = await qy(query,[id]);
        res.status(200).send({"message": "Se borró correctamente"});


    }
    catch(e){
        console.log(e.message);
        res.status(413).send({"message": e.message});
    }


});

/** 
 *  Persona
 */

app.get('/persona', async (req, res) => {

    try{

        const query = "SELECT * FROM persona";
        const respuesta = await qy(query);

        res.status(200).send(respuesta);

    }
    catch(e){
        console.log(e.message);
        res.status(413).send([]);
    }

});

app.get('/persona/:id', async (req, res) => {

    try{

        const query = "SELECT * FROM persona WHERE id_persona = ?";

        const respuesta = await qy(query,[req.params.id]);
        console.log(respuesta);

        if(respuesta.length == 0) {
            throw new Error('Persona no encontrada');
        }

        res.status(200).send({"id": respuesta[0].id_categoria, "nombre": respuesta[0].nombre, "apellido": respuesta[0].apellido, "alias": respuesta[0].alias , "mail": respuesta[0].mail});

    }
    catch(e){
        console.log(e.message);
        res.status(413).send({"message": e.message});
    }

});


app.post('/persona', async (req, res) => {

    try{

        let nombre = req.body.nombre.toUpperCase(); // UpperCase?
        let apellido = req.body.apellido.toUpperCase();
        let mail = req.body.mail; // Los tomo literal; no se distinguen minúsculas y mayúsculas.
        let alias = req.body.alias;

        // Chequeo si existe el mail
        let query = "SELECT * FROM persona WHERE mail = ?";
        let respuesta = await qy(query,[mail]);

        if(respuesta.length > 0){
            throw new Error('El email ya se encuenta registrado');
        }

        // Si existe, chequeo que sea válido el formato del mail ingresado
        if(!isEmailValid(mail)){
            throw new Error('El formato del email ingresado es incorrecto');
        }

        // Valido que haya ingresado los cuatro datos
        if(!nombre || !apellido || !alias || !mail){
            throw new Error('Faltan datos');
        }

        query = "INSERT INTO persona (nombre,apellido,mail,alias) VALUE (?,?,?,?)";
        respuesta = await qy(query,[nombre,apellido,mail,alias]);

        console.log(respuesta);
        res.status(200).send({"id": respuesta.insertId, "nombre": nombre, "apellido": apellido, "mail": mail, "alias": alias});

    }
    catch(e){
        console.log(e.message);
        res.status(413).send({ "message": e.message});
    }

});




app.listen(port, () => { console.log("Servidor en escucha en el puerto " + port)});
