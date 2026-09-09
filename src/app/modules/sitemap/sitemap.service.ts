import config from "../../config";

const normalizeBaseUrl = () => {
  // Driven by FRONTEND_URL so the sitemap points at whatever site is deployed.
  return config.frontend_url || "http://localhost:3000";
};

const buildUrl = (baseUrl: string, path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`.replace(/([^:]\/)\/+/g, "$1");
};

const getSitemapData = async () => {
  const baseUrl = normalizeBaseUrl();
  const staticRoutes = [
    { label: "Home", url: buildUrl(baseUrl, "/") },
    { label: "About", url: buildUrl(baseUrl, "/about") },
    { label: "Blog", url: buildUrl(baseUrl, "/blog") },
    { label: "Leadership", url: buildUrl(baseUrl, "/about/leadership") },
    { label: "Talent", url: buildUrl(baseUrl, "/about/talent") },
    { label: "Book an Appointment", url: buildUrl(baseUrl, "/book-an-appoinment") },
    { label: "Careers", url: buildUrl(baseUrl, "/careers") },
    { label: "Case Studies", url: buildUrl(baseUrl, "/case-studies") },
    { label: "Contact Us", url: buildUrl(baseUrl, "/contact-us") },
    { label: "Get Quotation", url: buildUrl(baseUrl, "/get-quatation") },
    { label: "Portfolio", url: buildUrl(baseUrl, "/portfolio") },
  ];
  return {
    baseUrl,
    staticRoutes,
    blogs: [],
    services: [],
    caseStudies: [],
    generatedAt: new Date(),
  };
};

export const SitemapService = {
  getSitemapData,
};
