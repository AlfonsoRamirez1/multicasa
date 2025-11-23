console.log("casa_map.js CARGADO ✅");

document.addEventListener('DOMContentLoaded', function () {
    // Campos del admin (coinciden con tu modelo Casa)
    var direccionInput  = document.getElementById('id_direccion');
    var municipioInput  = document.getElementById('id_municipio');
    var estadoInput     = document.getElementById('id_estado');
    var cpInput         = document.getElementById('id_codigo_postal');
    var latInput        = document.getElementById('id_latitud');
    var lngInput        = document.getElementById('id_longitud');

    var mapDiv          = document.getElementById('casa-map');
    var botonDireccion  = document.getElementById('btn-geocode-direccion');

    // Solo corremos si estamos en el admin de Casa
    if (!mapDiv || !latInput || !lngInput) {
        console.log("No se encontró #casa-map o campos de lat/long. Saliendo.");
        return;
    }

    // Verificar que Leaflet esté cargado (lo mete el template casa_change_form.html)
    if (typeof L === 'undefined') {
        console.error("Leaflet (L) no está definido. Revisa el <script> en el template.");
        return;
    }

    // Coordenadas por defecto (ejemplo Monterrey)
    var defaultLat = latInput.value ? parseFloat(latInput.value) : 25.6866;
    var defaultLng = lngInput.value ? parseFloat(lngInput.value) : -100.3161;

    // Crear mapa
    var map = L.map('casa-map').setView([defaultLat, defaultLng], 14);
    var marker = null;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Si ya había coordenadas, dibujamos marcador
    if (latInput.value && lngInput.value) {
        marker = L.marker([defaultLat, defaultLng]).addTo(map);
    }

    // ---------- helpers de dirección ----------

    function fillAddressFieldsFromNominatim(address) {
        if (!address) return;

        // Calle (road + house_number)
        if (direccionInput) {
            var partesCalle = [];
            if (address.road) partesCalle.push(address.road);
            if (address.house_number) partesCalle.push(address.house_number);
            if (partesCalle.length > 0) {
                direccionInput.value = partesCalle.join(' ');
            }
        }

        // Código Postal
        if (cpInput && address.postcode) {
            cpInput.value = address.postcode;
        }

        // Estado
        if (estadoInput && address.state) {
            estadoInput.value = address.state;
        }

        // Municipio / ciudad
        if (municipioInput) {
            var muni =
                address.town ||
                address.city ||
                address.village ||
                address.suburb ||
                address.county;
            if (muni) {
                municipioInput.value = muni;
            }
        }
    }

    function reverseGeocode(lat, lon) {
        var params = new URLSearchParams({
            format: 'json',
            lat: lat,
            lon: lon,
            addressdetails: 1
        });

        var url = 'https://nominatim.openstreetmap.org/reverse?' + params.toString();

        fetch(url, {
            headers: {
                'Accept-Language': 'es',
                'User-Agent': 'Multicasa/1.0 (contacto@multicasa.com)'
            }
        })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (!data || !data.address) {
                console.log("Sin datos de address en reverse geocode");
                return;
            }
            fillAddressFieldsFromNominatim(data.address);
        })
        .catch(function (error) {
            console.error("Error en reverse geocode:", error);
        });
    }

    // ---------- eventos del mapa ----------

    // Click en mapa → actualizar lat/long y autocompletar dirección
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

        // Llenar calle, CP, municipio, estado desde la posición
        reverseGeocode(lat, lng);
    });

    // ---------- botón "Obtener coordenadas desde dirección" ----------

    if (botonDireccion) {
        botonDireccion.addEventListener('click', function () {
            var partes = [];

            if (direccionInput && direccionInput.value.trim()) {
                partes.push(direccionInput.value.trim());
            }
            if (municipioInput && municipioInput.value.trim()) {
                partes.push(municipioInput.value.trim());
            }
            if (estadoInput && estadoInput.value.trim()) {
                partes.push(estadoInput.value.trim());
            }
            if (cpInput && cpInput.value.trim()) {
                partes.push(cpInput.value.trim());
            }

            if (partes.length === 0) {
                alert('Escribe al menos calle, municipio o código postal.');
                return;
            }

            var query = partes.join(', ') + ', México';

            var params = new URLSearchParams({
                format: 'json',
                q: query,
                countrycodes: 'mx',
                addressdetails: 1,
                limit: 1
            });

            var url = 'https://nominatim.openstreetmap.org/search?' + params.toString();

            fetch(url, {
                headers: {
                    'Accept-Language': 'es',
                    'User-Agent': 'Multicasa/1.0 (contacto@multicasa.com)'
                }
            })
            .then(function (response) { return response.json(); })
            .then(function (data) {
                if (!data || data.length === 0) {
                    alert('No se encontró ubicación para esa dirección.');
                    return;
                }

                var lat = parseFloat(data[0].lat);
                var lon = parseFloat(data[0].lon);

                // Actualizar lat/long
                latInput.value = lat.toFixed(8);
                lngInput.value = lon.toFixed(8);

                // Mover mapa
                map.setView([lat, lon], 16);

                if (marker) {
                    marker.setLatLng([lat, lon]);
                } else {
                    marker = L.marker([lat, lon]).addTo(map);
                }

                // Normalizar campos de dirección con lo que regrese Nominatim
                if (data[0].address) {
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
