import { useNavigate } from "react-router-dom";
import { ClipboardList, FilePlus2, FileStack } from "lucide-react";
import { Button, Card, CardContent, Typography } from "@mui/material";
import { AsyncState } from "../../components/async-state/async-state";
import { useTemplates } from "../../hooks/use-templates";
import "./dashboard-style.scss";

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: templates, loading, error, reload } = useTemplates();

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <Typography variant="h4" className="dashboard__title">
          Sistema de Requerimentos FeMASS
        </Typography>
        <Typography variant="body1" className="dashboard__subtitle">
          Acesse o catálogo, administre templates e consulte envios.
        </Typography>
      </div>

      <AsyncState loading={loading} error={error} onRetry={reload} />

      {!loading && !error && (
        <>
          <div className="dashboard__stats">
            <Card className="dashboard__stat-card" elevation={0}>
              <CardContent className="dashboard__stat-card-content">
                <FileStack size={24} />
                <div className="dashboard__stat-text">
                  <Typography variant="h5" className="dashboard__stat-value">
                    {(templates ?? []).filter((template) => template.active).length}
                  </Typography>
                  <Typography variant="body2">Templates ativos</Typography>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="dashboard__sections">
            <Card className="dashboard__section-card" elevation={0}>
              <CardContent className="dashboard__section-content">
                <Typography variant="h6">Ações rápidas</Typography>
                <Button
                  startIcon={<FileStack size={18} />}
                  onClick={() => navigate("/templates")}
                >
                  Abrir catálogo
                </Button>
                <Button
                  startIcon={<FilePlus2 size={18} />}
                  onClick={() => navigate("/templates/new")}
                >
                  Criar template
                </Button>
                <Button
                  startIcon={<ClipboardList size={18} />}
                  onClick={() => navigate("/requests")}
                >
                  Consultar envios
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
