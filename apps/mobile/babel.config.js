const path = require('path');

// En un monorepo, expo-router vive en el node_modules de la RAÍZ
// (../../node_modules/expo-router/_ctx.android.js), fuera de apps/mobile.
// Babel no aplica la config de este paquete a archivos de afuera, así que
// la variable EXPO_ROUTER_APP_ROOT que babel-preset-expo normalmente inyecta
// nunca llega a _ctx.android.js, y falla con:
//   "First argument of require.context should be a string denoting the directory"
// Definirla acá explícitamente resuelve el problema.
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, 'app');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
