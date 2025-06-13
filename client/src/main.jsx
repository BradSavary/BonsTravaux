import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import { Root } from "./routes/root";
import { Login } from "./routes/Login";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { PermissionGuard } from "./components/Auth/PermissionGuard";
import { AuthProvider } from "./context/AuthContext";
import { Home } from "./routes/Home";
import { NewTicket } from "./routes/NewTicket";
import { Tickets } from "./routes/Tickets";
import { TicketManagement } from "./routes/TicketManagement";
import { Administration } from "./routes/Administration";
import { Settings } from "./routes/Settings";
import { Statistics } from "./routes/Statistics";
import { UsersManagement } from "./components/Admin/UserManagement";
import { ServicesManagement } from "./components/Admin/ServicesManagement";
import { ServicesDemandeurManagement } from "./components/Admin/ServicesDemandeurManagement";
import { EmailNotificationsManagement } from "./components/Admin/EmailNotificationsManagement";
import { TicketDetail } from "./routes/TicketDetail";
import { TicketCleanupManagement } from "./components/Admin/TicketCleanupManagement";
import { TicketCategoriesManagement } from "./components/Admin/TicketCategoriesManagement";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Root />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "new-ticket",
        element: <NewTicket />,
      },
      {
        path: "tickets",
        element: <Tickets />,
      },
      {
        path: "ticket/:ticketId",
        element: <TicketDetail />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "statistics",
        element: (
          <PermissionGuard requiredPermission="view_statistics" redirectTo="/">
            <Statistics />
          </PermissionGuard>
        ),
      },
      {
        path: "/tickets/manage",
        element: (
          <PermissionGuard
            requiredAnyPermission={[
              "InformatiqueTicket",
              "TechniqueTicket",
              "EconomatTicket",
            ]}
            redirectTo="/"
          >
            <TicketManagement />
          </PermissionGuard>
        ),
      },
      {
        path: "admin",
        element: (
          <PermissionGuard requiredPermission="AdminAccess" redirectTo="/">
            <Administration />
          </PermissionGuard>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/admin/users" replace />,
          },
          {
            path: "users",
            element: <UsersManagement />,
          },
          {
            path: "services",
            element: <ServicesManagement />,
          },
          {
            path: "services-demandeurs",
            element: <ServicesDemandeurManagement />,
          },
          {
            path: "email-notifications",
            element: <EmailNotificationsManagement />,
          },
          {
            path: "ticket-cleanup",
            element: <TicketCleanupManagement />,
          },
          {
            path: "ticket-categories",
            element: <TicketCategoriesManagement />,
          },
        ],
      },
      {
        path: "settings",
        element: (
          <PermissionGuard requiredPermission="AdminAccess" redirectTo="/">
            <Settings />
          </PermissionGuard>
        ),
      },
    ],
  },
  // Redirection par défaut vers la page d'accueil
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
