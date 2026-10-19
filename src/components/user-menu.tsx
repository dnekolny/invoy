"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = { user: { name: string; email: string; image?: string | null } };

export function UserMenu({ user }: Props) {
  const t = useTranslations("nav");
  const router = useRouter();
  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8">
          <AvatarImage src={user.image ?? undefined} alt="" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings />
          {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
