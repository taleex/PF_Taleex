import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export interface SectionConfig {
  id: string;
  label: string;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

export const SectionNavigator = ({
  sections = DEFAULT_SECTIONS,
}: {
  sections?: SectionConfig[];
}) => {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const sectionIds = useMemo(
    () => sections.map((section) => section.id),
    [sections],
  );

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    element.scrollIntoView({ behavior: "auto", block: "start" });
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            if (id) {
              setActiveId(id);
            }
          }
        });
      },
      {
        threshold: 0.4,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [sectionIds]);

  if (sections.length <= 1) return null;

  return (
    <div className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex">
      <div className="flex flex-col gap-3 rounded-full bg-background/60 p-3 shadow-lg shadow-background/40 backdrop-blur">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "relative h-3 w-3 rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                isActive
                  ? "h-4 w-4 border-primary bg-primary shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                  : "border-border/60 bg-background/80 hover:border-primary/70",
              )}
              aria-label={`Go to ${section.label}`}
            >
              <span className="sr-only">{section.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SectionNavigator;
