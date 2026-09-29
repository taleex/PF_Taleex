import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Save, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Experience {
  id: string;
  position: string;
  company: string;
  period: string;
  description: string;
  highlights: string[];
  order_index: number;
}

interface SortableExperienceCardProps {
  exp: Experience;
  editingExp: Experience | null;
  onEdit: (exp: Experience) => void;
  onDelete: (id: string) => void;
  onSave: (exp: Experience) => void;
  setEditingExp: (exp: Experience | null) => void;
}

function SortableExperienceCard({
  exp,
  editingExp,
  onEdit,
  onDelete,
  onSave,
  setEditingExp,
}: SortableExperienceCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: exp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="bg-white border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
            <CardTitle className="text-lg text-[#0A0908]">
              {exp.position} at {exp.company}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(exp)}
              className="border-gray-300 bg-white hover:bg-gray-100 text-[#0A0908] hover:text-[#0A0908]"
            >
              {editingExp?.id === exp.id ? "Cancel" : "Edit"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(exp.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {editingExp?.id === exp.id && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[#0A0908]">Position</Label>
              <Input
                value={editingExp.position}
                onChange={(e) =>
                  setEditingExp({ ...editingExp, position: e.target.value })
                }
                className="bg-white border-gray-300 text-[#0A0908]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0A0908]">Company</Label>
              <Input
                value={editingExp.company}
                onChange={(e) =>
                  setEditingExp({ ...editingExp, company: e.target.value })
                }
                className="bg-white border-gray-300 text-[#0A0908]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0A0908]">Period</Label>
              <Input
                value={editingExp.period}
                onChange={(e) =>
                  setEditingExp({ ...editingExp, period: e.target.value })
                }
                className="bg-white border-gray-300 text-[#0A0908]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#0A0908]">Description</Label>
            <Textarea
              value={editingExp.description}
              onChange={(e) =>
                setEditingExp({ ...editingExp, description: e.target.value })
              }
              className="bg-white border-gray-300 text-[#0A0908]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#0A0908]">Highlights (one per line)</Label>
            <Textarea
              rows={5}
              value={editingExp.highlights.join("\n")}
              onChange={(e) =>
                setEditingExp({
                  ...editingExp,
                  highlights: e.target.value
                    .split("\n")
                    .filter((h) => h.trim()),
                })
              }
              className="bg-white border-gray-300 text-[#0A0908]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#0A0908]">Order</Label>
            <Input
              type="number"
              value={editingExp.order_index}
              onChange={(e) =>
                setEditingExp({
                  ...editingExp,
                  order_index: parseInt(e.target.value),
                })
              }
              className="bg-white border-gray-300 text-[#0A0908]"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => onSave(editingExp)}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

const ExperiencesEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fetchExperiences = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .order("order_index");

      if (error) throw error;
      setExperiences((data || []) as Experience[]);
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
    fetchExperiences();
  }, [fetchExperiences]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setExperiences((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update order_index for all items
        newItems.forEach(async (item, index) => {
          await supabase
            .from("experiences")
            .update({ order_index: index + 1 })
            .eq("id", item.id);
        });

        return newItems;
      });

      toast({
        title: "Success",
        description: "Experience order updated",
      });
    }
  };

  const handleSave = async (exp: Experience) => {
    try {
      const { error } = await supabase
        .from("experiences")
        .update({
          position: exp.position,
          company: exp.company,
          period: exp.period,
          description: exp.description,
          highlights: exp.highlights,
          order_index: exp.order_index,
        })
        .eq("id", exp.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Experience updated successfully",
      });
      setEditingExp(null);
      fetchExperiences();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this experience?")) return;

    try {
      const { error } = await supabase
        .from("experiences")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Experience deleted successfully",
      });
      fetchExperiences();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleAddNew = async () => {
    try {
      const { error } = await supabase.from("experiences").insert({
        position: "New Position",
        company: "Company Name",
        period: "2024 - Present",
        description: "Job description",
        highlights: ["Achievement 1", "Achievement 2"],
        order_index: experiences.length + 1,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "New experience created",
      });
      fetchExperiences();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#0A0908]">
            Work Experience
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your work history - drag to reorder
          </p>
        </div>
        <Button onClick={handleAddNew} size="default">
          <Plus className="mr-2 h-4 w-4" />
          Add Experience
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={experiences.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {experiences.map((exp) => (
            <SortableExperienceCard
              key={exp.id}
              exp={exp}
              editingExp={editingExp}
              onEdit={(e: Experience) =>
                setEditingExp(editingExp?.id === e.id ? null : e)
              }
              onDelete={handleDelete}
              onSave={handleSave}
              setEditingExp={setEditingExp}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default ExperiencesEditor;
