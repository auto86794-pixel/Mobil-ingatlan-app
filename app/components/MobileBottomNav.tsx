"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: "🏠",
    },
    {
      href: "/favorites",
      label: "Kedvencek",
      icon: "❤️",
    },
    {
      href: "/create",
      label: "Create",
      icon: "➕",
    },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: "📊",
    },
  ];

  return (
    <div
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50
        border-t
        border-zinc-800
        bg-black/95
        backdrop-blur-xl
        md:hidden
      "
    >

      <div
        className="
          grid
          grid-cols-4
        "
      >

        {navItems.map((item) => {
          const active =
            pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="
                flex
                flex-col
                items-center
                justify-center
                gap-1
                py-3
                text-xs
                transition
              "
            >

              <div
                className={`
                  text-2xl
                  ${
                    active
                      ? "scale-110"
                      : "opacity-70"
                  }
                `}
              >
                {item.icon}
              </div>

              <span
                className={
                  active
                    ? "text-yellow-400"
                    : "text-zinc-400"
                }
              >
                {item.label}
              </span>

            </Link>
          );
        })}

      </div>

    </div>
  );
}