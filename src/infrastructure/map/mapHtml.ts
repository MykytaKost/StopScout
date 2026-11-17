export const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />

  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
    }
  </style>
</head>

<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>
    const map = L.map('map').setView([54.352, 18.646], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    // Marker aktualnej lokalizacji użytkownika.
    let userMarker = null;
    let userAccuracyCircle = null;

    window.updateUserLocation = function(latitude, longitude, accuracy) {
    const position = [latitude, longitude];

    if (userMarker) {
        map.removeLayer(userMarker);
    }

    if (userAccuracyCircle) {
        map.removeLayer(userAccuracyCircle);
    }

    userMarker = L.circleMarker(position, {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: '#2563eb',
        fillOpacity: 1
    }).addTo(map);

    userMarker.bindPopup('Twoja lokalizacja');

    if (Number.isFinite(accuracy) && accuracy > 0) {
        userAccuracyCircle = L.circle(position, {
        radius: accuracy,
        color: '#2563eb',
        weight: 1,
        fillColor: '#2563eb',
        fillOpacity: 0.12
        }).addTo(map);
    }

    map.setView(position, Math.max(map.getZoom(), 15));
    };

    function sendBounds() {
      const bounds = map.getBounds();

      const message = {
        type: 'MAP_BOUNDS',
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLon: bounds.getWest(),
        maxLon: bounds.getEast(),
        zoomLevel: map.getZoom()
      };

      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }

    window.requestBounds = sendBounds;

    map.on('moveend', sendBounds);
    map.on('zoomend', sendBounds);

    window.updateStops = function(stops) {
      markersLayer.clearLayers();

      stops.forEach(stop => {
        const marker = L.marker([
          stop.latitude,
          stop.longitude
        ]);

        marker.bindPopup(
        '<div style="min-width:160px;">' +
            '<strong>' + escapeHtml(stop.name) + '</strong>' +
            '<br><br>' +
            '<button onclick="sendFavorite(' + Number(stop.id) + ')" ' +
            'style="padding:8px 12px; background:#2563eb; color:white; ' +
            'border:0; border-radius:6px; width:100%;">' +
            'Dodaj do ulubionych' +
            '</button>' +
        '</div>'
        );

        markersLayer.addLayer(marker);
      });
    };

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      })[character]);
    }

    window.sendFavorite = function(stopId) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
        type: 'ADD_FAVORITE',
        stopId: Number(stopId)
        })
      );
    };

    window.onload = function() {
      setTimeout(sendBounds, 300);
    };
  </script>
</body>
</html>
`;
