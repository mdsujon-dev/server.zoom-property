import { PageViewServices } from "../pageView/pageView.service";
import {
  IDashboardOverview,
  IDashboardStat,
  IQuickStats,
  ITrafficSourceItem,
  IWeeklyActivityItem,
} from "./dashboard.interface";

/* =========================================================
   Stats grid — content counts
========================================================= */

const buildStats = async (): Promise<IDashboardStat[]> => {
  return [];
};

/* =========================================================
   Visitor analytics — delegated to the PageView module
========================================================= */

const buildTrafficSources = async (): Promise<ITrafficSourceItem[]> =>
  PageViewServices.buildTrafficSources();

const buildWeeklyActivity = async (): Promise<IWeeklyActivityItem[]> =>
  PageViewServices.buildWeeklyActivity();

const buildQuickStats = async (): Promise<IQuickStats> =>
  PageViewServices.buildQuickStats();

/* =========================================================
   Aggregated overview
========================================================= */

const getOverview = async (): Promise<IDashboardOverview> => {
  const [stats, trafficSources, weeklyActivity, quickStats] = await Promise.all(
    [
      buildStats(),
      buildTrafficSources(),
      buildWeeklyActivity(),
      buildQuickStats(),
    ]
  );

  return {
    stats,
    traffic_sources: trafficSources,
    weekly_activity: weeklyActivity,
    quick_stats: quickStats,
  };
};

export const DashboardServices = {
  getOverview,
  buildStats,
  buildTrafficSources,
  buildWeeklyActivity,
  buildQuickStats,
};
