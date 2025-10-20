/*-----------------------------------------------------------------------------------------------------------------
  MesaAyuda.js - Servidor de la API REST
  UADER - IS1 - Caso de estudio MesaAyuda
  Dr. Pedro E. Colla 2023, 2025
 *----------------------------------------------------------------------------------------------------------------*/
// Importación de módulos
import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import AWS from 'aws-sdk';
import accessKeyId from '../accessKeyId.js';
import secretAccessKey from '../secretAccessKey.js';

console.log("Comenzando servidor...");

// --- Configuración de Express ---
const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

// --- Configuración de AWS DynamoDB ---
let awsConfig = {
    "region": "us-east-1",
    "endpoint": "http://dynamodb.us-east-1.amazonaws.com",
    "accessKeyId": accessKeyId,
    "secretAccessKey": secretAccessKey
};
AWS.config.update(awsConfig);
let docClient = new AWS.DynamoDB.DocumentClient();

console.log("Configuración de AWS lista.");

// --- Funciones auxiliares ---

// Función para parsear un objeto JSON
function jsonParser(keyValue, stringValue) {
    var string = JSON.stringify(stringValue);
    var objectValue = JSON.parse(string);
    return objectValue[keyValue];
}

// Función para escanear la tabla 'cliente' por contacto (email)
async function scanDb(contacto) {
    const paramsScan = {
        TableName: "cliente",
        FilterExpression: 'contacto = :contacto_val', // Corregido para buscar por 'contacto'
        ExpressionAttributeValues: { ':contacto': contacto }
    };
    var objectPromise = await docClient.scan(paramsScan).promise().then((data) => {
        return data.Items;
    });
    return objectPromise;
}

// Función para escanear la tabla 'ticket' por clienteID
async function scanDbTicket(clienteID) {
    const paramsScan = {
        TableName: "ticket",
        FilterExpression: 'clienteID = :clienteID',
        ExpressionAttributeValues: { ':clienteID': clienteID }
    };
    var objectPromise = await docClient.scan(paramsScan).promise().then((data) => {
        return data.Items;
    });
    return objectPromise;
}

/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
 * API REST Cliente                               *
 *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*/

// Ruta de prueba para verificar que la API funciona
app.get('/api/cliente', (req, res) => {
    res.status(200).send({ response: "OK", message: "API Ready" });
    console.log("API cliente: OK");
});

// Obtener un cliente por su ID
app.post('/api/getCliente/:id', (req, res) => {
    const { id } = req.params;
    console.log("getCliente: id(" + id + ")");
    var params = {
        TableName: "cliente",
        Key: { "id": id }
    };
    docClient.get(params, function(err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({ response: "ERROR", message: "DB access error " + err }));
        } else {
            if (Object.keys(data).length !== 0) {
                res.status(200).send(JSON.stringify({ "response": "OK", "cliente": data.Item }), null, 2);
            } else {
                res.status(404).send(JSON.stringify({ "response": "ERROR", message: "Cliente no existe" }), null, 2);
            }
        }
    });
});

// Login de cliente por EMAIL y contraseña
app.post('/api/loginCliente', (req, res) => {
    const { email, password } = req.body;
    console.log("loginCliente: email(" + email + ") password (" + password + ")");

    if (!password || !email) {
        return res.status(400).send({ response: "ERROR", message: "Email y Password son requeridos" });
    }

    const paramsScan = {
        TableName: "cliente",
        FilterExpression: "contacto = :email_val",
        ExpressionAttributeValues: { ":email_val": email }
    };

    docClient.scan(paramsScan, function(err, data) {
        if (err) {
            console.error("DEBUG: Error de DynamoDB:", err); // <-- LOG DE ERROR DE BD
            return res.status(500).send(JSON.stringify({ response: "ERROR", message: "DB access error " + err }));
        }

        // --- ESTE ES EL PUNTO CLAVE ---
        if (data.Items.length !== 1) {
            // --- NUEVO LOG ---
            console.error(`DEBUG: 🚫 Usuario NO encontrado. Items.length: ${data.Items.length} para el email: ${email}`);
            return res.status(401).send(JSON.stringify({ response: "ERROR", message: "Credenciales inválidas" }));
        }

        // Si llegamos aquí, el usuario SÍ se encontró
        const clienteEncontrado = data.Items[0];
        console.log(`DEBUG: ✅ Usuario SÍ encontrado: ${clienteEncontrado.contacto}`); // --- NUEVO LOG ---

        if (password === clienteEncontrado.password) {
            // El login fue exitoso...
            if (clienteEncontrado.activo === true) {
                res.status(200).send(JSON.stringify({
                    response: "OK",
                    "id": clienteEncontrado.id,
                    "nombre": clienteEncontrado.nombre,
                    "contacto": clienteEncontrado.contacto,
                    "fecha_ultimo_ingreso": clienteEncontrado.fecha_ultimo_ingreso
                }));
            } else {
                console.error("DEBUG: ⚠️ Usuario encontrado pero NO ACTIVO."); // --- NUEVO LOG ---
                res.status(403).send(JSON.stringify({ response: "ERROR", message: "Cliente no activo" }));
            }
        } else {
            // --- NUEVO LOG ---
            console.error(`DEBUG: 🔑 Contraseña INCORRECTA.`);
            console.error(`     -> Enviada:   [${password}]`);
            console.error(`     -> Esperada: [${clienteEncontrado.password}]`);
            res.status(401).send(JSON.stringify({ response: "ERROR", message: "Credenciales inválidas" }));
        }
    });
});

