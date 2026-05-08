export const contentPageRoutes = [
  {
    fileId: "repo:content/README.md",
    path: "content/README.md",
    route: "/",
    slug: "",
    title: "Experimental Software",
  },
  {
    fileId: "repo:content/PROJECTS.md",
    path: "content/PROJECTS.md",
    route: "/projects",
    slug: "projects",
    title: "Projects",
  },
  {
    fileId: "repo:content/WEBSITE.md",
    path: "content/WEBSITE.md",
    route: "/website",
    slug: "website",
    title: "Website",
  },
  {
    fileId: "repo:content/ABOUT.md",
    path: "content/ABOUT.md",
    route: "/about",
    slug: "about",
    title: "About",
  },
  {
    fileId: "repo:content/CONTACT.md",
    path: "content/CONTACT.md",
    route: "/contact",
    slug: "contact",
    title: "Contact",
  },
] as const;

export function contentRouteForFileId(fileId: string) {
  return contentPageRoutes.find((route) => route.fileId === fileId) ?? null;
}

export function contentRouteForSlug(slug: string) {
  return contentPageRoutes.find((route) => route.slug === slug) ?? null;
}
