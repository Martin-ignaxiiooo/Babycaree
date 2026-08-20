// Entry point manual, recomendado por la documentación oficial de Expo Router
// (https://docs.expo.dev/router/reference/troubleshooting/#expo_router_app_root-not-defined)
// para evitar el error "process.env.EXPO_ROUTER_APP_ROOT ... First argument
// of require.context should be a string" que ocurre en setups de monorepo
// como este (apps/mobile + apps/web + backend bajo un mismo repo).
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Debe estar exportada, o el Fast Refresh no actualiza el contexto.
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