// Agregar un nuevo cliente
app.post('/api/addCliente', (req, res) => {
    const { contacto, password, nombre } = req.body;
    console.log("addCliente: contacto(" + contacto + ") nombre(" + nombre + ") password(" + password + ")");

    if (!password || !nombre || !contacto) {
        return res.status(400).send({ response: "ERROR", message: "Nombre, Password y Contacto son requeridos" });
    }

    scanDb(contacto)
        .then(resultDb => {
            if (Object.keys(resultDb).length !== 0) {
                return res.status(409).send({ response: "ERROR", message: "Cliente ya existe" });
            }

            const hoy = new Date().toLocaleDateString('es-AR');
            const newCliente = {
                id: crypto.randomUUID(), // Generar un ID único
                contacto: contacto,
                nombre: nombre,
                password: password, // ATENCIÓN: Guardar passwords en texto plano es inseguro. Usar bcrypt.
                activo: true,
                registrado: true,
                primer_ingreso: false,
                fecha_alta: hoy,
                fecha_cambio_password: hoy,
                fecha_ultimo_ingreso: hoy,
            };

            const paramsPut = {
                TableName: "cliente",
                Item: newCliente,
                ConditionExpression: 'attribute_not_exists(id)',
            };

            docClient.put(paramsPut, function(err, data) {
                if (err) {
                    res.status(500).send(JSON.stringify({ response: "ERROR", message: "DB error" + err }));
                } else {
                    res.status(201).send(JSON.stringify({ response: "OK", "cliente": newCliente }));
                }
            });
        });
});

// Actualizar datos de un cliente
app.post('/api/updateCliente', (req, res) => {
    const { id, nombre, password } = req.body;
    const activo = ((req.body.activo + '').toLowerCase() === 'true');
    const registrado = ((req.body.registrado + '').toLowerCase() === 'true');

    if (!id || !nombre || !password) {
        return res.status(400).send({ response: "ERROR", message: "ID, Nombre y Password son requeridos" });
    }
    
    const paramsUpdate = {
        TableName: "cliente",
        Key: { "id": id },
        UpdateExpression: "SET #n = :n, #p = :p, #a = :a, #r = :r",
        ExpressionAttributeNames: {
            "#n": "nombre", "#p": "password",
            "#a": "activo", "#r": "registrado"
        },
        ExpressionAttributeValues: {
            ":n": nombre, ":p": password,
            ":a": activo, ":r": registrado
        },
        ReturnValues: "ALL_NEW",
        ConditionExpression: 'attribute_exists(id)' // Asegurarse que el cliente exista
    };

    docClient.update(paramsUpdate, function(err, data) {
        if (err) {
            res.status(500).send(JSON.stringify({ response: "ERROR", message: "DB access error " + err }));
        } else {
            res.status(200).send(JSON.stringify({ response: "OK", message: "updated", "data": data.Attributes }));
        }
    });
});

