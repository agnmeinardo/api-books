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
        res.status(413).send({"mensaje": e.message});
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
        res.status(413).send({ "mensaje": e.message});
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
        res.status(200).send({"mensaje": "Se borró correctamente"});


    }
    catch(e){
        console.log(e.message);
        res.status(413).send({"mensaje": e.message});
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
        res.status(413).send({"mensaje": e.message});
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
        res.status(413).send({ "mensaje": e.message});
    }

});

app.put('/persona/:id', async (req,res) => {

    try{
        const id = req.params.id;
        const nombreNuevo = req.body.nombre.toUpperCase();
        const apellidoNuevo = req.body.apellido.toUpperCase();
        const mail = req.body.mail; // El "no se puede modificar" puede ir en la vista y así no se hacen modificaciones desde el server.
        const aliasNuevo = req.body.alias;

        let query = "SELECT COUNT(*) AS cantidad FROM persona WHERE id_persona = ?";
        let respuesta = await qy(query, [id]);
        const cantidad = respuesta[0].cantidad;

        if(cantidad == 0){
            throw new Error("No se encuentra esa persona");
        }

        query = "UPDATE persona SET nombre = ? , apellido = ? , alias = ? WHERE id_persona = ?";
        respuesta = await qy(query, [nombreNuevo,apellidoNuevo,aliasNuevo,id]);
        res.status(200).send({"id": id, "nombre": nombreNuevo, "apellido": apellidoNuevo, "alias": aliasNuevo});

    }
    catch(e){
        console.log(e.message);
        res.status(413).send({ "mensaje": e.message});
    }

});


app.delete('/persona/:id', async (req,res) => {

    try{

        const id = req.params.id;

        let query = "SELECT * FROM persona WHERE id_persona = ?";
        let respuesta = await qy(query,[id]);

        if(respuesta.length == 0){
            throw new Error("No existe esa persona");
        }

        query = "SELECT COUNT(*) AS cantidad FROM libro WHERE id_persona = ?";
        respuesta = await qy(query,[id]);
        const cantidad = respuesta[0].cantidad;

        if(cantidad > 0){
            throw new Error("Esa persona tiene libros asociados; no se puede eliminar");
        }

        query = "DELETE FROM persona WHERE id_persona = ?";
        respuesta = await qy(query,[id]);
        res.status(200).send({"mensaje": "Se borró correctamente"});

    }
    catch(e){
        console.log(e.message);
        res.status(413).send({"mensaje": e.message});
    }

});


/** 
 *  Libro
 */

app.get('/libro', async (req, res) => {

    try{

        const query = "SELECT * FROM libro";
        const respuesta = await qy(query);

        res.status(200).send(respuesta);

    }
    catch(e){
        console.log(e.message);
        res.status(413).send({"mensaje": e.message});
    }

});

app.get('/libro/:id', async (req, res) => {

    try{

        const query = "SELECT * FROM libro WHERE id_libro = ?";

        const respuesta = await qy(query,[req.params.id]);

        if(respuesta.length == 0) {
            throw new Error('Libro no encontrado');
        }

        res.status(200).send({"id": respuesta[0].id_libro, "nombre": respuesta[0].nombre, "descripcion": respuesta[0].descripcion, "id_categoria": respuesta[0].id_categoria , "id_persona": respuesta[0].id_persona});

    }
    catch(e){
        console.log(e.message);
        res.status(413).send({"mensaje": e.message});
    }

});

app.post('/libro', async (req, res) => {

    try{

        const nombre = req.body.nombre.toUpperCase(); // Se settea el nombre en upperCase para evitar errores de literalidad.
        const descripcion = req.body.descripcion;
        const id_categoria = req.body.id_categoria;
        let id_persona = req.body.id_persona;
        let query, respuesta;

        // Realizo validaciones
        if(!nombre || !id_categoria){
            throw new Error('Nombre y categoria son datos obligatorios');
        }

        if(!id_persona){
            id_persona = null;
        } else {

            query = "SELECT * FROM persona WHERE id_persona = ? ";
            respuesta = await qy(query,[id_persona]);
    
            if(respuesta.length == 0){
                throw new Error('No existe la persona indicada');
            }
        }

        query = "SELECT * FROM categoria WHERE id_categoria = ? ";
        respuesta = await qy(query,[id_categoria]);

        if(respuesta.length == 0){
            throw new Error('No existe la categoria indicada');
        }

        query = "SELECT * FROM libro WHERE nombre = ?";
        respuesta = await qy(query,[nombre]);

        if(respuesta.length > 0){
            throw new Error('Ese libro ya existe');
        }

        query = "INSERT INTO libro (nombre,descripcion,id_categoria,id_persona) VALUE (?,?,?,?)";
        respuesta = await qy(query,[nombre, descripcion, id_categoria, id_persona]);

        res.status(200).send({"id": respuesta.insertId, "nombre": nombre, "descripcion": descripcion, "id_categoria": id_categoria, "id_persona": id_persona});

    }
    catch(e){
        console.log(e.message);
        res.status(413).send({ "mensaje": e.message});
    }

});



app.delete('/libro/:id', async (req,res) => {

    try{

        const id = req.params.id;

        // Realizo validaciones
        let query = "SELECT * FROM libro WHERE id_libro = ?";
        let respuesta = await qy(query,[id]);

        if(respuesta.length == 0){
            throw new Error("No existe ese libro");
        }

        console.log(respuesta[0].id_persona);
        if(respuesta[0].id_persona >= 0){
            throw new Error("Ese libro prestado no se puede borrar");
        }

        query = "DELETE FROM libro WHERE id_libro = ?";
        respuesta = await qy(query,[id]);
        res.status(200).send({"mensaje": "Se borró correctamente"});

    }
    catch(e){
        console.log(e.message);
        res.status(413).send({"mensaje": e.message});
    }

});

app.put('/libro/:id', async (req,res) => {

    try{
        const id = req.params.id;
        const nombreModificado = req.body.nombre.toUpperCase();
        const descripcionModificada = req.body.descripcion;
        const id_categoria = req.body.id_categoria;
        const id_persona = req.body.id_persona;

        // Realizo las validaciones
        // Chequeo si existe el libro
        let query = "SELECT COUNT(*) AS cantidad FROM libro WHERE id_libro = ?";
        let respuesta = await qy(query, [id]);
        let cantidad = respuesta[0].cantidad;

        if(cantidad == 0){
            throw new Error("No se encuentra ese libro");
        }

        // Valido que no esté intentando modificar otro dato que no sea descripción; se puede resolver en la vista
        // Si encuentro un libro con los mismos valores pasados por el body, significa que no está intentando modificar otro dato que no sea la descripción
        query = "SELECT COUNT(*) AS cantidad FROM libro WHERE id_libro = ? AND nombre = ? AND id_categoria = ? AND id_persona = ?";
        respuesta = await qy(query, [id, nombreModificado, id_categoria, id_persona]);
        cantidad = respuesta[0].cantidad;

        if(cantidad == 0){
            throw new Error("Sólo se puede modificar la descripción del libro");
        }


        query = "UPDATE libro SET descripcion = ? WHERE id_libro = ?";
        respuesta = await qy(query, [descripcionModificada,id]);
        res.status(200).send({"id": id, "nombre": nombreModificado, "descripcion": descripcionModificada, "id_categoria": id_categoria, "id_persona": id_persona});

    }
    catch(e){
        console.log(e.message);
        res.status(413).send({ "mensaje": e.message});
    }

});



app.listen(port, () => { console.log("Servidor en escucha en el puerto " + port)});
