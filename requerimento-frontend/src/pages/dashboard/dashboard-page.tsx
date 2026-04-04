import {
  FileStack,
  ClipboardList,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  Chip,
  Typography,
  Box,
} from "@mui/material";

import { mockTemplates, mockRequests } from "../../lib/mock-data";
import "./dashboard-style.scss";

type RequestStatus = "pending" | "in_progress" | "approved" | "rejected";

type StatusConfig = {
  label: string;
  color: "default" | "primary" | "success" | "warning" | "error";
};

const stats = [
  {
    label: "Modelos Ativos",
    value: mockTemplates.filter((template) => template.isActive).length,
    icon: FileStack,
    iconClassName: "dashboard__stat-icon--primary",
    iconWrapperClassName: "dashboard__stat-icon-wrapper--primary",
  },
  {
    label: "Total de Requerimentos",
    value: mockRequests.length,
    icon: ClipboardList,
    iconClassName: "dashboard__stat-icon--info",
    iconWrapperClassName: "dashboard__stat-icon-wrapper--info",
  },
  {
    label: "Aprovados",
    value: mockRequests.filter((request) => request.status === "approved").length,
    icon: CheckCircle,
    iconClassName: "dashboard__stat-icon--success",
    iconWrapperClassName: "dashboard__stat-icon-wrapper--success",
  },
  {
    label: "Pendentes",
    value: mockRequests.filter((request) => request.status === "pending").length,
    icon: Clock,
    iconClassName: "dashboard__stat-icon--warning",
    iconWrapperClassName: "dashboard__stat-icon-wrapper--warning",
  },
];

const statusConfig: Record<RequestStatus, StatusConfig> = {
  pending: { label: "Pendente", color: "warning" },
  in_progress: { label: "Em Análise", color: "primary" },
  approved: { label: "Aprovado", color: "success" },
  rejected: { label: "Rejeitado", color: "error" },
};

export function DashboardPage() {
  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <Typography variant="h4" className="dashboard__title">
          Dashboard
        </Typography>

        <Typography variant="body1" className="dashboard__subtitle">
          Visão geral do sistema de requerimentos
        </Typography>
      </div>

      <div className="dashboard__stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label} className="dashboard__stat-card" elevation={0}>
              <CardContent className="dashboard__stat-card-content">
                <div className={`dashboard__stat-icon-wrapper ${stat.iconWrapperClassName}`}>
                  <Icon className={`dashboard__stat-icon ${stat.iconClassName}`} size={24} />
                </div>

                <div className="dashboard__stat-text">
                  <Typography variant="h5" className="dashboard__stat-value">
                    {stat.value}
                  </Typography>

                  <Typography variant="body2" className="dashboard__stat-label">
                    {stat.label}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="dashboard__sections">
        <Card className="dashboard__section-card" elevation={0}>
          <CardContent className="dashboard__section-content">
            <div className="dashboard__section-header">
              <Typography variant="h6" className="dashboard__section-title">
                Modelos Populares
              </Typography>

              <Typography variant="body2" className="dashboard__section-subtitle">
                Modelos mais utilizados recentemente
              </Typography>
            </div>

            <div className="dashboard__list">
              {mockTemplates.slice(0, 3).map((template) => (
                <div key={template.id} className="dashboard__list-item">
                  <div className="dashboard__list-item-left">
                    <div className="dashboard__template-icon-wrapper">
                      <FileStack size={20} className="dashboard__template-icon" />
                    </div>

                    <div className="dashboard__list-item-text">
                      <Typography variant="body1" className="dashboard__item-title">
                        {template.name}
                      </Typography>

                      <Typography variant="body2" className="dashboard__item-subtitle">
                        {template.fields.length} campos
                      </Typography>
                    </div>
                  </div>

                  <Chip
                    label={template.category}
                    size="small"
                    variant="outlined"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard__section-card" elevation={0}>
          <CardContent className="dashboard__section-content">
            <div className="dashboard__section-header">
              <Typography variant="h6" className="dashboard__section-title">
                Requerimentos Recentes
              </Typography>

              <Typography variant="body2" className="dashboard__section-subtitle">
                Últimas solicitações enviadas
              </Typography>
            </div>

            <div className="dashboard__list">
              {mockRequests.map((request) => (
                <div key={request.id} className="dashboard__list-item dashboard__list-item--request">
                  <div className="dashboard__list-item-left dashboard__list-item-left--column">
                    <Box className="dashboard__request-top">
                      <Typography variant="body1" className="dashboard__item-title">
                        {request.templateName}
                      </Typography>

                      <Chip
                        label={statusConfig[request.status as RequestStatus].label}
                        color={statusConfig[request.status as RequestStatus].color}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="body2" className="dashboard__item-subtitle">
                      {request.submittedBy} • {request.submittedAt}
                    </Typography>
                  </div>

                  <Typography variant="caption" className="dashboard__request-id">
                    {request.id}
                  </Typography>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}