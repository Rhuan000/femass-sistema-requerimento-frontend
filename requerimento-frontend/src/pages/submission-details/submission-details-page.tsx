import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button, Card, CardContent, Chip, Typography } from "@mui/material";
import { AsyncState } from "../../components/async-state/async-state";
import { useAsync } from "../../hooks/use-async";
import { requestService } from "../../lib/api/request-service";
import "../requests/requests-page-style.scss";

export function SubmissionDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: submission, loading, error, reload } = useAsync(
    () =>
      id
        ? requestService.getSubmission(id)
        : Promise.reject(new Error("ID do envio não informado.")),
    id,
  );

  return (
    <div className="requests-list">
      <div className="requests-list__header">
        <Button
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate("/requests")}
          sx={{ alignSelf: "flex-start" }}
        >
          Voltar
        </Button>
        <Typography variant="h4" className="requests-list__title">
          Detalhes do envio
        </Typography>
      </div>

      <AsyncState loading={loading} error={error} onRetry={reload} />

      {submission && !loading && !error && (
        <Card className="requests-list__submission" elevation={0}>
          <CardContent className="requests-list__details">
            <div className="requests-list__submission-header">
              <div>
                <Typography variant="overline">ID</Typography>
                <Typography className="requests-list__cell-id">
                  {submission.id}
                </Typography>
              </div>
              <Chip label={submission.status} />
            </div>
            <dl className="requests-list__details-list">
              <div>
                <dt>Template</dt>
                <dd>{submission.templateName || submission.templateId}</dd>
              </div>
              <div>
                <dt>Usuário</dt>
                <dd>{submission.submittedBy}</dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>{new Date(submission.submittedAt).toLocaleString("pt-BR")}</dd>
              </div>
            </dl>
            <div className="requests-list__answers-block">
              <Typography variant="h6">Respostas</Typography>
              <dl className="requests-list__answers requests-list__answers--details">
                {Object.entries(submission.data).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{String(value ?? "")}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
