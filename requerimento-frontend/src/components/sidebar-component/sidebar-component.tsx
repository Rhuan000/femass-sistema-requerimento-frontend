import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  FilePlus2,
  FileStack,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../../lib/auth/auth-context";
import "./sidebar-style.scss";

const menuItems = [
  { path: "/", label: "Início", icon: LayoutDashboard },
  { path: "/templates", label: "Catálogo e templates", icon: FileStack },
  {
    path: "/templates/new",
    label: "Criar template",
    icon: FilePlus2,
    requiresTemplateManager: true,
  },
  { path: "/requests", label: "Consultar envios", icon: ClipboardList },
];

export function Sidebar() {
  const { permissions } = useAuth();
  const visibleItems = menuItems.filter(
    (item) => !item.requiresTemplateManager || permissions.canCreateTemplate,
  );

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__content">
        <nav className="app-sidebar__nav" aria-label="Navegação principal">
          {visibleItems.map((item) => {
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
