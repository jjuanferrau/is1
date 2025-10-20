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
// 2. EDITA ESTA LISTA CON LOS 5 IDs A BORRAR
// ----------------------------------------------------
const idsParaBorrar = [
    "a28eb748-bc77-4e1c-8ff4-5df447e9d321",
    "4e699a64-da10-4b23-983e-c1b37e966a48",
    "145d13e7-3037-4244-bc91-3789ddfac3e3",
    "378f5f88-664e-4b2d-bcff-0db738e9dc19",
    "c661a62f-3501-4f94-b71f-282a65a0bda9"
];
// ----------------------------------------------------

console.log(`Borrando ${idsParaBorrar.length} ítems duplicados...`);

idsParaBorrar.forEach(id => {
    const paramsDelete = {
        TableName: "cliente",
        Key: {
            "id": id // El 'id' es la Clave Primaria
        }
    };

    docClient.delete(paramsDelete, function(err, data) {
        if (err) {
            console.error(`Error borrando ${id}:`, err);
        } else {
            console.log(`✅ Ítem borrado exitosamente: ${id}`);
        }
    });
});