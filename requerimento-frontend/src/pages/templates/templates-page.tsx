import { useEffect, useMemo, useState } from "react";
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
import { requestService } from "../../lib/api/request-service";
import { getErrorMessage } from "../../lib/api/http-client";
import { TemplateApprovalFlow } from "../../components/template-approval-flow/template-approval-flow";
import type { Template } from "../../lib/types";
import "./templates-styles.scss";

export function TemplatesPage() {
  const navigate = useNavigate();
  const { data: templates, loading, error, reload } = useTemplates();
  const [managedTemplates, setManagedTemplates] = useState<Template[]>([]);
  const [managementLoading, setManagementLoading] = useState(false);
  const [managementError, setManagementError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState<"catalog" | "admin">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (view !== "admin") return;
    let active = true;
    requestService.listTemplates(true).then((items) => {
      if (active) { setManagedTemplates(items); setManagementError(null); }
    }).catch((err: unknown) => {
      if (active) setManagementError(getErrorMessage(err));
    }).finally(() => { if (active) setManagementLoading(false); });
    return () => { active = false; };
  }, [view, revision]);

  const visibleTemplates = view === "admin" ? managedTemplates : (templates ?? []);
  const categories = useMemo(
    () =>
      [...new Set(visibleTemplates.map((template) => template.category))].sort(),
    [visibleTemplates],
  );

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.toLocaleLowerCase("pt-BR").trim();

    return visibleTemplates.filter((template) => {
      if (view === "catalog" && !template.active) return false;
      const matchesSearch =
        template.name.toLocaleLowerCase("pt-BR").includes(query) ||
        template.description.toLocaleLowerCase("pt-BR").includes(query);
      const matchesCategory =
        !selectedCategory || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, visibleTemplates, view]);

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

      {view === "admin" && managementError && <Typography color="error">{managementError}</Typography>}
      {view === "admin" && managementLoading && <Typography>Carregando administração...</Typography>}
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
                      {template.status && <Chip label={template.status} size="small" color={template.status === "ATIVO" ? "success" : "default"} />}
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

                {view === "admin" && template.status && (
                  <TemplateApprovalFlow template={template} onChanged={() => setRevision((v) => v + 1)} />
                )}
                <div className="templates-list__card-footer">
                  <Typography variant="body2" className="templates-list__fields-count">
                    {template.fields.length}{" "}
                    {template.fields.length === 1 ? "campo" : "campos"}
                  </Typography>
                  <div className="templates-list__card-actions">
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<Edit2 size={15} />}
                      disabled={template.status !== undefined && template.status !== "EDITANDO"}
                      onClick={() => navigate(`/templates/edit/${template.id}`)}
                    >
                      Editar modelo
                    </Button>
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
