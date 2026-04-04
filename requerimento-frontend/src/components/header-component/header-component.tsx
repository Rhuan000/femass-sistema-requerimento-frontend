import { useState } from "react";
import { Bell, FileText, User } from "lucide-react";
import {
  Avatar,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";

import "./header-style.scss";

export function Header() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isMenuOpen = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <header className="app-header">
      <div className="app-header__container">
        <div className="app-header__brand">
          <div className="app-header__logo">
            <FileText size={20} />
          </div>

          <div className="app-header__brand-text">
            <h1 className="app-header__title">UniReq</h1>
            <p className="app-header__subtitle">Sistema de Requerimentos</p>
          </div>
        </div>

        <div className="app-header__actions">
          <IconButton
            aria-label="Notificações"
            className="app-header__icon-button"
          >
            <Badge badgeContent={3} color="error">
              <Bell size={20} />
            </Badge>
          </IconButton>

          <IconButton
            aria-label="Abrir menu do usuário"
            onClick={handleOpenMenu}
            className="app-header__icon-button"
          >
            <Avatar className="app-header__avatar">
              <User size={16} />
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleCloseMenu}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <div className="app-header__menu-header">
              <span className="app-header__menu-name">João Silva</span>
              <span className="app-header__menu-email">
                joao.silva@universidade.edu
              </span>
            </div>

            <Divider />

            <MenuItem onClick={handleCloseMenu}>
              <ListItemText>Meu Perfil</ListItemText>
            </MenuItem>

            <MenuItem onClick={handleCloseMenu}>
              <ListItemText>Configurações</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleCloseMenu}>
              <ListItemIcon>
                <User size={16} />
              </ListItemIcon>
              <ListItemText>Sair</ListItemText>
            </MenuItem>
          </Menu>
        </div>
      </div>
    </header>
  );
}