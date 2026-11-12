import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, fonts } from '../theme';

// Mapa de Leaflet con teselas de OpenStreetMap dentro de un WebView.
// Es el único archivo que conoce Leaflet: las pantallas le pasan datos por props
// y este componente se los manda a la página con injectJavaScript.
//
// Props:
//   center:  { latitude, longitude }             punto al que se centra el mapa
//   markers: [{ id, latitude, longitude, label, color, borderColor }]
//   route:   [{ latitude, longitude }]           polilínea de la ruta (de OSRM)
//
// OpenStreetMap no tiene teselas oscuras gratis, así que oscurezco las normales
// con un filtro: invertir los colores y girar el tono deja las calles grises
// sobre fondo negro y el agua azul oscura. Los colores de la página salen del
// tema, por eso van dentro del texto con ${}.

const LEAFLET_VERSION = '1.9.4';

// Valores por defecto fuera del componente: un [] nuevo en cada render volvería
// a mandarle el estado a la página aunque nada cambió.
const NO_MARKERS = [];
const NO_ROUTE = [];

const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
  <style>
    html, body, #map { margin: 0; height: 100%; background: ${colors.background}; }
    .leaflet-container { background: ${colors.background}; }
    .leaflet-tile-pane { filter: invert(100%) hue-rotate(180deg) brightness(92%) contrast(88%) saturate(0.3); }
    .leaflet-control-attribution { background: ${colors.overlay} !important; color: ${colors.faint} !important; }
    .leaflet-control-attribution a { color: ${colors.muted} !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function send(message) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  </script>
  <script src="https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""
    onerror="send({ type: 'error', message: 'No se pudo cargar el mapa. Revisa la conexión.' })"></script>
  <script>
    var map = L.map('map', { zoomControl: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    var layers = L.layerGroup().addTo(map);
    var lastRouteKey = null;
    var centered = false;

    window.updateMap = function (state) {
      layers.clearLayers();

      if (state.route.length > 1) {
        var points = state.route.map(function (p) { return [p.latitude, p.longitude]; });
        L.polyline(points, { color: '${colors.primary}', weight: 5 }).addTo(layers);
        var routeKey = JSON.stringify(points[0]) + JSON.stringify(points[points.length - 1]);
        if (routeKey !== lastRouteKey) {
          map.fitBounds(points, { padding: [40, 40] });
          lastRouteKey = routeKey;
        }
      } else if (state.center && !centered) {
        map.setView([state.center.latitude, state.center.longitude], 16);
        centered = true;
      }

      // Los puntos van después de la ruta para quedar encima de la línea.
      state.markers.forEach(function (m) {
        L.circleMarker([m.latitude, m.longitude], {
          radius: 9,
          color: m.borderColor || '${colors.markerBorder}',
          weight: 3,
          fillColor: m.color || '${colors.primary}',
          fillOpacity: 1,
        }).bindTooltip(m.label || '').addTo(layers);
      });
    };

    send({ type: 'ready' });
  </script>
</body>
</html>`;

export default function RouteMap({ center = null, markers = NO_MARKERS, route = NO_ROUTE }) {
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ready || !webRef.current) return;
    const state = JSON.stringify({ center, markers, route });
    webRef.current.injectJavaScript(`window.updateMap(${state}); true;`);
  }, [ready, center, markers, route]);

  function handleMessage(event) {
    const message = JSON.parse(event.nativeEvent.data);
    if (message.type === 'ready') setReady(true);
    if (message.type === 'error') setError(message.message);
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        source={{ html }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        applicationNameForUserAgent="UberCloneConductor/1.0"
        style={styles.map}
      />
      {error && (
        <View style={styles.overlay}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  // El fondo del WebView también va oscuro: sin él, se ve un destello blanco
  // mientras carga la página.
  map: { flex: 1, backgroundColor: colors.background },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: 24,
  },
  error: { color: colors.danger, textAlign: 'center', fontSize: 15, fontFamily: fonts.medium },
});