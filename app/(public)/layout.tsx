import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getPublicPortfolio } from "@/lib/content/repository";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const data = await getPublicPortfolio();
  return (
    <>
      <SiteHeader profile={data.profile} />
      <main className="flex-1">{children}</main>
      <SiteFooter profile={data.profile} links={data.socialLinks} />
    </>
  );
}
