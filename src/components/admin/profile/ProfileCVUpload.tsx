import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/error-utils";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_EXT = ["pdf", "doc", "docx"];
const MAX_BYTES = 5 * 1024 * 1024;

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
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXT.includes(ext) || file.size > MAX_BYTES) {
      toast({
        title: "Invalid file",
        description: "Upload a PDF, DOC or DOCX up to 5 MB.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const fileExt = ext;
      const fileName = `cv-${profileId}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file, { upsert: true, contentType: file.type || undefined, cacheControl: "60" });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      onUploadSuccess(`${publicUrl}?v=${Date.now()}`);

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
