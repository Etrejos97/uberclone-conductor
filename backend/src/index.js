require('dotenv').config({ quiet: true });
const express = require('express');
const healthRoutes = require('./routes/health');
const paymentRoutes = require('./routes/payments');
const tripRoutes = require('./routes/trips');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const REQUIRED_ENV = ['MP_ACCESS_TOKEN', 'FIREBASE_SERVICE_ACCOUNT'];

function createApp() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use(healthRoutes);
  app.use('/payments', paymentRoutes);
  app.use('/trips', tripRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

if (require.main === module) {
  // Sin estas variables el backend arrancaría y fallaría en el primer cobro. Prefiero
  // que el despliegue falle de una vez y diga cuál falta, sin mostrar ningún valor.
  const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Faltan variables de entorno: ${missing.join(', ')}`);
    process.exit(1);
  }
  // SIMULATOR_KEY no la exijo para arrancar: sin ella los cobros funcionan y
  // /trips/simulate responde 401 a cualquier llave.
  if (!process.env.SIMULATOR_KEY) console.warn('Falta SIMULATOR_KEY: /trips/simulate rechazará todas las solicitudes.');
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => console.log(`Backend escuchando en el puerto ${port}`));
}

module.exports = { createApp };