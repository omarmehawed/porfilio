import { ProfileForm } from "@/components/admin/profile-form";
import { getAdminPortfolio } from "@/lib/content/repository";

export default async function ProfileAdminPage() {
  const data = await getAdminPortfolio();
  return <ProfileForm profile={data.profile} />;
}
