import { AccountTabs } from "@/components/account-tabs";

export const dynamic = "force-dynamic";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AccountTabs />
      {children}
    </div>
  );
}
