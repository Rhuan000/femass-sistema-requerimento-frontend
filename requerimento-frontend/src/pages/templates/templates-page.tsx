import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  Edit2,
  FilePlus2,
  Power,
  PowerOff,
  Search,
  Send,
  Undo2,
} from "lucide-react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { AsyncState } from "../../components/async-state/async-state";
import { TemplateStatusChip } from "../../components/template-status-chip/template-status-chip";
import { useManagedTemplates, useTemplates } from "../../hooks/use-templates";
import { getErrorMessage } from "../../lib/api/http-client";
import {
  requestService,
  type TemplateStatusAction,
} from "../../lib/api/request-service";
import { useAuth } from "../../lib/auth/auth-context";
import type { Template } from "../../lib/types";
import "./templates-styles.scss";

// Só a aparência de cada ação. Quais ações aparecem vem de template.availableActions.
const STATUS_ACTION_BUTTONS: Array<{
  action: TemplateStatusAction;
  label: string;
  icon: React.ReactNode;
  variant: "contained" | "outlined";
  color?: "success" | "warning" | "error";
}> = [
  {
    action: "submit-approval",
    label: "Enviar para aprovação",
    icon: <Send size={15} />,
    variant: "contained",
  },
  {
    action: "return-for-editing",
    label: "Devolver",
    icon: <Undo2 size={15} />,
    variant: "outlined",
    color: "warning",
  },
  {
    action: "approve",
    label: "Aprovar",
    icon: <Check size={15} />,
    variant: "contained",
    color: "success",
  },
  {
    action: "activate",
    label: "Ativar",
    icon: <Power size={15} />,
    variant: "contained",
    color: "success",
  },
  {
    action: "deactivate",
    label: "Desativar",
    icon: <PowerOff size={15} />,
    variant: "outlined",
    color: "error",
  },
];

export function TemplatesPage() {
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const [view, setView] = useState<"catalog" | "admin">("catalog");
  const isAdminView = view === "admin" && permissions.canManageTemplates;

  const catalog = useTemplates();
  const managed = useManagedTemplates(isAdminView);
  const { data: templates, loading, error, reload, setData } = isAdminView
    ? managed
    : catalog;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const categories = useMemo(
    () =>
      [...new Set((templates ?? []).map((template) => template.category))].sort(),
    [templates],
  );

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.toLocaleLowerCase("pt-BR").trim();

    return (templates ?? []).filter((template) => {
      const matchesSearch =
        template.name.toLocaleLowerCase("pt-BR").includes(query) ||
        template.description.toLocaleLowerCase("pt-BR").includes(query);
      const matchesCategory =
        !selectedCategory || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, templates]);

  const handleStatusAction = async (
    template: Template,
    action: TemplateStatusAction,
  ) => {
    setPendingActionId(template.id);
    setActionError(null);

    try {
      const updated = await requestService.changeTemplateStatus(
        template.id,
        action,
      );
      // A resposta já traz o novo status e as novas availableActions.
      setData((current) =>
        (current ?? []).map((item) => (item.id === updated.id ? updated : item)),
      );
      // O catálogo só mostra templates ativos; recarrega para refletir a mudança.
      void catalog.reload();
    } catch (requestError) {
      setActionError(
        `Não foi possível alterar "${template.name}": ${getErrorMessage(requestError)}`,
      );
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="templates-list">
      <div className="templates-list__header-row">
        <div className="templates-list__header">
          <Typography variant="h4" className="templates-list__title">
            {isAdminView ? "Administração de templates" : "Catálogo de requerimentos"}
          </Typography>
          <Typography variant="body1" className="templates-list__subtitle">
            {isAdminView
              ? "Acompanhe a situação dos templates, aprove e gerencie a disponibilidade."
              : "Escolha um template ativo para preencher."}
          </Typography>
        </div>

        {isAdminView && permissions.canCreateTemplate && (
          <Button
            variant="contained"
            startIcon={<FilePlus2 size={18} />}
            onClick={() => navigate("/templates/new")}
          >
            Novo template
          </Button>
        )}
      </div>

      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {!loading && !error && (
        <div className="templates-list__filters">
          {permissions.canManageTemplates && (
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
          )}
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
        emptyDescription={
          isAdminView
            ? "Ajuste os filtros ou cadastre um novo template."
            : "Ajuste os filtros ou aguarde novos templates serem ativados."
        }
      />

      {!loading && !error && filteredTemplates.length > 0 && (
        <div className="templates-list__grid">
          {filteredTemplates.map((template) => {
            const busy = pendingActionId === template.id;
            const statusActions = isAdminView
              ? STATUS_ACTION_BUTTONS.filter((item) =>
                  template.availableActions.includes(item.action),
                )
              : [];

            return (
              <Card key={template.id} className="templates-list__card" elevation={0}>
                <CardContent className="templates-list__card-content">
                  <div className="templates-list__card-header">
                    <div className="templates-list__card-header-main">
                      <Typography variant="h6" className="templates-list__card-title">
                        {template.name}
                      </Typography>
                      <div className="templates-list__badges">
                        <Chip label={template.category} size="small" variant="outlined" />
                        <TemplateStatusChip status={template.status} />
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
                      {isAdminView && template.availableActions.includes("edit") && (
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<Edit2 size={15} />}
                          disabled={busy}
                          onClick={() => navigate(`/templates/edit/${template.id}`)}
                        >
                          Editar modelo
                        </Button>
                      )}
                      {statusActions.map((item) => (
                        <Button
                          key={item.action}
                          variant={item.variant}
                          color={item.color}
                          size="small"
                          startIcon={item.icon}
                          disabled={busy}
                          onClick={() => void handleStatusAction(template, item.action)}
                        >
                          {item.label}
                        </Button>
                      ))}
                      {!isAdminView && permissions.canCreateSubmission && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => navigate(`/requests/new/${template.id}`)}
                        >
                          Preencher
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
