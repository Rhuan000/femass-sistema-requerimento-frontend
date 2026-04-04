import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardPage from "../src/pages/dashboard/dashboard-page";
import TemplatesPage from "../src/pages/templates/templates-page";
import TemplateBuilderPage from "../src/pages/template-builder/template-builder-page";
import RequestsPage from "../src/pages/requests/requests-page";
import RequestFormPage from "../src/pages/request-form/request-form-page";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/new" element={<TemplateBuilderPage />} />
        <Route path="/templates/edit/:id" element={<TemplateBuilderPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/requests/new/:templateId" element={<RequestFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}