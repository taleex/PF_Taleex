import { useState, useEffect, useCallback } from "react";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/error-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface ContactInfoItem {
  id: string;
  info_key: string;
  label: string;
  value: string;
  link: string | null;
  icon_name: string | null;
  type: string;
  order_index: number;
}

const ContactEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState<ContactInfoItem[]>([]);
  const [editingItems, setEditingItems] = useState<
    Record<string, ContactInfoItem>
  >({});

  const fetchContactInfo = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("contact_info")
        .select("*")
        .order("order_index");

      if (error) throw error;

      const rows = (data ||
        []) as Database["public"]["Tables"]["contact_info"]["Row"][];
      setContactInfo(rows);

      const items: Record<string, ContactInfoItem> = {};
      rows.forEach((item) => {
        items[item.id] = item;
      });
      setEditingItems(items);
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
    fetchContactInfo();
  }, [fetchContactInfo]);

  const handleSave = async (item: ContactInfoItem) => {
    try {
      const { error } = await supabase
        .from("contact_info")
        .update({
          label: item.label,
          value: item.value,
          link: item.link,
          icon_name: item.icon_name,
        })
        .eq("id", item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact info updated successfully",
      });
      fetchContactInfo();
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

  const socialLinks = contactInfo.filter((item) => item.type === "social");
  const contactDetails = contactInfo.filter((item) => item.type === "contact");

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight text-[#0A0908]">
            Social Links
          </CardTitle>
          <p className="text-sm text-gray-600">
            Update your social media profiles
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialLinks.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="space-y-2">
                <Label className="text-[#0A0908]">Label</Label>
                <Input
                  value={editingItems[item.id]?.label || ""}
                  onChange={(e) =>
                    setEditingItems({
                      ...editingItems,
                      [item.id]: {
                        ...editingItems[item.id],
                        label: e.target.value,
                      },
                    })
                  }
                  className="bg-white border-gray-300 text-[#0A0908]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0A0908]">URL</Label>
                <Input
                  value={editingItems[item.id]?.link || ""}
                  onChange={(e) =>
                    setEditingItems({
                      ...editingItems,
                      [item.id]: {
                        ...editingItems[item.id],
                        link: e.target.value,
                      },
                    })
                  }
                  className="bg-white border-gray-300 text-[#0A0908]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0A0908]">Icon Name (Lucide)</Label>
                <Input
                  value={editingItems[item.id]?.icon_name || ""}
                  onChange={(e) =>
                    setEditingItems({
                      ...editingItems,
                      [item.id]: {
                        ...editingItems[item.id],
                        icon_name: e.target.value,
                      },
                    })
                  }
                  className="bg-white border-gray-300 text-[#0A0908]"
                />
              </div>
              <div className="md:col-span-3">
                <Button onClick={() => handleSave(editingItems[item.id])}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight text-[#0A0908]">
            Contact Details
          </CardTitle>
          <p className="text-sm text-gray-600">
            Update your contact information
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {contactDetails.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="space-y-2">
                <Label className="text-[#0A0908]">Label</Label>
                <Input
                  value={editingItems[item.id]?.label || ""}
                  onChange={(e) =>
                    setEditingItems({
                      ...editingItems,
                      [item.id]: {
                        ...editingItems[item.id],
                        label: e.target.value,
                      },
                    })
                  }
                  className="bg-white border-gray-300 text-[#0A0908]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0A0908]">Value</Label>
                <Input
                  value={editingItems[item.id]?.value || ""}
                  onChange={(e) =>
                    setEditingItems({
                      ...editingItems,
                      [item.id]: {
                        ...editingItems[item.id],
                        value: e.target.value,
                      },
                    })
                  }
                  className="bg-white border-gray-300 text-[#0A0908]"
                />
              </div>
              <div className="md:col-span-2">
                <Button onClick={() => handleSave(editingItems[item.id])}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactEditor;
