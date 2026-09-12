import { Router } from "express";
import { activityNotifier } from "../middleware/activityNotifier";
import { ActionLogRoutes } from "../modules/actionLog/actionLog.route";
import { AreaRoutes } from "../modules/area/area.routes";
import { BlogRoutes } from "../modules/blog/blog.routes";
import { BlogCommentRoutes } from "../modules/blogComment/blogComment.routes";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { CountryRoutes } from "../modules/country/country.routes";
import { DashboardRoutes } from "../modules/dashboard/dashboard.routes";
import designationRoutes from "../modules/designation/designation.routes";
import { EmployeeRoutes } from "../modules/employee/employee.routes";
import { ErrorLogRoutes } from "../modules/errorLog/errorLog.routes";
import { FolderRoutes } from "../modules/folder/folder.routes";
import { InquiriesRoutes } from "../modules/inquiries/inquiries.routes";
import { MediaLibraryRoutes } from "../modules/media-library/media-library.routes";
import { NotificationRoutes } from "../modules/notification/notification.routes";
import { PageViewRoutes } from "../modules/pageView/pageView.routes";
import { PermissionsRoutes } from "../modules/permissions/permissions.routes";
import { ProjectRoutes } from "../modules/project/project.routes";
import { PropertyRoutes } from "../modules/property/property.routes";
import { ReviewRoutes } from "../modules/review/review.routes";
import { HistoryRoutes } from "../modules/history/history.routes";
import { CompanyRoutes } from "../modules/company/company.routes";
import { ReportRoutes } from "../modules/report/report.routes";
import { RoleRoutes } from "../modules/role/role.routes";
import { RolePermissionRoutes } from "../modules/rolePermission/rolePermission.routes";
import { ServicesCountryRoutes } from "../modules/servicesCountry/servicesCountry.routes";
import { SitemapRoutes } from "../modules/sitemap/sitemap.route";
import { UserRoutes } from "../modules/user/user.routes";
import { DynamicContentRoutes } from "../modules/dynamicContent/dynamicContent.route";
import { LandownerProjectRoutes } from "../modules/landownerProject/landownerProject.routes";
import { ShowcaseVideoRoutes } from "../modules/showcaseVideo/showcaseVideo.routes";
import { AgentRoutes } from "../modules/agent/agent.routes";

const router = Router();

// Broadcast an admin notification on every successful write (POST/PUT/PATCH/DELETE)
// across all module routes. GET requests are ignored.
router.use(activityNotifier);

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/services-countries",
    route: ServicesCountryRoutes,
  },
  {
    path: "/media-library",
    route: MediaLibraryRoutes,
  },
  {
    path: "/folders",
    route: FolderRoutes,
  },
  {
    path: "/action-logs",
    route: ActionLogRoutes,
  },
  {
    path: "/error-logs",
    route: ErrorLogRoutes,
  },
  {
    path: "/inquiries",
    route: InquiriesRoutes,
  },
  {
    path: "/dynamic-content",
    route: DynamicContentRoutes,
  },
  {
    path: "/showcase-videos",
    route: ShowcaseVideoRoutes,
  },
  {
    path: "/landowner-projects",
    route: LandownerProjectRoutes,
  },
  {
    path: "/sitemap",
    route: SitemapRoutes,
  },
  {
    path: "/permissions",
    route: PermissionsRoutes,
  },
  {
    path: "/roles",
    route: RoleRoutes,
  },
  {
    path: "/role-permissions",
    route: RolePermissionRoutes,
  },
  {
    path: "/employees",
    route: EmployeeRoutes,
  },
  /* The listing book and everything hanging off it. */
  {
    path: "/properties",
    route: PropertyRoutes,
  },
  {
    path: "/projects",
    route: ProjectRoutes,
  },
  {
    path: "/areas",
    route: AreaRoutes,
  },
  {
    path: "/blog",
    route: BlogRoutes,
  },
  {
    path: "/blog-comments",
    route: BlogCommentRoutes,
  },
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
  {
    path: "/designations",
    route: designationRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/countries",
    route: CountryRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
  {
    path: "/reports",
    route: ReportRoutes,
  },
  {
    path: "/history",
    route: HistoryRoutes,
  },
  {
    path: "/company",
    route: CompanyRoutes,
  },
  {
    path: "/page-views",
    route: PageViewRoutes,
  },
  {
    path: "/agents",
    route: AgentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
