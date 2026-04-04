import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileStack,
  FilePlus2,
  ClipboardList,
  Settings,
  HelpCircle,
} from "lucide-react";

import "./sidebar-style.scss";

type MenuItem = {
  path: string;
  label: string;
  icon: React.ElementType;
};

const menuItems: MenuItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/templates", label: "Modelos", icon: FileStack },
  { path: "/templates/new", label: "Criar Modelo", icon: FilePlus2 },
  { path: "/requests", label: "Requerimentos", icon: ClipboardList },
];

const bottomItems: MenuItem[] = [
  { path: "/settings", label: "Configurações", icon: Settings },
  { path: "/help", label: "Ajuda", icon: HelpCircle },
];

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__content">
        <nav className="app-sidebar__nav">
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
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="app-sidebar__footer">
          {bottomItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `app-sidebar__link app-sidebar__link--secondary ${
                    isActive ? "app-sidebar__link--active" : ""
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </aside>
  );
}