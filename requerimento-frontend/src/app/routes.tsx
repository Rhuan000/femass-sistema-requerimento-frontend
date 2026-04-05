import { BrowserRouter, Routes, Route } from "react-router-dom";

import { DashboardPage } from "../pages/dashboard/dashboard-page";
import { TemplatesPage } from "../pages/templates/templates-page";
import TemplateBuilderPage from "../pages/template-builder/template-builder-page";
import { RequestsPage } from "../pages/requests/requests-page";
import { RequestFormPage } from "../pages/request-form/request-form-page";
import { AppLayout } from "./app-layout";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/templates/new" element={<TemplateBuilderPage />} />
          <Route path="/templates/edit/:id" element={<TemplateBuilderPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/requests/new/:templateId" element={<RequestFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}