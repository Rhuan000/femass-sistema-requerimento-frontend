import { useState } from "react";
import { FileText, User } from "lucide-react";
import {
  Avatar,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import "./header-style.scss";

export function Header() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <header className="app-header">
      <div className="app-header__container">
        <div className="app-header__brand">
          <div className="app-header__logo">
            <FileText size={20} aria-hidden="true" />
          </div>
          <div className="app-header__brand-text">
            <h1 className="app-header__title">FeMASS Requerimentos</h1>
            <p className="app-header__subtitle">Sistema de Requerimentos</p>
          </div>
        </div>

        <div className="app-header__actions">
          <IconButton
            aria-label="Abrir menu do usuário"
            onClick={(event) => setAnchorEl(event.currentTarget)}
            className="app-header__icon-button"
          >
            <Avatar className="app-header__avatar">
              <User size={16} aria-hidden="true" />
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <div className="app-header__menu-header">
              <span className="app-header__menu-name">Usuário FeMASS</span>
              <span className="app-header__menu-email">Acesso ao sistema</span>
            </div>
            <Divider />
            <MenuItem onClick={() => setAnchorEl(null)}>
              <ListItemText>Fechar menu</ListItemText>
            </MenuItem>
          </Menu>
        </div>
      </div>
    </header>
  );
}
