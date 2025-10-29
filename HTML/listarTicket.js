/*---
Función para procesar los parámetros recibidos en el URL
(Ej: ?id=123&contacto=Juan)
*/
function getQueryParams(qs) {
    // Reemplaza el símbolo '+' (a menudo usado para espacios en URLs) por un espacio real.
    qs = qs.split('+').join(' ');

    var params = {}; // Objeto que almacenará los pares clave-valor (ej: {id: "123"})
    var tokens;
    // Expresión regular para encontrar pares clave=valor en la cadena de consulta (qs)
    // [?&]?      -> Opcionalmente empieza con ? o &
    // ([^=]+)   -> Captura el nombre del parámetro (cualquier cosa menos '=')
    // =           -> El símbolo de igual
    // ([^&]*)   -> Captura el valor del parámetro (cualquier cosa menos '&')
    var re = /[?&]?([^=]+)=([^&]*)/g;

    // Bucle que se ejecuta por cada coincidencia encontrada por la expresión regular
    while (tokens = re.exec(qs)) {
        // decodeURIComponent se usa para convertir caracteres especiales de URL (ej: %20) a su valor real
        // tokens[1] es la clave (ej: "id")
        // tokens[2] es el valor (ej: "123")
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    // Devuelve el objeto con todos los parámetros
    return params;
}

/*---
Extrae del URL el id de cliente ya validado, su nombre y la última fecha de login, 
y actualiza el banner de seguridad.
*/

console.log("Comienza listarTicket.js");

// Llama a la función anterior para "parsear" la query string de la URL actual
// document.location.search es la parte de la URL que empieza con '?'
var query = getQueryParams(document.location.search);
// Muestra en la consola los datos leídos de la URL
console.log("id:"+query.id);
console.log("contacto:"+query.contacto);
console.log("ultima_fecha:"+query.fecha_ultimo_ingreso);
console.log("mode:"+query.mode);

// Busca el elemento HTML con id "lastlogin" y le inserta una tabla
// mostrando la información del usuario leída de la URL.
document.getElementById("lastlogin").innerHTML = "<table><tr><td>Cliente</td><td>"+query.id+"</td></tr><tr><td>Contacto</td><td>"+query.contacto+"</td></tr></tr><tr><td>Ultimo ingreso</td><td>"+query.fecha_ultimo_ingreso+"</td></tr></table>";

// Define las URLs del Frontend (las páginas HTML)
const systemURL={ 
    listarTicket    : "http://127.0.0.1:5500/HTML/listarTicket.html",
    loginCliente    : "http://127.0.0.1:5500/HTML/loginClient.html",
};
// Define las URLs del Backend (la API en el servidor)
const RESTAPI={
    loginCliente    : "http://127.0.0.1:8080/api/loginCliente",
    listarTicket    : "http://localhost:8080/api/listarTicket",
};

/*---
Define que REST API server utilizará para obtener datos, el modo lo recibe como argumento
LOCAL (Tu propia PC)
TYPICODE (Un servicio de simulación de APIs)
AWS (Amazon Web Services, un servidor en la nube)
*/
// Busca el elemento HTML con id "app" (donde se mostrará la tabla de tickets)
const HTMLResponse=document.querySelector("#app");

// Declara un objeto 'ticket' (se usará para enviar datos en POST si es LOCAL)
var ticket = {
    "ID" : query.id,
};

// Declara un objeto 'options' para el fetch (se inicializa para GET)
var options = {
    method: 'GET',
    };
    // Declara la variable para la URL de la API que se usará
var APIREST_URL='';

// Muestra en consola el modo recibido de la URL
console.log('transferred mode:'+query.mode);    

// Estructura 'switch' para decidir qué API llamar según el 'mode' recibido de la URL
switch (query.mode) {
  case "LOCAL":
    // Si mode=LOCAL (desarrollo en tu PC)
    console.log("Utiliza servidor NodeJS local.");
    console.log("API_listarTicket:"+RESTAPI.listarTicket); 
  // Corrige el objeto 'ticket' para que tenga 'clienteID' como espera la API local
    ticket = {
       "clienteID" : query.id, 
    };
    // Configura las 'options' para hacer una llamada POST (enviar datos)
    options = {
       method: 'POST',
       headers: {
       'Content-Type': 'application/json', // Avisa al servidor que se envía JSON
    },
        body: JSON.stringify(ticket), // Convierte el objeto 'ticket' a texto JSON para enviarlo
    };
    console.log("ticket:"+JSON.stringify(ticket)+" options:"+JSON.stringify(options));

    // Establece la URL de la API a la local
    APIREST_URL=RESTAPI.listarTicket;
    break;
  case "TYPICODE":
    // Si mode=TYPICODE (servidor de prueba)
    console.log("Typicode no soportado en ésta función");
    // Establece la URL a la de Typicode. Usa el método GET por defecto.
    APIREST_URL='https://my-json-server.typicode.com/lu7did/mesaayuda/posts/'+query.id;
    break;
  case "AWS": // Si mode=AWS (servidor en la nube)
    console.log("Utiliza AWS como serverless");
    // Establece la URL a la de AWS. Pasa el ID como un parámetro en la URL.
    // Usa el método GET por defecto.
    APIREST_URL='https://n3ttz410ze.execute-api.us-east-1.amazonaws.com/default/listTicketGET?ID='+query.id;
    break;
  default: // Si "mode" no es ninguno de los anteriores o no existe
    console.log("Asume AWS.");
    // Por seguridad o por defecto, usa el servidor de AWS.
    APIREST_URL='https://n3ttz410ze.execute-api.us-east-1.amazonaws.com/default/listTicketGET?ID='+query.id;
}
// Muestra en consola la configuración final antes de hacer la llamada.
console.log("APIREST_URL:"+APIREST_URL);
console.log("ticket  :"+JSON.stringify(ticket));
console.log("options :"+JSON.stringify(options));


// --- Llamada a la API y Renderizado de la Tabla ---

// fetch() es la función moderna de JavaScript para hacer peticiones de red (HTTP).
// Llama a la URL que decidimos en el 'switch' y con las 'options' configuradas.
fetch(`${APIREST_URL}`,options)
.then(res => {
    // Esta parte se ejecuta cuando el servidor responde.
    // 'res.json()' convierte la respuesta (que es texto JSON) en un objeto JavaScript.
    return res.json();
}).then(ticket=>{
    // Esta parte se ejecuta DESPUÉS de que la respuesta se convirtió a objeto.
    // 'ticket' ahora contiene los datos del servidor (ej: una lista de tickets).
    console.log("ticket:");
    console.log(ticket); // Muestra los datos recibidos en consola.

    let f=false; // Una variable "bandera" (flag) para saber si encontramos algún ticket.
    let table=document.createElement("table"); // Crea un elemento <table> en memoria (aún no es visible).
    table.style.border="1px solid"; // Aplica estilos CSS a la tabla.
    table.style.backgroundColor="##626607"; // (Nota: este color es inválido, debería ser #626607)

    // Recorre el array 'data' que vino dentro de la respuesta 'ticket'.
    // (La línea comentada 'ticket.uresponse.forEach' sugiere que la API quizás cambió de formato)
    ticket.data.forEach((t)=> { 
        console.log(t.clienteID) // Muestra el ID del cliente de cada ticket

        // Compara si el clienteID del ticket coincide con el ID leído de la URL
        if (t.clienteID == query.id) {

            // Si es el primer ticket encontrado para este cliente...
            if (f==false) {
                f=true; // Marca que ya se encontró al menos uno
                // Define los encabezados de la tabla
                const hdr=["Cliente","ID","Motivo","Estado","Fecha"];
                // Crea una fila <tr> para los encabezados
                let tr=document.createElement("tr");
                tr.style.border="1px solid";
                
                // Recorre los títulos y crea una celda de cabecera <th> para cada uno
                hdr.forEach((item) => {
                    let th=document.createElement("th");
                    th.style.border="1px solid";
                    th.innerText = item; // Pone el texto (ej: "Cliente")
                    tr.appendChild(th); // Añade la celda <th> a la fila <tr>
                });
                table.appendChild(tr); // Añade la fila de cabecera completa a la tabla.
            }
            // Define los datos que irán en la fila de este ticket
            const body=[t.clienteID,`${t.id}`,`${t.solucion}`,`${t.estado_solucion}`,`${t.ultimo_contacto}`];

            // Crea una fila <tr> para los datos de este ticket
            let trl=document.createElement("tr");
            // Recorre los datos del ticket
            body.forEach((line) => {
                // Crea una celda de datos <td>
                let td=document.createElement("td");
                td.style.border="1px solid";
                td.innerText = line; // Le pone el dato del ticket
                trl.appendChild(td); // Añade la celda <td> a la fila <tr>
            });
            table.appendChild(trl);    // Añade la fila de datos a la tabla               
        }
    });
    // Después de recorrer todos los tickets...
    // Si se encontró al menos un ticket (f es true)
    if (f) {
        console.log(table);
        // Añade la tabla completa al <div> con id="app" en el HTML
        HTMLResponse.appendChild(table);
    } else {
        // Si no se encontró ningún ticket para este cliente
        console.log("no tiene tickets");
        // Muestra un mensaje de error en el <span> con id "mensajes"
        document.getElementById('mensajes').style.textAlign = "center";
        document.getElementById('mensajes').style.color="RED";
        document.getElementById("mensajes").innerHTML = "No hay tickets pendientes";
    }
});