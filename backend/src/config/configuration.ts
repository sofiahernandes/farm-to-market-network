export default () => ({
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowVercelOrigins: process.env.ALLOW_VERCEL_ORIGINS !== 'false',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((v) => v.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  integrations: {
    mercadoPagoConfigured: Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN),
    mapboxConfigured: Boolean(process.env.MAPBOX_ACCESS_TOKEN),
  },
});
