// 1. Seleccionamos el formulario y el span de resultado
const formE1 = document.querySelector('.form');
const resultadoSpan = document.getElementById('resultado');

// 2. Escuchamos el evento 'submit' del formulario
formE1.addEventListener('submit', (event) => {
    // Evitamos que la página se recargue
    event.preventDefault();
    resultadoSpan.textContent = '';

    // 3. Obtenemos los datos del formulario
    const formData = new FormData(formE1);
    const data = Object.fromEntries(formData);

    // 4. Validamos los datos en el cliente
    if (!data.nombre || !data.email || !data.password) {
        resultadoSpan.style.color = 'red';
        resultadoSpan.textContent = 'Por favor, completa todos los campos.';
        return;
    }

    if (data.password !== data.confirm_password) {
        resultadoSpan.style.color = 'red';
        resultadoSpan.textContent = 'Las contraseñas no coinciden.';
        return;
    }

    // 5. Preparamos los datos para enviar a la API
    const dataParaAPI = {
        nombre: data.nombre,
        contacto: data.email, 
        password: data.password
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataParaAPI),
    };

    // 6. Hacemos la llamada 'fetch' a la API de Node.js
    fetch('http://localhost:8080/api/addCliente', options)
        .then(res => res.json())
        .then(response => {
            console.log(response);
            if (response.response === 'OK') {
                // Éxito
                resultadoSpan.style.color = 'green';
                resultadoSpan.textContent = '¡Registro exitoso! Redirigiendo al login...';
                
                // Esperamos 2 segundos y redirigimos al login
                setTimeout(() => {
                    window.location.href = 'loginClient.html';
                }, 2000);

            } else {
                // Error (ej: "Cliente ya existe")
                resultadoSpan.style.color = 'red';
                resultadoSpan.textContent = response.message || 'Error en el registro.';
            }
        })
        .catch(err => {
            // Error de conexión
            console.error('Error de fetch:', err);
            resultadoSpan.style.color = 'red';
            resultadoSpan.textContent = 'Error de conexión con el servidor.';
        });
});

