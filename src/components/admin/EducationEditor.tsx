import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-utils";
import { supabase } from "@/integrations/supabase/client";
import type { EducationRow } from "@/types/portfolio-sections";

const EducationEditor = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<EducationRow[]>([]);
  const [projectOptions, setProjectOptions] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const [{ data, error }, { data: projects, error: projectError }] =
        await Promise.all([
          supabase.from("education").select("*").order("order_index"),
          supabase.from("projects").select("id,title").order("title"),
        ]);
      if (error) throw error;
      if (projectError) throw projectError;
      setItems(data ?? []);
      setProjectOptions(projects ?? []);
    } catch (error: unknown) {
      toast({
        title: "Could not load education",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const updateItem = (id: string, patch: Partial<EducationRow>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const save = async (item: EducationRow) => {
    setSavingId(item.id);
    try {
      const { error } = await supabase.from("education").upsert(
        {
          id: item.id,
          institution: item.institution,
          title: item.title,
          period: item.period,
          description: item.description,
          highlights: item.highlights,
          related_project_id: item.related_project_id,
          order_index: item.order_index,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["education"] });
      toast({ title: "Education saved" });
      await fetchItems();
    } catch (error: unknown) {
      toast({
        title: "Save failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const add = async () => {
    const row: EducationRow = {
      id: crypto.randomUUID(),
      institution: "",
      title: "",
      period: "",
      description: null,
      highlights: [],
      related_project_id: null,
      order_index: items.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setItems((current) => [...current, row]);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("education").delete().eq("id", id);
    if (error) {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["education"] });
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const move = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const ordered = [...items];
    [ordered[index], ordered[nextIndex]] = [ordered[nextIndex], ordered[index]];
    const updated = ordered.map((item, order) => ({
      ...item,
      order_index: order + 1,
    }));
    setItems(updated);
    const results = await Promise.all(
      updated.map((item) =>
        supabase
          .from("education")
          .update({ order_index: item.order_index })
          .eq("id", item.id),
      ),
    );
    const failed = results.find((result) => result.error)?.error;
    if (failed)
      toast({
        title: "Reorder failed",
        description: getErrorMessage(failed),
        variant: "destructive",
      });
    else await queryClient.invalidateQueries({ queryKey: ["education"] });
  };

  if (loading)
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-[#0A0908]">Education</h2>
          <p className="text-sm text-gray-600">
            Manage education records and related portfolio projects.
          </p>
        </div>
        <Button type="button" onClick={() => void add()}>
          <Plus className="mr-2 h-4 w-4" />
          Add education
        </Button>
      </div>
      {items.map((item, index) => (
        <Card key={item.id} className="border-gray-200 bg-white">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {item.title || "New education record"}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Move education up"
                disabled={index === 0}
                onClick={() => void move(index, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Move education down"
                disabled={index === items.length - 1}
                onClick={() => void move(index, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Qualification</Label>
              <Input
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input
                value={item.institution}
                onChange={(e) =>
                  updateItem(item.id, { institution: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Input
                value={item.period}
                onChange={(e) =>
                  updateItem(item.id, { period: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Related project</Label>
              <Select
                value={item.related_project_id || "none"}
                onValueChange={(value) =>
                  updateItem(item.id, {
                    related_project_id: value === "none" ? null : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No related project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No related project</SelectItem>
                  {projectOptions.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={item.description || ""}
                onChange={(e) =>
                  updateItem(item.id, { description: e.target.value || null })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Highlights (one per line)</Label>
              <Textarea
                value={item.highlights.join("\n")}
                onChange={(e) =>
                  updateItem(item.id, {
                    highlights: e.target.value.split("\n").filter(Boolean),
                  })
                }
              />
            </div>
            <div className="flex justify-between md:col-span-2">
              <Button
                type="button"
                onClick={() => void save(item)}
                disabled={savingId === item.id}
              >
                {savingId === item.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void remove(item.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
};

export default EducationEditor;
