console.log("casa_map.js CARGADO ✅");

document.addEventListener('DOMContentLoaded', function () {
    // -------------------- CONSTANTES --------------------
    // Usaremos una función para generar el mensaje específico
    function NO_DATA_MSG(fieldName) {
        return 'Valor de ' + fieldName + ' no encontrado'; 
    }

    // Campos del admin (modelo Casa)
    var latInput       = document.getElementById('id_latitud');
    var lngInput       = document.getElementById('id_longitud');
    var cpInput        = document.getElementById('id_codigo_postal');
    var municipioInput = document.getElementById('id_municipio');
    var estadoInput    = document.getElementById('id_estado');
    var dirInput       = document.getElementById('id_direccion');

    if (!latInput || !lngInput) {
        console.log("No se encontraron campos de latitud/longitud. Saliendo.");
        return;
    }

    // Buscar la fila de Código Postal (es el último campo de dirección)
    var cpRow = null;
    if (cpInput) {
        cpRow = cpInput.closest('.form-row') || cpInput.parentElement;
    }
    
    if (!cpRow || !cpRow.parentNode) {
        console.log("No se encontró la fila del Código Postal para anclaje. El mapa/botón no se insertarán correctamente.");
        return; 
    }
    
    var parentNode = cpRow.parentNode;
    var nextElement = cpRow.nextSibling;
    
    // -------------------- INSERCIÓN DE ELEMENTOS --------------------

    // 1. Crear botón "Obtener coordenadas"
    var botonDireccion = document.createElement('button');
    botonDireccion.type = 'button';
    botonDireccion.textContent = 'Buscar ubicación y obtener coordenadas';
    botonDireccion.className = 'button';
    botonDireccion.id = 'btn-obtener-coords';
    botonDireccion.style.marginTop = '10px';
    botonDireccion.style.marginBottom = '10px';
    botonDireccion.style.display = 'block';
    
    // 2. Crear contenedor del mapa
    var mapDiv = document.createElement('div');
    mapDiv.id = 'casa-map';
    mapDiv.style.width = '100%';
    mapDiv.style.height = '260px';
    mapDiv.style.border = '1px solid #ccc';
    mapDiv.style.marginBottom = '15px'; 
    
    // 3. Insertar el BOTÓN después de la fila del Código Postal
    parentNode.insertBefore(botonDireccion, nextElement);
    
    // 4. Insertar el MAPA después del BOTÓN
    parentNode.insertBefore(mapDiv, botonDireccion.nextSibling);

    // -------------------- INICIALIZACIÓN DEL MAPA --------------------
    
    if (typeof L === 'undefined') {
        console.error("Leaflet (L) no está definido. Revisa el <script> en el template del admin.");
        return;
    }

    // Coordenadas por defecto (ejemplo: CDMX)
    var defaultLat = latInput.value ? parseFloat(latInput.value) : 19.4326;
    var defaultLng = lngInput.value ? parseFloat(lngInput.value) : -99.1332;

    var map = L.map('casa-map').setView([defaultLat, defaultLng], 15);
    var marker = null;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    if (latInput.value && lngInput.value) {
        marker = L.marker([defaultLat, defaultLng]).addTo(map);
    }

    // -------------------- AYUDAS DE RELLENADO Y GEOCODIFICACIÓN --------------------

    function fillAddressFieldsFromNominatim(address) {
        if (!address) address = {}; // Asegurar que 'address' es un objeto para evitar errores

        // Dirección (calle y número)
        if (dirInput) {
            var calle = '';
            // Buscar por el nombre más específico de calle/área
            if (address.road) {
                calle = address.road;
            } else if (address.residential) {
                calle = address.residential;
            } else if (address.neighbourhood) {
                calle = address.neighbourhood;
            }

            if (address.house_number) {
                calle = (calle ? calle + ' ' : '') + address.house_number;
            }

            if (calle) {
                dirInput.value = calle;
            } else if (!dirInput.value.trim()) { 
                dirInput.value = NO_DATA_MSG('Dirección');
            }
        }

        // Municipio (localidad, ciudad, pueblo, etc.)
        if (municipioInput) {
            // Buscar por el nombre más relevante para municipio
            var muni =
                address.town ||
                address.city ||
                address.village ||
                address.suburb ||
                address.county;

            if (muni) {
                municipioInput.value = muni;
            } else if (!municipioInput.value.trim()) {
                municipioInput.value = NO_DATA_MSG('Municipio');
            }
        }

        // Estado
        if (estadoInput) {
            if (address.state) {
                estadoInput.value = address.state;
            } else if (!estadoInput.value.trim()) {
                estadoInput.value = NO_DATA_MSG('Estado');
            }
        }

        // Código Postal
        if (cpInput) {
            if (address.postcode) {
                cpInput.value = address.postcode;
            } else if (!cpInput.value.trim()) {
                cpInput.value = NO_DATA_MSG('Código Postal');
            }
        }
    }

    function reverseGeocode(lat, lon) {
        
        // -------------------- LIMPIAR CAMPOS ANTES DE LA BÚSQUEDA --------------------
        // Esto asegura que valores antiguos no persistan si la nueva búsqueda falla.
        if (dirInput) dirInput.value = '';
        if (municipioInput) municipioInput.value = '';
        if (estadoInput) estadoInput.value = '';
        if (cpInput) cpInput.value = '';
        // -------------------- FIN LIMPIEZA --------------------

        var params = new URLSearchParams({
            format: 'json',
            lat: lat,
            lon: lon,
            addressdetails: 1,
            countrycodes: 'mx' 
        });

        var url = 'https://nominatim.openstreetmap.org/reverse?' + params.toString();

        fetch(url, {
            headers: {
                'Accept-Language': 'es', 
                'User-Agent': 'Multicasa/1.0 (contacto@multicasa.com)'
            }
        })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            if (!data || !data.address) {
                console.log("Sin datos de address en reverse geocode");
                // Rellenar con los mensajes de "no encontrado"
                fillAddressFieldsFromNominatim({}); 
                return;
            }
            fillAddressFieldsFromNominatim(data.address);
        })
        .catch(function (error) {
            console.error("Error en reverse geocode:", error);
            // Rellenar con los mensajes de "no encontrado" en caso de error de red
            fillAddressFieldsFromNominatim({});
        });
    }

    // -------------------- EVENTOS --------------------

    // Click en mapa → actualizar lat/long + rellenar dirección/muni/estado/CP
    map.on('click', function (e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;

        latInput.value = lat.toFixed(8);
        lngInput.value = lng.toFixed(8);

        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            marker = L.marker(e.latlng).addTo(map);
        }

        reverseGeocode(lat, lng);
    });

    // Botón: construir query con 1 a 4 campos (calle, muni, estado, CP)
    if (botonDireccion) {
        botonDireccion.addEventListener('click', function () {
            var partes = [];

            // Función para incluir solo si el campo no está vacío y NO contiene el mensaje de error
            function addPartIfValid(input, fieldName) {
                var value = input.value.trim();
                if (value && value !== NO_DATA_MSG(fieldName)) {
                    partes.push(value);
                }
            }

            if (dirInput) addPartIfValid(dirInput, 'Dirección');
            if (municipioInput) addPartIfValid(municipioInput, 'Municipio');
            if (estadoInput) addPartIfValid(estadoInput, 'Estado');
            if (cpInput) addPartIfValid(cpInput, 'Código Postal');
            

            if (partes.length === 0) {
                alert('Escribe al menos calle, municipio, estado o código postal para buscar la ubicación.');
                return;
            }

            var query = partes.join(', ') + ', México';

            var params = new URLSearchParams({
                format: 'json',
                q: query,
                addressdetails: 1,
                limit: 1,
                countrycodes: 'mx'
            });

            var url = 'https://nominatim.openstreetmap.org/search?' + params.toString();

            fetch(url, {
                headers: {
                    'Accept-Language': 'es',
                    'User-Agent': 'Multicasa/1.0 (contacto@multicasa.com)'
                }
            })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                if (!data || data.length === 0) {
                    alert('No se encontró ninguna ubicación con los datos proporcionados.');
                    return;
                }

                var lat = parseFloat(data[0].lat);
                var lon = parseFloat(data[0].lon);

                latInput.value = lat.toFixed(8);
                lngInput.value = lon.toFixed(8);

                // Centrar y hacer zoom en el mapa
                map.setView([lat, lon], 16);

                if (marker) {
                    marker.setLatLng([lat, lon]);
                } else {
                    marker = L.marker([lat, lon]).addTo(map);
                }

                if (data[0].address) {
                    // Llamar a fillAddressFieldsFromNominatim para actualizar los campos de dirección
                    // No limpiamos los campos aquí porque la geocodificación fue exitosa y fillAddressFieldsFromNominatim ya gestiona los mensajes de error.
                    fillAddressFieldsFromNominatim(data[0].address);
                }
            })
            .catch(function (error) {
                console.error('Error consultando Nominatim:', error);
                alert('Error consultando el servicio de mapa.');
            });
        });
    }
});