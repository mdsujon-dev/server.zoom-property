import { Request } from "express";
import { userCan } from "../../middleware/permission";
import { BlogPost } from "../blog/blog.model";
import { ContactMessage, QuotationRequest } from "../inquiries/inquiries.model";
import { Permissions } from "../permissions/permissions.model";
import { Project } from "../project/project.model";
import { Property } from "../property/property.model";
import { Review } from "../review/review.model";

const liveFilter = { isDeleted: { $ne: true } };

const monthsAgo = (months: number) => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - months);
  return d;
};

const listingTrend = async () => {
  const since = monthsAgo(5);
  const rows = await Property.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: since }, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byMonth = new Map(rows.map((r) => [r._id, r.count]));
  const out: { month: string; listings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = monthsAgo(i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ month: key, listings: byMonth.get(key) ?? 0 });
  }
  return out;
};

const getCompanyOverview = async (req: Request) => {
  const [
    canListings,
    canProjects,
    canEnquiries,
    canTrend,
    canContent,
  ] = await Promise.all([
    userCan(req, "Listings Summary", "View"),
    userCan(req, "Projects Summary", "View"),
    userCan(req, "Enquiries Summary", "View"),
    userCan(req, "Listing Trend", "View"),
    userCan(req, "Content Summary", "View"),
  ]);

  const [
    listings,
    projects,
    enquiries,
    trend,
    content,
  ] = await Promise.all([
    canListings
      ? (async () => {
          const [available, reserved, sold, rented, draft, featured] =
            await Promise.all([
              Property.countDocuments({ status: "available", ...liveFilter }),
              Property.countDocuments({ status: "reserved", ...liveFilter }),
              Property.countDocuments({ status: "sold", ...liveFilter }),
              Property.countDocuments({ status: "rented", ...liveFilter }),
              Property.countDocuments({ status: "draft", ...liveFilter }),
              Property.countDocuments({ featured: true, ...liveFilter }),
            ]);
          return {
            available,
            reserved,
            sold,
            rented,
            draft,
            featured,
            total: available + reserved + sold + rented + draft,
          };
        })()
      : null,

    canProjects
      ? (async () => {
          const [active, completed] = await Promise.all([
            Project.countDocuments({ isActive: true, ...liveFilter }),
            Project.countDocuments({
              stage: "Completed",
              ...liveFilter,
            }),
          ]);
          return { active, completed };
        })()
      : null,

    canEnquiries
      ? (async () => {
          const [contact, quotations] = await Promise.all([
            ContactMessage.countDocuments({}),
            QuotationRequest.countDocuments({}),
          ]);
          return { contact, quotations, total: contact + quotations };
        })()
      : null,

    canTrend ? listingTrend() : null,

    canContent
      ? (async () => {
          const [published, drafts, pendingReviews] = await Promise.all([
            BlogPost.countDocuments({ status: "published", ...liveFilter }),
            BlogPost.countDocuments({ status: "draft", ...liveFilter }),
            Review.countDocuments({ isPublished: false, ...liveFilter }),
          ]);
          return { published, drafts, pendingReviews };
        })()
      : null,
  ]);

  return {
    listings,
    projects,
    agents: null,
    money: null,
    enquiries,
    trend,
    content,
  };
};

const DOMAIN_MODULES: { module: string; description: string }[] = [
  { module: "Properties", description: "Listings: create, edit, publish and retire" },
  { module: "Projects", description: "Developments under construction" },
  { module: "Areas", description: "Neighbourhoods and their market figures" },
  { module: "Blog", description: "Articles and their categories" },
  { module: "Reviews", description: "Client reviews and what goes on the site" },
  {
    module: "Company Settings",
    description: "The agency's own name, logo, contact and ID card designs",
  },
  {
    module: "Landowners",
    description: "Joint-venture case studies shown to landowners",
  },
  {
    module: "Showcase Videos",
    description: "Films on the home page video carousel",
  },
  {
    module: "Dynamic Content",
    description: "Page section headings and copy shown on the public site",
  },
];

const DASHBOARD_MODULES: { module: string; description: string }[] = [
  {
    module: "Listings Summary",
    description: "Dashboard: how many listings are live, reserved and sold",
  },
  {
    module: "Projects Summary",
    description: "Dashboard: active developments and how many are completed",
  },
  {
    module: "Enquiries Summary",
    description: "Dashboard: contact messages and quotation requests received",
  },
  {
    module: "Listing Trend",
    description: "Dashboard: listings added per month over the last six",
  },
  {
    module: "Content Summary",
    description: "Dashboard: published articles, drafts and reviews awaiting approval",
  },
];

const RETIRED_MODULES = [
  "Agents",
  "Agents Summary",
  "Income & Expense",
  "Income",
  "Expenses",
  "Net Profit",
  "Income vs Expenses",
  "Institute Settings",
  "Students",
  "Courses",
  "Batches",
  "Faculty",
  "Exams",
  "Attendance",
  "Staff Attendance",
  "Certificates",
  "Notices",
  "Total Students",
  "Running Batches",
  "Total Due",
  "Today's Classes",
  "Admission Trend",
  "Running Courses",
  "Seat Capacity",
  "Finishing Soon",
  "Attendance Health",
  "Certificates Issued",
];

const seedPermissionModules = async () => {
  const wanted = [...DOMAIN_MODULES, ...DASHBOARD_MODULES];
  const names = wanted.map((m) => m.module);

  const existing = await Permissions.find({ module: { $in: names } }).select(
    "module"
  );
  const taken = new Set(existing.map((p) => p.module));

  const dashboardNames = new Set(DASHBOARD_MODULES.map((m) => m.module));
  const missing = wanted
    .filter((m) => !taken.has(m.module))
    .map((m) => ({
      ...m,
      actions: dashboardNames.has(m.module)
        ? ["view"]
        : ["view", "create", "update", "delete"],
    }));

  if (missing.length) await Permissions.insertMany(missing);

  const retired = await Permissions.deleteMany({
    module: { $in: RETIRED_MODULES },
  });

  return { added: missing.length, removed: retired.deletedCount ?? 0 };
};

export const CompanyDashboardService = {
  getCompanyOverview,
  seedPermissionModules,
};
