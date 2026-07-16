import { useState, useEffect, useCallback } from "react";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PageSection {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
}

const PageSectionsEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [editingSections, setEditingSections] = useState<
    Record<string, PageSection>
  >({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const fetchSections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("page_sections")
        .select("*")
        .order("section_key");

      if (error) throw error;
      const rows = (data ||
        []) as Database["public"]["Tables"]["page_sections"]["Row"][];
      setSections(rows);

      const items: Record<string, PageSection> = {};
      rows.forEach((section) => {
        items[section.id] = section;
      });
      setEditingSections(items);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleSave = async (section: PageSection) => {
    try {
      const { error } = await supabase
        .from("page_sections")
        .update({
          title: section.title,
          subtitle: section.subtitle,
          content: section.content,
        })
        .eq("id", section.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Section updated successfully",
      });
      fetchSections();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#0A0908]">
          Page Sections
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Customize content for each section of your site
        </p>
      </div>
      {sections.map((section) => (
        <Card key={section.id} className="bg-white border-gray-200">
          <Collapsible
            open={openSections[section.id]}
            onOpenChange={() => toggleSection(section.id)}
          >
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium capitalize text-[#0A0908]">
                  {section.section_key.replace(/-/g, " ")}
                </CardTitle>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    {openSections[section.id] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#0A0908]">
                    Title
                  </Label>
                  <Input
                    value={editingSections[section.id]?.title || ""}
                    onChange={(e) =>
                      setEditingSections({
                        ...editingSections,
                        [section.id]: {
                          ...editingSections[section.id],
                          title: e.target.value,
                        },
                      })
                    }
                    className="bg-white border-gray-300 text-[#0A0908]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#0A0908]">
                    Subtitle
                  </Label>
                  <Textarea
                    rows={2}
                    value={editingSections[section.id]?.subtitle || ""}
                    onChange={(e) =>
                      setEditingSections({
                        ...editingSections,
                        [section.id]: {
                          ...editingSections[section.id],
                          subtitle: e.target.value,
                        },
                      })
                    }
                    className="bg-white border-gray-300 text-[#0A0908]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#0A0908]">
                    Content
                  </Label>
                  <Textarea
                    rows={3}
                    value={editingSections[section.id]?.content || ""}
                    onChange={(e) =>
                      setEditingSections({
                        ...editingSections,
                        [section.id]: {
                          ...editingSections[section.id],
                          content: e.target.value,
                        },
                      })
                    }
                    className="bg-white border-gray-300 text-[#0A0908]"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => handleSave(editingSections[section.id])}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
};

export default PageSectionsEditor;
