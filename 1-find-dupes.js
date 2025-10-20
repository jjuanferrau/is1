import AWS from 'aws-sdk';
import accessKeyId from '../accessKeyId.js'; // Revisa que esta ruta sea correcta
import secretAccessKey from '../secretAccessKey.js'; // Revisa que esta ruta sea correcta

// Configura las claves
AWS.config.update({
    "region": "us-east-1",
    "endpoint": "http://dynamodb.us-east-1.amazonaws.com",
    "accessKeyId": accessKeyId,
    "secretAccessKey": secretAccessKey
});
let docClient = new AWS.DynamoDB.DocumentClient();

// ----------------------------------------------------
// 1. EDITA ESTA LÍNEA CON EL EMAIL DUPLICADO
// ----------------------------------------------------
const emailBuscado = "colla.pedro@uader.edu.ar";
// ----------------------------------------------------

const paramsScan = {
    TableName: "cliente",
    FilterExpression: "contacto = :email_val",
    ExpressionAttributeValues: { ":email_val": emailBuscado }
};

console.log(`Buscando ítems con el contacto: ${emailBuscado}...`);

docClient.scan(paramsScan, function(err, data) {
    if (err) {
        console.error("Error al escanear DynamoDB:", err);
    } else {
        console.log(`¡Encontrados ${data.Items.length} ítems!`);
        console.log("Datos encontrados (JSON):");
        // Te muestra la lista en formato JSON, fácil de copiar
        console.log(JSON.stringify(data.Items, null, 2)); 
    }
});