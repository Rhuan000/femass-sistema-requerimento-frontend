import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, ChevronDown } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Menu,
  MenuItem,
  OutlinedInput,
  Typography,
} from "@mui/material";

import { mockRequests } from "../../lib/mock-data";
import type { RequestStatus } from "../../lib/types";

import "./requests-page-style.scss";

type StatusConfigItem = {
  label: string;
  colorClassName: string;
  chipColor: "default" | "primary" | "success" | "warning" | "error";
};

const statusConfig: Record<RequestStatus, StatusConfigItem> = {
  pending: {
    label: "Pendente",
    colorClassName: "requests-list__status--pending",
    chipColor: "warning",
  },
  in_progress: {
    label: "Em Análise",
    colorClassName: "requests-list__status--in-progress",
    chipColor: "primary",
  },
  approved: {
    label: "Aprovado",
    colorClassName: "requests-list__status--approved",
    chipColor: "success",
  },
  rejected: {
    label: "Rejeitado",
    colorClassName: "requests-list__status--rejected",
    chipColor: "error",
  },
};

export function RequestsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<RequestStatus>>(new Set());
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().trim();

    return mockRequests.filter((request) => {
      const matchesSearch =
        request.templateName.toLowerCase().includes(normalizedQuery) ||
        request.submittedBy.toLowerCase().includes(normalizedQuery) ||
        request.id.toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        statusFilter.size === 0 || statusFilter.has(request.status);

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const toggleStatus = (status: RequestStatus) => {
    const newFilter = new Set(statusFilter);

    if (newFilter.has(status)) {
      newFilter.delete(status);
    } else {
      newFilter.add(status);
    }

    setStatusFilter(newFilter);
  };

  const handleOpenFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseFilterMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleOpenRequest = (templateId: string) => {
    navigate(`/requests/new/${templateId}`);
  };

  return (
    <div className="requests-list">
      <div className="requests-list__header">
        <Typography variant="h4" className="requests-list__title">
          Requerimentos
        </Typography>

        <Typography variant="body1" className="requests-list__subtitle">
          Acompanhe o status das solicitações enviadas
        </Typography>
      </div>

      <div className="requests-list__filters">
        <div className="requests-list__search">
          <OutlinedInput
            fullWidth
            placeholder="Buscar por tipo, solicitante ou ID..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            }
          />
        </div>

        <div className="requests-list__filter-action">
          <Button
            variant="outlined"
            onClick={handleOpenFilterMenu}
            startIcon={<Filter size={16} />}
            endIcon={<ChevronDown size={16} />}
          >
            Filtrar Status
            {statusFilter.size > 0 && (
              <span className="requests-list__filter-count">
                {statusFilter.size}
              </span>
            )}
          </Button>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleCloseFilterMenu}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            {(Object.keys(statusConfig) as RequestStatus[]).map((status) => {
              const active = statusFilter.has(status);

              return (
                <MenuItem
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className="requests-list__menu-item"
                >
                  <div className="requests-list__menu-item-content">
                    <span>{statusConfig[status].label}</span>
                    {active && (
                      <span className="requests-list__menu-item-check">✓</span>
                    )}
                  </div>
                </MenuItem>
              );
            })}
          </Menu>
        </div>
      </div>

      <div className="requests-list__mobile">
        {filteredRequests.map((request) => (
          <Card
            key={request.id}
            className="requests-list__mobile-card"
            elevation={0}
          >
            <CardContent className="requests-list__mobile-card-content">
              <div className="requests-list__mobile-card-top">
                <div className="requests-list__mobile-card-main">
                  <Typography
                    variant="h6"
                    className="requests-list__mobile-card-title"
                  >
                    {request.templateName}
                  </Typography>

                  <Typography
                    variant="caption"
                    className="requests-list__mobile-card-id"
                  >
                    {request.id}
                  </Typography>
                </div>

                <Chip
                  label={statusConfig[request.status].label}
                  size="small"
                  className={statusConfig[request.status].colorClassName}
                />
              </div>

              <div className="requests-list__mobile-card-info">
                <div className="requests-list__mobile-card-row">
                  <span className="requests-list__mobile-card-label">
                    Solicitante:
                  </span>
                  <span className="requests-list__mobile-card-value">
                    {request.submittedBy}
                  </span>
                </div>

                <div className="requests-list__mobile-card-row">
                  <span className="requests-list__mobile-card-label">Data:</span>
                  <span className="requests-list__mobile-card-value">
                    {request.submittedAt}
                  </span>
                </div>
              </div>

              <div className="requests-list__mobile-card-footer">
                <Button
                  variant="text"
                  size="small"
                  onClick={() => handleOpenRequest(request.templateId)}
                >
                  Ver detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="requests-list__table-card" elevation={0}>
        <CardContent className="requests-list__table-card-content">
          <div className="requests-list__table-wrapper">
            <table className="requests-list__table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Solicitante</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="requests-list__cell-id">{request.id}</td>
                    <td className="requests-list__cell-strong">
                      {request.templateName}
                    </td>
                    <td>{request.submittedBy}</td>
                    <td className="requests-list__cell-muted">
                      {request.submittedAt}
                    </td>
                    <td>
                      <Chip
                        label={statusConfig[request.status].label}
                        size="small"
                        className={statusConfig[request.status].colorClassName}
                      />
                    </td>
                    <td className="requests-list__cell-action">
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => handleOpenRequest(request.templateId)}
                      >
                        Ver detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredRequests.length === 0 && (
        <div className="requests-list__empty">
          <div className="requests-list__empty-icon">
            <Search size={28} />
          </div>

          <Typography variant="h6" className="requests-list__empty-title">
            Nenhum requerimento encontrado
          </Typography>

          <Typography variant="body2" className="requests-list__empty-subtitle">
            Tente ajustar os filtros de busca
          </Typography>
        </div>
      )}
    </div>
  );
}
