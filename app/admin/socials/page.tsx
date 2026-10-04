import { SocialsManager } from "@/components/admin/socials-manager";
import { getAdminPortfolio } from "@/lib/content/repository";

export default async function SocialsPage() {
  const data = await getAdminPortfolio();
  return <SocialsManager links={data.socialLinks} />;
}
