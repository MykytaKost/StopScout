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

    .favorite-button {
      padding: 8px 12px;
      background: #2563eb;
      color: white;
      border: 0;
      border-radius: 6px;
      width: 100%;
      font-size: 14px;
      cursor: pointer;
    }

    .favorite-button:active {
      background: #1d4ed8;
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

    // Lista ulubionych przystanków otrzymywana z React Native.
    let favoriteStopIds = new Set();

    window.updateFavoriteStops = function(ids) {
      favoriteStopIds = new Set(
        ids.map(id => Number(id))
      );

      // Aktualizuj również przycisk w aktualnie otwartym popupie.
      document.querySelectorAll('.favorite-button').forEach(button => {
        const stopId = Number(button.dataset.stopId);
        const isFavorite = favoriteStopIds.has(stopId);

        button.textContent = isFavorite
          ? '★ Usuń z ulubionych'
          : '☆ Dodaj do ulubionych';
      });
    };

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
      if (!window.ReactNativeWebView) {
        return;
      }

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

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      })[character]);
    }

    // Wysyłanie żądania zmiany ulubionego przystanku do React Native.
    window.sendFavorite = function(stopId) {
      const id = Number(stopId);

      if (!Number.isFinite(id) || !Number.isInteger(id)) {
        return;
      }

      if (!window.ReactNativeWebView) {
        console.error('Brak połączenia z ReactNativeWebView.');
        return;
      }

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'ADD_FAVORITE',
          stopId: id
        })
      );
    };

    window.updateStops = function(stops) {
      markersLayer.clearLayers();

      stops.forEach(stop => {
        const stopId = Number(stop.id);

        const marker = L.marker([
          stop.latitude,
          stop.longitude
        ]);

        const isFavorite = favoriteStopIds.has(stopId);

        const buttonLabel = isFavorite
          ? '★ Usuń z ulubionych'
          : '☆ Dodaj do ulubionych';

        marker.bindPopup(
          '<div style="min-width:160px;">' +
            '<strong>' + escapeHtml(stop.name) + '</strong>' +
            '<br><br>' +
            '<button class="favorite-button" ' +
            'data-stop-id="' + stopId + '">' +
            buttonLabel +
            '</button>' +
          '</div>'
        );

        // Obsługa kliknięcia po otwarciu popupu Leaflet.
        marker.on('popupopen', function(event) {
          const popupElement = event.popup.getElement();

          if (!popupElement) {
            return;
          }

          const button = popupElement.querySelector(
            '.favorite-button'
          );

          if (!button) {
            return;
          }

          button.addEventListener('click', function() {
            window.sendFavorite(
              Number(button.dataset.stopId)
            );
          });
        });

        markersLayer.addLayer(marker);
      });
    };

    window.onload = function() {
      setTimeout(sendBounds, 300);
    };
  </script>
</body>
</html>
`;
