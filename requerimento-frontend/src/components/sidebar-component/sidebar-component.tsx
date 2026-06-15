import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  FilePlus2,
  FileStack,
  LayoutDashboard,
} from "lucide-react";
import "./sidebar-style.scss";

const menuItems = [
  { path: "/", label: "Início", icon: LayoutDashboard },
  { path: "/templates", label: "Catálogo e templates", icon: FileStack },
  { path: "/templates/new", label: "Criar template", icon: FilePlus2 },
  { path: "/requests", label: "Consultar envios", icon: ClipboardList },
];

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__content">
        <nav className="app-sidebar__nav" aria-label="Navegação principal">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `app-sidebar__link ${isActive ? "app-sidebar__link--active" : ""}`
                }
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
