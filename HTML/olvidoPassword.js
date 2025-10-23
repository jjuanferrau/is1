// 1. Seleccionamos el formulario y el span de resultado
const resetForm = document.getElementById('resetForm');
const resultadoSpan = document.getElementById('resultado');

// 2. Escuchamos el evento 'submit' del formulario
resetForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Evitamos que la página se recargue
    resultadoSpan.textContent = ''; // Limpiamos mensajes anteriores

    // 3. Obtenemos los datos del formulario por su ID
    const email = document.getElementById('email').value;
    const pass1 = document.getElementById('newPassword1').value;
    const pass2 = document.getElementById('newPassword2').value;

    // 4. Validamos los datos en el cliente
    if (!email || !pass1 || !pass2) {
        resultadoSpan.style.color = 'red';
        resultadoSpan.textContent = 'Por favor, completa todos los campos.';
        return;
    }

    if (pass1 !== pass2) {
        resultadoSpan.style.color = 'red';
        resultadoSpan.textContent = 'Las contraseñas no coinciden.';
        return;
    }

    // 5. Preparamos los datos para enviar a la API
    const dataParaAPI = {
        email: email,
        password: pass1
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataParaAPI),
    };

    // 6. Hacemos la llamada 'fetch' a la NUEVA API en Node.js
    fetch('http://localhost:8080/api/updatePasswordByEmail', options)
        .then(async res => {
            const responseData = await res.json();
            if (!res.ok) {
                // Si la respuesta no es 2xx, lanzamos un error con el mensaje del servidor
                throw new Error(responseData.message || 'Error en el servidor');
            }
            return responseData;
        })
        .then(response => {
            console.log(response);
            if (response.response === 'OK') {
                // Éxito
                resultadoSpan.style.color = 'green';
                resultadoSpan.textContent = '¡Contraseña actualizada! Redirigiendo al login...';
                
                // Esperamos 2 segundos y redirigimos al login
                setTimeout(() => {
                    window.location.href = 'loginClient.html';
                }, 2000);

            }
        })
        .catch(err => {
            // Error de conexión o error lanzado desde el .then()
            console.error('Error de fetch:', err);
            resultadoSpan.style.color = 'red';
            resultadoSpan.textContent = err.message; // Mostramos el error (ej: "Email no registrado")
        });
});