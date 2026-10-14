import { Outlet } from "react-router-dom";
import { Alert } from "@mui/material";
import { Header } from "../components/header-component/header-component";
import { Sidebar } from "../components/sidebar-component/sidebar-component";
import { MobileNav } from "../components/mobileNav-component/mobileNav";
import { useAuth } from "../lib/auth/auth-context";
import "./app-layout.scss";

export function AppLayout() {
  const { profileError } = useAuth();

  return (
    <div className="app-layout">
      <Header />

      <div className="app-layout__body">
        <Sidebar />

        <main className="app-layout__content">
          {profileError && (
            <Alert severity="warning">
              Não foi possível carregar seu perfil e suas permissões: {profileError}
            </Alert>
          )}
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