// Cambiar la contraseña de un cliente
app.post('/api/resetCliente', (req, res) => {
    const { id, password } = req.body;

    if (!id || !password) {
        return res.status(400).send({ response: "ERROR", message: "ID y Password son requeridos" });
    }

    const paramsUpdate = {
        TableName: "cliente",
        Key: { "id": id },
        UpdateExpression: "SET #p = :p",
        ExpressionAttributeNames: { "#p": "password" },
        ExpressionAttributeValues: { ":p": password },
        ReturnValues: "ALL_NEW",
        ConditionExpression: 'attribute_exists(id)'
    };

    docClient.update(paramsUpdate, function(err, data) {
        if (err) {
            res.status(500).send(JSON.stringify({ response: "ERROR", message: "DB access error " + err }));
        } else {
            res.status(200).send(JSON.stringify({ response: "OK", message: "updated", "data": data.Attributes }));
        }
    });
});


/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
 * API REST Ticket                               *
 *=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*/

// Listar todos los tickets de un cliente
app.post('/api/listarTicket', (req, res) => {
    const { clienteID } = req.body;

    if (!clienteID) {
        return res.status(400).send({ response: "ERROR", message: "clienteID no informado" });
    }

    scanDbTicket(clienteID)
        .then(resultDb => {
            if (resultDb.length === 0) {
                res.status(404).send({ response: "OK", message: "El cliente no tiene tickets", data: [] });
            } else {
                res.status(200).send(JSON.stringify({ response: "OK", "data": resultDb }));
            }
        });
});

// Obtener los detalles de un ticket por su ID
app.post('/api/getTicket', (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).send({ response: "ERROR", message: "ID del ticket no informado" });
    }
    const params = {
        TableName: "ticket",
        Key: { "id": id }
    };
    docClient.get(params, function(err, data) {
        if (err) {
            res.status(500).send(JSON.stringify({ response: "ERROR", message: "DB access error " + err }));
        } else {
            if (Object.keys(data).length !== 0) {
                res.status(200).send(JSON.stringify({ response: "OK", "data": data.Item }));
            } else {
                res.status(404).send({ response: "ERROR", message: "Ticket inválido" });
            }
        }
    });
});

// Agregar un nuevo ticket
app.post('/api/addTicket', (req, res) => {
    const { clienteID, solucion, descripcion } = req.body;
    const hoy = new Date().toLocaleDateString('es-AR');

    const newTicket = {
        id: crypto.randomUUID(),
        clienteID: clienteID,
        estado_solucion: 1, // Estado inicial
        solucion: solucion || "",
        descripcion: descripcion,
        fecha_apertura: hoy,
        ultimo_contacto: hoy
    };

    const paramsPut = {
        TableName: "ticket",
        Item: newTicket,
        ConditionExpression: 'attribute_not_exists(id)',
    };

    docClient.put(paramsPut, function(err, data) {
        if (err) {
            res.status(500).send(JSON.stringify({ response: "ERROR", message: "DB error" + err }));
        } else {
            res.status(201).send(JSON.stringify({ response: "OK", "ticket": newTicket }));
        }
    });
});

// Actualizar un ticket existente
app.post('/api/updateTicket', (req, res) => {
    const { id, clienteID, estado_solucion, solucion, descripcion, fecha_apertura } = req.body;
    
    if (!id) {
        return res.status(400).send({ response: "ERROR", message: "Faltan datos requeridos" });
    }

    const ultimo_contacto = new Date().toLocaleDateString('es-AR');

    const paramsUpdate = {
        TableName: "ticket",
        Key: { "id": id },
        UpdateExpression: "SET #c = :c, #e = :e, #s = :s, #a = :a, #u = :u, #d = :d",
        ExpressionAttributeNames: {
            "#c": "clienteID", "#e": "estado_solucion",
            "#s": "solucion", "#a": "fecha_apertura",
            "#u": "ultimo_contacto", "#d": "descripcion"
        },
        ExpressionAttributeValues: {
            ":c": clienteID, ":e": estado_solucion,
            ":s": solucion, ":a": fecha_apertura,
            ":u": ultimo_contacto, ":d": descripcion
        },
        ReturnValues: "ALL_NEW",
        ConditionExpression: 'attribute_exists(id)'
    };

    docClient.update(paramsUpdate, function(err, data) {
        if (err) {
            res.status(500).send(JSON.stringify({ response: "ERROR", message: "DB access error " + err }));
        } else {
            res.status(200).send(JSON.stringify({ response: "OK", "data": data.Attributes }));
        }
    });
});


// --- Iniciar Servidor ---
app.listen(
    PORT,
    () => console.log(`🚀 Servidor listo y escuchando en http://localhost:${PORT}`)
);