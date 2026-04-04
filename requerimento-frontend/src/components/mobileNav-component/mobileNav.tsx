import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileStack,
  FilePlus2,
  ClipboardList,
} from "lucide-react";

import "./mobileNav.scss";

type MobileNavItem = {
  path: string;
  label: string;
  icon: React.ElementType;
};

const mobileItems: MobileNavItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/templates", label: "Modelos", icon: FileStack },
  { path: "/templates/new", label: "Criar", icon: FilePlus2 },
  { path: "/requests", label: "Requer.", icon: ClipboardList },
];

export function MobileNav() {
  return (
    <nav className="mobile-nav">
      <div className="mobile-nav__container">
        {mobileItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `mobile-nav__link ${isActive ? "mobile-nav__link--active" : ""}`
              }
            >
              <Icon size={18} />
              <span className="mobile-nav__label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}