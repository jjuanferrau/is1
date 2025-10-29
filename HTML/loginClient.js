const formE1 = document.querySelector('.form');   // Busca el primer elemento en el HTML que tenga la clase CSS "form"

/*---
    Intercepta el submit del formulario
    */

formE1.addEventListener('submit', (event) => {
	event.preventDefault();
	const formData = new FormData(formE1);
	const data = Object.fromEntries(formData);
	console.log('Application Server: Revisa el valor del form:');
	console.log(data);

	/*---
        Realiza validaciones en los datos del formulario antes de procesar
        */
       // Verifica si los campos de email o contraseña están vacíos
	if (data.email == '' || data.password == '') {
		console.log('debe indicar usuario');
		// Muestra un mensaje de error en el HTML
		document.getElementById('resultado1').style.color = 'RED';
		document.getElementById('resultado1').style.textAlign = 'center';
		document.getElementById('resultado1').textContent =
			'Debe informar el correo y password para  completar el acceso';
		return;// Detiene la ejecución de la función aquí
	}
// Esta es una validación específica y "hardcodeada" (fija en el código)
	if (data.email == 'pec') {   
		console.log('pec no es bienvenido en éste sistema');
		const m = '<li>El usuario <pec> no es bienvenido en éste sistema</li>';
		document.getElementById('resultado2').style.color = 'RED';
		document.getElementById('resultado2').style.textAlign = 'center';
		document.getElementById('resultado2').textContent =
			'El usuario con ese correo no es bienvenido en éste sistema';
		return;
	}

	// Verifica si el checkbox de "términos y condiciones" fue marcado
    // (Compara si el valor NO es "on", que es lo que envía un checkbox)
	if (data.termscondition != 'on') {
		console.log('no aceptó los T&C no se puede loggear');
		document.getElementById('resultado2').style.textAlign = 'center';
		document.getElementById('resultado2').style.color = 'RED';
		document.getElementById('resultado2').textContent =
			'Debe aceptar los T&C para poder usar el sistema';
		return;
	}

	/*---
        Genera objeto HTML a ser actualizado en el tag identificado como "app"
        */

	const HTMLResponse = document.querySelector('#app');
	const ul = document.createElement('ul');

	const tpl = document.createDocumentFragment();
// Define las URLs del Frontend (las páginas HTML)
	const systemURL = {
		listarTicket: 'http://127.0.0.1:5500/HTML/listarTicket.html',
		loginCliente: 'http://127.0.0.1:5500/HTML/loginClient.html',
	};
// Define las URLs del Backend (la API en el servidor)
	const RESTAPI = {
		loginCliente: 'http://localhost:8080/api/loginCliente',
		listarTicket: 'http://localhost:8080/api/listarTicket',
	};

/*-----
    Define el URI para realizar el acceso en base al acceso a un servidor local
    Esta variable 'MODE' se usa para cambiar entre entornos de prueba

 	/*-- Instrucción a cambiar opciones LOCAL, TYPICODE o AWS --*/
    const MODE='LOCAL';
	if (MODE == 'LOCAL') {  //Si el modo es 'LOCAL', prepara la llamada a nuestro servidor
	
		/// Prepara el objeto de datos que se enviará al servidor
	    const login = {
	        email: data.email,
		    password: data.password
		}	
        // Prepara las opciones para la llamada 'fetch'
		const options = {
			method: 'POST', // 'POST' se usa para ENVIAR datos de forma segura
			headers: {
				'Content-Type': 'application/json',  // Avisa que enviamos JSON
			},
			body: JSON.stringify(login), // Convierte el objeto JS a un string JSON
	};

            // Muestra en consola la información de la llamada

	 	console.log('API REST:' + RESTAPI.loginCliente);
	    console.log(login);
	    console.log('login(' + JSON.stringify(login) + ')');
	    console.log('options ' + JSON.stringify(options));
    	var API = RESTAPI.loginCliente;  // Asigna la URL y las opciones a las variables que usará el fetch
	    var APIoptions = options;

	};


	/*----------------------------------------------------------------------*/
	/*---- Typicode utilizar id 803a62c8-78c8-4b63-9106-73af216d504b -------*/
	/*                                                                      */
	/* El siguiente código es utilizado para resolver la validación de      */
	/* cliente utilizando un "fake" API REST server en Typicode             */
	/* para realizar la validación con el REST API server correcto          */
	/* deberá cambiar la instrucción para que                               */
	/*              const tipycode=false;                                   */
	/*----------------------------------------------------------------------*/


	if (MODE == 'TYPICODE') {
		console.log('Acceso usando Typicode como application server');
		API =
			'https://my-json-server.typicode.com/lu7did/MesaAyuda/posts/' + data.email;
		APIoptions = { method: 'GET' };
	}

	/*----------------------------------------------------------------------*/
	/*---- AWS Accede con URL de Lambda loginUserGET                 -------*/
	/*                                                                      */
	/* cliente: 803a62c8-78c8-4b63-9106-73af216d504b                        */
	/*                                                                      */
	/* Para activar el acceso mediante AWS hacer const aws=true;            */
	/*----------------------------------------------------------------------*/
	if (MODE == 'AWS') {
		console.log('Acceso usando AWS lambda como application server');
		API='https://fmtj0jrpp9.execute-api.us-east-1.amazonaws.com/default/loginUserGET?ID=' + data.email + '&PASSWORD=' + data.password;
    	APIoptions = { method: 'GET' };
	}
	/*-----
    Realiza el acceso al API Rest utilizando gestión de sincronización mediante promesas
	utiliza URL y options definidos en los pasos anteriores
    */

	fetch(`${API}`, APIoptions)
		.then((res) => {
			return res.json();
		})
		// Este .then() recibe el objeto JavaScript 'users' del paso anterior
		.then((users) => {
			// Muestra la respuesta completa del servidor en la consola
			console.log( 
				'Datos en respuesta del application server=' + JSON.stringify(users)
			);
			console.log('users.response=' + users.response); // Muestra solo el campo 'response' de la respuesta
			if (users.response == 'OK') {
				//<==Habilitar esto para dejar que el API REST verifique sin exponer la password
				console.log('La password es correcta');
				// Muestra datos en la consola
				console.log(
					'nombre(' +
						users.nombre +
						') fecha_ultimo_ingreso(' +
						users.fecha_ultimo_ingreso +
						')' +
						'mode(' + MODE + ')'
				);
				console.log(
					'id=' +
						users.id +
						' nombre=' +
						users.nombre +
						' ultimo=' +
						users.fecha_ultimo_ingreso
				);
				// Muestra la URL a la que se va a redirigir
				console.log(
					'changing to ' +
						systemURL.listarTicket +
						'?id=' +
						users.id +
						'&contacto=' +
						users.contacto +
						'&nombre=' +
						users.nombre +
						'&fecha_ultimo_ingreso=' +
						users.fecha_ultimo_ingreso +
						'&mode=' + MODE
				);
				//Redirige al usuario a la página de tickets
				window.location.href =
					systemURL.listarTicket +
					'?id=' +
					users.id +
					'&contacto=' +
					users.contacto +
					'&nombre=' +
					users.nombre +
					'&fecha_ultimo_ingreso=' +
					users.fecha_ultimo_ingreso +
					'&mode=' + MODE;
			} else {
				// Si el login falla, muestra un error
				console.log('La password no es correcta');
				document.getElementById('resultado1').style.color = 'RED'; 
				document.getElementById('resultado1').textContent =
					'Error de login, intente nuevamente';                  
			}
		})
		.catch((error) => {
            console.error("Fallo la solicitud:", error);
            
            // La mayoría de las veces, un servidor apagado genera un 'TypeError' con fetch.
            // Para ser más robustos, mostramos el error si no hay respuesta de red.
            
            document.getElementById('resultado1').style.color = 'RED';
            document.getElementById('resultado1').style.textAlign = 'center';

            // Muestra un mensaje claro para el usuario
            document.getElementById('resultado1').textContent =
                'Error de conexión con el servidor';

            // Opcionalmente, puedes restaurar el mensaje de bienvenida para la consola.
            console.log('El servidor Node.js (BACKEND) no respondió en ' + API);
        }); // <--- Cierra el .catch()
});
;
