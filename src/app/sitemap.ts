import type { MetadataRoute } from "next";
import { contentPageRoutes } from "@/features/workspace/contentRoutes";

const siteUrl = "https://experimental.software";

export default function sitemap(): MetadataRoute.Sitemap {
  return contentPageRoutes.map((route) => ({
    url: new URL(route.route, siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route.route === "/" ? 1 : 0.8,
  }));
}
