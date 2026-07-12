import { RouteAccessRule } from "./types";

export const routeAccessRules: RouteAccessRule[] = [
  { path: "/dashboard", permission: "read:dashboard" },
  { path: "/vehicles", permission: "read:vehicles" },
  { path: "/drivers", permission: "read:drivers" },
  { path: "/trips", permission: "read:trips" },
  { path: "/maintenance", permission: "read:maintenance" },
  { path: "/finance", permission: "read:finance" },
  { path: "/reports", permission: "read:reports" },
  { path: "/compliance", permission: "read:compliance" },
  { path: "/settings", permission: "read:settings" },
];

export const publicRoutes = ["/login", "/logout", "/access-denied"];
