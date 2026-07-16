import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Save, GripVertical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface SkillCategory {
  id: string;
  name: string;
  order_index: number;
}

interface Skill {
  id: string;
  name: string;
  icon: string;
  category_id: string;
  order_index: number;
  svg_url?: string | null;
  svg_url_dark?: string | null;
}

interface SortableSkillCardProps {
  skill: Skill;
  editingSkill: Skill | null;
  onEdit: (skill: Skill) => void;
  onDelete: (id: string) => void;
  onSave: (skill: Skill) => void;
  setEditingSkill: (skill: Skill | null) => void;
  categories: SkillCategory[];
  handleUploadSVG: (file: File, mode: "light" | "dark") => void;
  uploadingLight: boolean;
  uploadingDark: boolean;
  fileInputKey: number;
  setFileInputKey: (key: number) => void;
}

function SortableSkillCard({
  skill,
  editingSkill,
  onEdit,
  onDelete,
  onSave,
  setEditingSkill,
  categories,
  handleUploadSVG,
  uploadingLight,
  uploadingDark,
  fileInputKey,
  setFileInputKey,
}: SortableSkillCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: skill.id });

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
            <CardTitle className="text-base font-medium text-[#0A0908]">
              {skill.name}
            </CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(skill)}
              className="border-gray-300 bg-white hover:bg-gray-100 text-[#0A0908] hover:text-[#0A0908]"
            >
              {editingSkill?.id === skill.id ? "Cancel" : "Edit"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(skill.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {editingSkill?.id === skill.id && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[#0A0908]">Name</Label>
              <Input
                value={editingSkill.name}
                onChange={(e) =>
                  setEditingSkill({ ...editingSkill, name: e.target.value })
                }
                className="bg-white border-gray-300 text-[#0A0908]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0A0908]">
                Icon (react-icons/si name)
              </Label>
              <Input
                value={editingSkill.icon}
                onChange={(e) =>
                  setEditingSkill({ ...editingSkill, icon: e.target.value })
                }
                className="bg-white border-gray-300 text-[#0A0908]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0A0908]">Category</Label>
              <Select
                value={editingSkill.category_id}
                onValueChange={(value) =>
                  setEditingSkill({ ...editingSkill, category_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="space-y-2">
              <Label className="text-[#0A0908]">
                Custom SVG Icon (Light Mode)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  key={`light-${fileInputKey}`}
                  type="file"
                  accept=".svg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadSVG(file, "light");
                  }}
                  disabled={uploadingLight}
                  className="bg-white border-gray-300 text-[#0A0908]"
                />
                {uploadingLight && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {editingSkill.svg_url && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Current:</span>
                    <img
                      src={editingSkill.svg_url}
                      alt="Light mode icon"
                      className="h-6 w-6"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSkill({ ...editingSkill, svg_url: null });
                      setFileInputKey(Date.now());
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[#0A0908]">
                Custom SVG Icon (Dark Mode)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  key={`dark-${fileInputKey}`}
                  type="file"
                  accept=".svg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadSVG(file, "dark");
                  }}
                  disabled={uploadingDark}
                  className="bg-white border-gray-300 text-[#0A0908]"
                />
                {uploadingDark && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {editingSkill.svg_url_dark && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Current:</span>
                    <img
                      src={editingSkill.svg_url_dark}
                      alt="Dark mode icon"
                      className="h-6 w-6 bg-gray-800 p-1 rounded"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSkill({ ...editingSkill, svg_url_dark: null });
                      setFileInputKey(Date.now());
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Upload custom SVG icons for skills that don't have react-icons
              available. Custom SVGs will override the react-icon.
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => onSave(editingSkill)}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

const SkillsEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [uploadingLight, setUploadingLight] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fetchData = useCallback(async () => {
    try {
      const [categoriesRes, skillsRes] = await Promise.all([
        supabase.from("skill_categories").select("*").order("order_index"),
        supabase.from("skills").select("*").order("order_index"),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (skillsRes.error) throw skillsRes.error;

      setCategories(categoriesRes.data || []);
      setSkills(skillsRes.data || []);
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
    fetchData();
  }, [fetchData]);

  const handleDragEnd = async (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const categorySkills = skills.filter((s) => s.category_id === categoryId);
      const otherSkills = skills.filter((s) => s.category_id !== categoryId);

      const oldIndex = categorySkills.findIndex((i) => i.id === active.id);
      const newIndex = categorySkills.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(categorySkills, oldIndex, newIndex);

      // Update order_index for reordered items
      newItems.forEach(async (item, index) => {
        await supabase
          .from("skills")
          .update({ order_index: index + 1 })
          .eq("id", item.id);
      });

      setSkills([...otherSkills, ...newItems]);

      toast({
        title: "Success",
        description: "Skill order updated",
      });
    }
  };

  const handleUploadSVG = async (file: File, mode: "light" | "dark") => {
    if (!editingSkill) return;

    const setUploading =
      mode === "light" ? setUploadingLight : setUploadingDark;
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${editingSkill.id}-${mode}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("skill-icons")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("skill-icons").getPublicUrl(filePath);

      // Add cache-busting parameter to force browser to reload new image
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      const updateField = mode === "light" ? "svg_url" : "svg_url_dark";
      setEditingSkill({ ...editingSkill, [updateField]: cacheBustedUrl });

      toast({
        title: "Success",
        description: `${mode === "light" ? "Light" : "Dark"} mode SVG uploaded successfully`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSkill = async (skill: Skill) => {
    try {
      const { error } = await supabase
        .from("skills")
        .update({
          name: skill.name,
          icon: skill.icon,
          category_id: skill.category_id,
          order_index: skill.order_index,
          svg_url: skill.svg_url,
          svg_url_dark: skill.svg_url_dark,
        })
        .eq("id", skill.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Skill updated successfully",
      });
      setEditingSkill(null);
      fetchData();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;

    try {
      const { error } = await supabase.from("skills").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Skill deleted successfully",
      });
      fetchData();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleAddSkill = async () => {
    if (categories.length === 0) {
      toast({
        title: "Error",
        description: "Please create a category first",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("skills").insert({
        name: "New Skill",
        icon: "SiReact",
        category_id: categories[0].id,
        order_index: skills.length + 1,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "New skill created",
      });
      fetchData();
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
            Skills
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your technical skills - drag to reorder
          </p>
        </div>
        <Button onClick={handleAddSkill} size="default">
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      {categories.map((category) => {
        const categorySkills = skills.filter(
          (skill) => skill.category_id === category.id,
        );

        return (
          <div key={category.id} className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              {category.name}
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => handleDragEnd(event, category.id)}
            >
              <SortableContext
                items={categorySkills.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {categorySkills.map((skill) => (
                  <SortableSkillCard
                    key={skill.id}
                    skill={skill}
                    editingSkill={editingSkill}
                    onEdit={(s: Skill) =>
                      setEditingSkill(editingSkill?.id === s.id ? null : s)
                    }
                    onDelete={handleDeleteSkill}
                    onSave={handleSaveSkill}
                    setEditingSkill={setEditingSkill}
                    categories={categories}
                    handleUploadSVG={handleUploadSVG}
                    uploadingLight={uploadingLight}
                    uploadingDark={uploadingDark}
                    fileInputKey={fileInputKey}
                    setFileInputKey={setFileInputKey}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        );
      })}
    </div>
  );
};

export default SkillsEditor;
