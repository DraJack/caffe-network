import { getStoreConfig } from "@/lib/config";
import { ConfigForm } from "@/components/admin/config-form";

export const metadata = { title: "Admin · Impostazioni" };

export default async function AdminSettingsPage() {
  const config = await getStoreConfig();
  return (
    <div>
      <h1 className="text-2xl font-bold text-coffee-900">Impostazioni store</h1>
      <p className="mt-1 text-coffee-600">Spedizione e piano provvigionale.</p>
      <ConfigForm config={config} />
    </div>
  );
}
