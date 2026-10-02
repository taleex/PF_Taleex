import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { LanguageRow } from "@/types/portfolio-sections";

const LEVELS = [
  "Native",
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "TODO(me)",
] as const;

const LanguagesEditor = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<LanguageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("languages")
        .select("*")
        .order("order_index");
      if (error) throw error;
      setItems(data ?? []);
    } catch (error: unknown) {
      toast({
        title: "Could not load languages",
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
  const updateItem = (id: string, patch: Partial<LanguageRow>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const save = async (item: LanguageRow) => {
    setSavingId(item.id);
    try {
      const { error } = await supabase.from("languages").upsert(
        {
          id: item.id,
          name: item.name,
          level: item.level,
          order_index: item.order_index,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["languages"] });
      toast({ title: "Language saved" });
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
        name: "",
        level: "TODO(me)",
        order_index: current.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("languages").delete().eq("id", id);
    if (error) {
      toast({
        title: "Delete failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["languages"] });
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
          .from("languages")
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
    else await queryClient.invalidateQueries({ queryKey: ["languages"] });
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
          <h2 className="text-2xl font-semibold text-[#0A0908]">Languages</h2>
          <p className="text-sm text-gray-600">
            Use CEFR levels or Native; leave unconfirmed proficiency marked
            TODO(me).
          </p>
        </div>
        <Button type="button" onClick={add}>
          <Plus className="mr-2 h-4 w-4" />
          Add language
        </Button>
      </div>
      {items.map((item, index) => (
        <Card key={item.id} className="border-gray-200 bg-white">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {item.name || "New language"}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Move language up"
                disabled={index === 0}
                onClick={() => void move(index, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Move language down"
                disabled={index === items.length - 1}
                onClick={() => void move(index, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Language</Label>
              <Input
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Proficiency</Label>
              <Select
                value={item.level}
                onValueChange={(level) => updateItem(item.id, { level })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

export default LanguagesEditor;
