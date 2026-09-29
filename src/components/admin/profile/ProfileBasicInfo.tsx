import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ProfileBasicInfoProps {
  profile: {
    display_name: string;
    title: string;
    email: string;
    location: string;
    interests: string;
    experience_label: string;
    open_to_remote: boolean;
    timezone: string;
    availability: string;
  };
  onChange: (field: string, value: string | number | boolean | null) => void;
}

export const ProfileBasicInfo = ({
  profile,
  onChange,
}: ProfileBasicInfoProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="display_name" className="text-[#0A0908]">
          Display Name
        </Label>
        <Input
          id="display_name"
          value={profile.display_name}
          onChange={(e) => onChange("display_name", e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-[#0A0908]">
          Title
        </Label>
        <Input
          id="title"
          value={profile.title}
          onChange={(e) => onChange("title", e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#0A0908]">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={profile.email}
          onChange={(e) => onChange("email", e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location" className="text-[#0A0908]">
          Location
        </Label>
        <Input
          id="location"
          value={profile.location}
          onChange={(e) => onChange("location", e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="interests" className="text-[#0A0908]">
          Interests
        </Label>
        <Input
          id="interests"
          value={profile.interests}
          onChange={(e) => onChange("interests", e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="experience_label" className="text-[#0A0908]">
          Experience label
        </Label>
        <Input
          id="experience_label"
          value={profile.experience_label}
          onChange={(e) => onChange("experience_label", e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="flex items-center justify-between rounded-md border border-gray-300 px-3 py-2">
        <Label htmlFor="open_to_remote" className="text-[#0A0908]">
          Open to remote roles
        </Label>
        <Switch
          id="open_to_remote"
          checked={profile.open_to_remote}
          onCheckedChange={(checked) => onChange("open_to_remote", checked)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone" className="text-[#0A0908]">
          Timezone
        </Label>
        <Input
          id="timezone"
          value={profile.timezone}
          onChange={(e) => onChange("timezone", e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="availability" className="text-[#0A0908]">
          Availability
        </Label>
        <Input
          id="availability"
          value={profile.availability}
          onChange={(e) => onChange("availability", e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
    </div>
  );
};
