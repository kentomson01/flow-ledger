import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  organization: "Organization",
  team: "Team",
  payroll: "Payroll",
  new: "New Payroll",
  history: "History",
  settings: "Settings",
  freelancer: "Dashboard",
  payments: "Payments",
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, idx) => {
    const path = "/" + segments.slice(0, idx + 1).join("/");
    const label = ROUTE_LABELS[segment] || (segment.startsWith("pr-") ? "Receipt" : segment);
    const isLast = idx === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <Breadcrumb className="hidden sm:flex">
      <BreadcrumbList>
        {crumbs.map((crumb, idx) => (
          <Fragment key={crumb.path}>
            {idx > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
