import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Box, Button, CircularProgress, Divider, IconButton, Popover, Stack, Tooltip, Typography } from "@mui/material";
import { Bell, Check } from "lucide-react";
import { useAsync } from "../../hooks/use-async";
import { requestService } from "../../lib/api/request-service";

export function ApprovalNotifications() {
  const navigate = useNavigate();
  const [actionError, setActionError] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const { data, loading, error, reload } = useAsync(() => requestService.approvalNotifications());
  useEffect(() => { const timer = window.setInterval(() => void reload(), 30000); return () => window.clearInterval(timer); }, [reload]);
  const unread = (data ?? []).filter(item => !item.readAt && !dismissed.has(item.id));

  const markRead = async (id: string) => {
    setReadingId(id);
    setActionError(false);
    try {
      await requestService.readApprovalNotification(id);
      // Oculta imediatamente após confirmação, inclusive se houver um polling em andamento.
      setDismissed(current => new Set(current).add(id));
    } catch { setActionError(true); }
    finally { setReadingId(null); }
  };

  return <>
    <Tooltip title="Notificações">
      <IconButton
        aria-label={`Notificações, ${unread.length} não lidas`}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchorEl)}
        aria-controls={anchorEl ? "approval-notifications" : undefined}
        onClick={event => { setAnchorEl(event.currentTarget); void reload(); }}
        className="app-header__icon-button"
      >
        <Badge badgeContent={unread.length} color="error" max={99}>
          <Bell size={21} aria-hidden="true" />
        </Badge>
      </IconButton>
    </Tooltip>
    <Popover
      id="approval-notifications"
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={() => setAnchorEl(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { sx: { width: 420, maxWidth: "calc(100vw - 32px)", mt: 1, borderRadius: 2 } } }}
    >
      <Box role="dialog" aria-label="Notificações de aprovação">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>Notificações ({unread.length})</Typography>
          {loading && <CircularProgress size={18} aria-label="Atualizando notificações" />}
        </Stack>
        <Divider />
        <Stack spacing={0} sx={{ maxHeight: "min(480px, 65vh)", overflowY: "auto" }}>
          {error && <Alert severity="error" action={<Button onClick={reload}>Tentar novamente</Button>}>{error}</Alert>}
          {actionError && <Alert severity="warning">Não foi possível marcar a notificação como lida. Tente novamente.</Alert>}
          {!error && !loading && !unread.length && <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: "center" }}>Você está em dia. Nenhuma notificação não lida.</Typography>}
          {unread.map(item => <Box key={item.id} sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="body2" fontWeight={500}>{item.message}</Typography>
            <Typography variant="caption" color="text.secondary">{new Date(item.createdAt).toLocaleString("pt-BR")}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
              <Button size="small" onClick={() => {
                setAnchorEl(null);
                navigate(`/requests/${item.templateId}/${item.submissionId}`);
              }}>Ver requerimento</Button>
              <Button size="small" startIcon={<Check size={15} aria-hidden="true" />} disabled={readingId !== null} onClick={() => void markRead(item.id)}>
                {readingId === item.id ? "Marcando..." : "Marcar como lida"}
              </Button>
            </Stack>
          </Box>)}
        </Stack>
      </Box>
    </Popover>
  </>;
}
