import { SearchBar } from "@/components/SearchBar";
import { DateWidget } from "@/components/widgets/DateWidget";
import { ExchangeRateWidget } from "@/components/widgets/ExchangeRateWidget";
import { StockWidget } from "@/components/widgets/StockWidget";
import { getLinksData, getWidgetConfig } from "@/lib/kv";
import { LinksEditor } from "@/components/LinksEditor";
import Link from "next/link";
import { Settings, Save } from "lucide-react";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { ThemeToggle } from "@/components/ThemeToggle";

async function getAdminStatus() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET || "default_secret_key_change_me");
    return true;
  } catch {
    return false;
  }
}

export default async function Home() {
  const isAdmin = await getAdminStatus();
  const linksData: any = await getLinksData();
  const widgetConfig: any = await getWidgetConfig();

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 relative bg-background text-foreground transition-colors duration-300">
      {/* Background decorations */}
      <div className="fixed top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header Controls */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <ThemeToggle />
        {isAdmin ? (
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md border border-primary/30 p-1 pl-3 rounded-full shadow-lg">
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase">编辑模式</span>
            <Link
              href="/api/auth/logout"
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3 h-3" />
              完成并退出
            </Link>
          </div>
        ) : (
          <Link
            href="/login"
            className="p-2 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1 hover:bg-secondary rounded-full"
            title="管理员登录"
          >
            <Settings className="w-5 h-5 opacity-50" />
            <span className="text-xs font-medium pr-1">管理</span>
          </Link>
        )}
      </div>

      <div className="max-w-7xl mx-auto space-y-8 pt-12">
        {/* Search Section - Compact */}
        <section className="flex flex-col items-center justify-center pb-6">
          <SearchBar />
        </section>

        {/* Widgets Dashboard */}
        <section>
          <h2 className="text-xl font-semibold mb-6 px-1 flex items-center gap-2 opacity-90">
            概览
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 h-[400px] md:h-[320px]">
            {/* Fixed height for widgets to ensure they look uniform, overflow handled internally */}
            <div className="col-span-1 h-full">
              <DateWidget isAdmin={isAdmin} initialConfig={widgetConfig?.date} />
            </div>
            <div className="col-span-1 h-full">
              <ExchangeRateWidget isAdmin={isAdmin} initialConfig={widgetConfig?.exchange} />
            </div>
            <div className="col-span-2 h-full">
              <StockWidget isAdmin={isAdmin} initialConfig={widgetConfig?.stock} />
            </div>
          </div>
        </section>

        {/* Navigation Area */}
        <section className="pb-20">
          <h2 className="text-xl font-semibold mb-6 px-1 flex items-center gap-2 opacity-90">
            快捷导航
          </h2>
          <LinksEditor initialLinks={linksData} isAdmin={isAdmin} />
        </section>

        <footer className="text-center text-sm text-muted-foreground py-8 opacity-60">
          <p>&copy; {new Date().getFullYear()} Personal Dashboard. 基于 Next.js & Tailwind 构建。</p>
        </footer>
      </div>
    </main>
  );
}
