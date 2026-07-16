import { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { throttle } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  className?: string;
}

const Header = memo(({ className = "" }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const { isDarkMode } = useDarkMode();
  const isMobile = useIsMobile();
  const throttledUpdateRef = useRef<ReturnType<typeof throttle> | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile-cv"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("cv_url")
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 50);
    };

    if (!throttledUpdateRef.current) {
      throttledUpdateRef.current = throttle(updateScrollState, 16);
    }

    const handleScroll = () => {
      if (throttledUpdateRef.current) {
        throttledUpdateRef.current();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 ${
        isScrolled
          ? "theme-bg bg-opacity-95 theme-border border-b"
          : "bg-transparent"
      } ${className}`}
      style={{ transition: "background-color 0.3s, border-color 0.3s" }}
    >
      <nav className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
        <div className="flex items-center justify-between">
          {/* Left Group: Sidebar Toggle + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg theme-text hover:text-[#FF6542] hover:bg-[#FF6542]/10"
              style={{ transition: "color 0.3s, background-color 0.3s" }}
              aria-label="Toggle sidebar"
            >
              <Menu size={24} />
            </button>

            <button
              onClick={() => {
                if (window.location.pathname === "/") {
                  window.scrollTo({ top: 0, behavior: "auto" });
                } else {
                  navigate("/");
                }
              }}
              className="text-2xl font-bold cursor-pointer hover:opacity-80 theme-text"
              style={{ transition: "opacity 0.3s" }}
            >
              <span className="text-[#FF6542]">Tal</span>
              <span className="theme-text">eex</span>
            </button>
          </div>

          {/* Right Group: Download CV + Status */}
          <div className="flex items-center gap-2">
            {profile?.cv_url && (
              <a
                href={profile.cv_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FF6542] hover:bg-[#912F40] text-white px-4 sm:px-6 py-2 rounded-full transition-colors duration-300 text-sm font-medium"
              >
                Download CV
              </a>
            )}
            {!isMobile && (
              <a
                href="https://taleex.github.io/ST-uptime-taleex/"
                className="rounded-full border border-green-500 text-green-500 hover:bg-green-50 px-4 sm:px-6 py-2 transition-colors duration-300 text-sm font-medium"
              >
                Status
              </a>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
});

Header.displayName = "Header";

export default Header;
