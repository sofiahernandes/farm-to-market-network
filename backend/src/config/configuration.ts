export default () => ({
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
  integrations: {
    mercadoPagoConfigured: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
    mapboxConfigured: Boolean(process.env.MAPBOX_ACCESS_TOKEN),
  },
});
