import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-utils";
import { supabase } from "@/integrations/supabase/client";
import type { CourseRow } from "@/types/portfolio-sections";

const CoursesEditor = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("order_index");
      if (error) throw error;
      setItems(data ?? []);
    } catch (error: unknown) {
      toast({
        title: "Could not load courses",
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
  const updateItem = (id: string, patch: Partial<CourseRow>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const save = async (item: CourseRow) => {
    setSavingId(item.id);
    try {
      const { error } = await supabase.from("courses").upsert(
        {
          id: item.id,
          title: item.title,
          provider: item.provider,
          description: item.description,
          period: item.period,
          certificate_url: item.certificate_url,
          order_index: item.order_index,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: "Course saved" });
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

  const add = () =>
    setItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: "",
        provider: "",
        description: null,
        period: null,
        certificate_url: null,
        order_index: current.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["courses"] });
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
          .from("courses")
          .update({ order_index: item.order_index })
          .eq("id", item.id),
      ),
    );
    const failure = results.find((result) => result.error)?.error;
    if (failure)
      toast({
        title: "Reorder failed",
        description: getErrorMessage(failure),
        variant: "destructive",
      });
    else await queryClient.invalidateQueries({ queryKey: ["courses"] });
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
          <h2 className="text-2xl font-semibold text-[#0A0908]">
            Courses & Certifications
          </h2>
          <p className="text-sm text-gray-600">
            Add training, course dates, and certificate links.
          </p>
        </div>
        <Button type="button" onClick={add}>
          <Plus className="mr-2 h-4 w-4" />
          Add course
        </Button>
      </div>
      {items.map((item, index) => (
        <Card key={item.id} className="border-gray-200 bg-white">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {item.title || "New course"}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Move course up"
                disabled={index === 0}
                onClick={() => void move(index, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Move course down"
                disabled={index === items.length - 1}
                onClick={() => void move(index, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Course title</Label>
              <Input
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input
                value={item.provider}
                onChange={(e) =>
                  updateItem(item.id, { provider: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Input
                value={item.period || ""}
                onChange={(e) =>
                  updateItem(item.id, { period: e.target.value || null })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Certificate URL</Label>
              <Input
                type="url"
                value={item.certificate_url || ""}
                onChange={(e) =>
                  updateItem(item.id, {
                    certificate_url: e.target.value || null,
                  })
                }
              />
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

export default CoursesEditor;
