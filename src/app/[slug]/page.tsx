import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/ide/WorkspaceShell";
import { contentPageRoutes, contentRouteForSlug } from "@/features/workspace/contentRoutes";

interface ContentPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return contentPageRoutes
    .filter((route) => route.slug)
    .map((route) => ({ slug: route.slug }));
}

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = contentRouteForSlug(slug);

  if (!route) {
    return {};
  }

  return {
    title: `${route.title} | Experimental Software`,
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { slug } = await params;
  const route = contentRouteForSlug(slug);

  if (!route) {
    notFound();
  }

  return <WorkspaceShell initialFileId={route.fileId} />;
}
