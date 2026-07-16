import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-utils";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileCVUploadProps {
  profileId: string;
  cvUrl: string;
  onUploadSuccess: (url: string) => void;
}

export const ProfileCVUpload = ({
  profileId,
  cvUrl,
  onUploadSuccess,
}: ProfileCVUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUploadCV = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `cv-${profileId}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      onUploadSuccess(publicUrl);

      toast({
        title: "Success",
        description: "CV uploaded successfully",
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

  return (
    <div className="space-y-2">
      <Label htmlFor="cv_upload" className="text-[#0A0908]">
        CV / Resume
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id="cv_upload"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUploadCV(file);
          }}
          disabled={uploading}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
        {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      {cvUrl && (
        <p className="text-sm text-gray-600">
          Current CV:{" "}
          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FF6542] hover:underline"
          >
            View
          </a>
        </p>
      )}
    </div>
  );
};
