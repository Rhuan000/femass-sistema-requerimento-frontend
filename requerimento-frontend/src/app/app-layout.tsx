import { Outlet } from "react-router-dom";
import { Header } from "../components/header-component/header-component";
import { Sidebar } from "../components/sidebar-component/sidebar-component";
import { MobileNav } from "../components/mobileNav-component/mobileNav";
import "./app-layout.scss";

export function AppLayout() {
  return (
    <div className="app-layout">
      <Header />

      <div className="app-layout__body">
        <Sidebar />

        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  );
}