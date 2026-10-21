import { useMemo } from "react";
import { Autocomplete, Box, CircularProgress, TextField, Typography } from "@mui/material";
import type { ApprovalPerson } from "../../lib/types";

interface Suggestion {
  id: string;
  label: string;
  description: string;
  group: string;
}

const roles = ["SECRETARIA", "PROFESSOR", "COORDENADOR", "DIRETOR", "ORIENTADOR"];
const searchable = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function ResponsibleSearch({ people, value, onChange, includeRoles = false, disabled, loading, label = "Responsável" }: {
  people: ApprovalPerson[];
  value: string | null;
  onChange: (id: string | null) => void;
  includeRoles?: boolean;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}) {
  const options = useMemo<Suggestion[]>(() => [
    ...(includeRoles ? roles.map(role => ({ id: `role:${role}`, label: role, description: "Qualquer pessoa com este papel", group: "Papéis" })) : []),
    ...people.map(person => ({ id: `user:${person.id}`, label: person.name, description: person.roles.join(" · "), group: "Pessoas" })),
  ], [includeRoles, people]);
  const selected = options.find(option => option.id === value) ?? (value ? {
    id: value, label: loading ? "Carregando responsável..." : "Pessoa indisponível", description: value.replace(/^user:/, ""), group: "Pessoas",
  } : null);

  return <Autocomplete<Suggestion>
    fullWidth
    options={options}
    value={selected}
    onChange={(_, option) => onChange(option?.id ?? null)}
    getOptionLabel={option => option.label}
    getOptionKey={option => option.id}
    isOptionEqualToValue={(option, current) => option.id === current.id}
    groupBy={option => option.group}
    filterOptions={(items, state) => {
      const terms = searchable(state.inputValue).trim().split(/\s+/).filter(Boolean);
      return items.filter(option => {
        const text = searchable(`${option.label} ${option.description}`);
        return terms.every(term => text.includes(term));
      }).slice(0, 20);
    }}
    autoHighlight
    clearOnBlur
    disabled={disabled}
    loading={loading}
    loadingText="Carregando sugestões..."
    noOptionsText="Nenhum responsável encontrado. Tente outro nome ou papel."
    clearText="Limpar responsável"
    openText="Mostrar sugestões"
    closeText="Fechar sugestões"
    slotProps={{ listbox: { sx: { maxHeight: 300 } } }}
    renderOption={(props, option) => {
      const { key, ...rest } = props;
      return <li key={key} {...rest}><Box sx={{ minWidth: 0, py: 0.5 }}>
        <Typography variant="body2" fontWeight={500} sx={{ overflowWrap: "anywhere" }}>{option.label}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{option.description}</Typography>
      </Box></li>;
    }}
    renderInput={params => <TextField {...params} label={label}
      placeholder="Digite um nome ou papel para pesquisar"
      helperText="Digite para filtrar e selecione uma sugestão. Até 20 resultados por busca."
      InputProps={{ ...params.InputProps, endAdornment: <>{loading && <CircularProgress size={16} />}{params.InputProps.endAdornment}</> }}
    />}
  />;
}
