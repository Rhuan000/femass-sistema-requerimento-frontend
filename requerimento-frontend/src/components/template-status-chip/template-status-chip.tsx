import { Chip, Tooltip } from "@mui/material";
import { TEMPLATE_STATUS_INFO, type TemplateStatus } from "../../lib/types";

export function TemplateStatusChip({ status }: { status: TemplateStatus }) {
  const info = TEMPLATE_STATUS_INFO[status] ?? TEMPLATE_STATUS_INFO.DESATIVADO;

  return (
    <Tooltip title={info.description}>
      <Chip label={info.label} size="small" color={info.color} />
    </Tooltip>
  );
}
