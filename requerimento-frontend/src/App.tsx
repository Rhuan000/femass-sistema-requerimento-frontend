import { AppRoutes } from "../src/app/routes";
import { AuthProvider, useAuth } from "../src/lib/auth/auth-context";
import { LoginPage } from "../src/pages/login/login-page";
import "./app.scss";
import "../src/shared/styles/global.scss";

function AuthGate() {
  const { authenticated, initializing } = useAuth();

  if (initializing) return null;
  return authenticated ? <AppRoutes /> : <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;