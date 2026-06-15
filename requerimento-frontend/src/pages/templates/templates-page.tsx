import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, FilePlus2, Search } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { AsyncState } from "../../components/async-state/async-state";
import { useTemplates } from "../../hooks/use-templates";
import "./templates-styles.scss";

export function TemplatesPage() {
  const navigate = useNavigate();
  const { data: templates, loading, error, reload } = useTemplates();
  const [view, setView] = useState<"catalog" | "admin">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      [...new Set((templates ?? []).map((template) => template.category))].sort(),
    [templates],
  );

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.toLocaleLowerCase("pt-BR").trim();

    return (templates ?? []).filter((template) => {
      if (view === "catalog" && !template.active) return false;
      const matchesSearch =
        template.name.toLocaleLowerCase("pt-BR").includes(query) ||
        template.description.toLocaleLowerCase("pt-BR").includes(query);
      const matchesCategory =
        !selectedCategory || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, templates, view]);

  return (
    <div className="templates-list">
      <div className="templates-list__header-row">
        <div className="templates-list__header">
          <Typography variant="h4" className="templates-list__title">
            {view === "catalog"
              ? "Catálogo de requerimentos"
              : "Administração de templates"}
          </Typography>
          <Typography variant="body1" className="templates-list__subtitle">
            {view === "catalog"
              ? "Escolha um template ativo para preencher."
              : "Crie e edite os templates cadastrados."}
          </Typography>
        </div>

        {view === "admin" && (
          <Button
            variant="contained"
            startIcon={<FilePlus2 size={18} />}
            onClick={() => navigate("/templates/new")}
          >
            Novo template
          </Button>
        )}
      </div>

      {!loading && !error && (
        <div className="templates-list__filters">
          <div className="templates-list__view-switch" aria-label="Modo de visualização">
            <Button
              variant={view === "catalog" ? "contained" : "outlined"}
              onClick={() => setView("catalog")}
            >
              Catálogo
            </Button>
            <Button
              variant={view === "admin" ? "contained" : "outlined"}
              onClick={() => setView("admin")}
            >
              Administração
            </Button>
          </div>
          <OutlinedInput
            fullWidth
            placeholder="Buscar por nome ou descrição..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            inputProps={{ "aria-label": "Buscar templates" }}
            startAdornment={
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            }
          />

          <div className="templates-list__categories" aria-label="Categorias">
            <Button
              variant={selectedCategory === null ? "contained" : "outlined"}
              size="small"
              onClick={() => setSelectedCategory(null)}
            >
              Todas
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={
                  selectedCategory === category ? "contained" : "outlined"
                }
                size="small"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        empty={!loading && !error && filteredTemplates.length === 0}
        emptyTitle="Nenhum template encontrado"
        emptyDescription="Ajuste os filtros ou cadastre um novo template."
      />

      {!loading && !error && filteredTemplates.length > 0 && (
        <div className="templates-list__grid">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="templates-list__card" elevation={0}>
              <CardContent className="templates-list__card-content">
                <div className="templates-list__card-header">
                  <div className="templates-list__card-header-main">
                    <Typography variant="h6" className="templates-list__card-title">
                      {template.name}
                    </Typography>
                    <div className="templates-list__badges">
                      <Chip label={template.category} size="small" variant="outlined" />
                      <Chip
                        label={template.active ? "Ativo" : "Inativo"}
                        size="small"
                        color={template.active ? "success" : "default"}
                      />
                    </div>
                  </div>
                </div>

                <Typography variant="body2" className="templates-list__description">
                  {template.description}
                </Typography>

                <div className="templates-list__card-footer">
                  <Typography variant="body2" className="templates-list__fields-count">
                    {template.fields.length}{" "}
                    {template.fields.length === 1 ? "campo" : "campos"}
                  </Typography>
                  <div className="templates-list__card-actions">
                    {view === "admin" && (
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<Edit2 size={15} />}
                        onClick={() => navigate(`/templates/edit/${template.id}`)}
                      >
                        Editar
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!template.active}
                      onClick={() => navigate(`/requests/new/${template.id}`)}
                    >
                      Preencher
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
