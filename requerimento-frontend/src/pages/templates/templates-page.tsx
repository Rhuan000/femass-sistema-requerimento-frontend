import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Copy,
} from "lucide-react";
import {
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  OutlinedInput,
  Typography,
  Button,
} from "@mui/material";

import { mockTemplates } from "../../lib/mock-data";
import { TEMPLATE_CATEGORIES } from "../../lib/types";
import type { RequestTemplate } from "../../lib/types";

import "./templates-styles.scss";

export function TemplatesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<RequestTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    return mockTemplates.filter((template) => {
      const normalizedSearch = searchQuery.toLowerCase().trim();

      const matchesSearch =
        template.name.toLowerCase().includes(normalizedSearch) ||
        template.description.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        !selectedCategory || template.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    template: RequestTemplate
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedTemplate(template);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedTemplate(null);
  };

  const handleViewTemplate = () => {
    if (selectedTemplate) {
      navigate(`/requests/new/${selectedTemplate.id}`);
    }
    handleCloseMenu();
  };

  const handleEditSelectedTemplate = () => {
    if (selectedTemplate) {
      navigate(`/templates/edit/${selectedTemplate.id}`);
    }
    handleCloseMenu();
  };

  const handleDuplicateTemplate = () => {
    if (selectedTemplate) {
      console.log("Duplicar template:", selectedTemplate);
    }
    handleCloseMenu();
  };

  const handleDeleteTemplate = () => {
    if (selectedTemplate) {
      console.log("Excluir template:", selectedTemplate);
    }
    handleCloseMenu();
  };

  return (
    <div className="templates-list">
      <div className="templates-list__header">
        <Typography variant="h4" className="templates-list__title">
          Modelos de Requerimento
        </Typography>

        <Typography variant="body1" className="templates-list__subtitle">
          Gerencie os modelos disponíveis para abertura de requerimentos
        </Typography>
      </div>

      <div className="templates-list__filters">
        <div className="templates-list__search">
          <OutlinedInput
            fullWidth
            placeholder="Buscar modelos..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            }
          />
        </div>

        <div className="templates-list__categories">
          <Button
            variant={selectedCategory === null ? "contained" : "outlined"}
            size="small"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Button>

          {TEMPLATE_CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "contained" : "outlined"}
              size="small"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="templates-list__grid">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className="templates-list__card"
            elevation={0}
          >
            <CardContent className="templates-list__card-content">
              <div className="templates-list__card-header">
                <div className="templates-list__card-header-main">
                  <Typography
                    variant="h6"
                    className="templates-list__card-title"
                  >
                    {template.name}
                  </Typography>

                  <Chip
                    label={template.category}
                    size="small"
                    variant="outlined"
                  />
                </div>

                <IconButton
                  aria-label={`Abrir ações de ${template.name}`}
                  onClick={(event) => handleOpenMenu(event, template)}
                  size="small"
                >
                  <MoreVertical size={18} />
                </IconButton>
              </div>

              <Typography
                variant="body2"
                className="templates-list__description"
              >
                {template.description}
              </Typography>

              <div className="templates-list__card-footer">
                <Typography
                  variant="body2"
                  className="templates-list__fields-count"
                >
                  {template.fields.length} campos
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/requests/new/${template.id}`)}
                >
                  Abrir Requerimento
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="templates-list__empty">
          <div className="templates-list__empty-icon">
            <Search size={28} />
          </div>

          <Typography variant="h6" className="templates-list__empty-title">
            Nenhum modelo encontrado
          </Typography>

          <Typography
            variant="body2"
            className="templates-list__empty-subtitle"
          >
            Tente ajustar os filtros ou criar um novo modelo
          </Typography>
        </div>
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
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
        <MenuItem onClick={handleViewTemplate}>
          <div className="templates-list__menu-item">
            <Eye size={16} />
            <span>Visualizar</span>
          </div>
        </MenuItem>

        <MenuItem onClick={handleEditSelectedTemplate}>
          <div className="templates-list__menu-item">
            <Edit2 size={16} />
            <span>Editar</span>
          </div>
        </MenuItem>

        <MenuItem onClick={handleDuplicateTemplate}>
          <div className="templates-list__menu-item">
            <Copy size={16} />
            <span>Duplicar</span>
          </div>
        </MenuItem>

        <MenuItem onClick={handleDeleteTemplate}>
          <div className="templates-list__menu-item templates-list__menu-item--danger">
            <Trash2 size={16} />
            <span>Excluir</span>
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
}
