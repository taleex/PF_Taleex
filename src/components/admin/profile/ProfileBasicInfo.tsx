import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileBasicInfoProps {
  profile: {
    display_name: string;
    title: string;
    email: string;
    location: string;
    interests: string;
    experience_years: number;
  };
  onChange: (field: string, value: string | number) => void;
}

export const ProfileBasicInfo = ({ profile, onChange }: ProfileBasicInfoProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="display_name" className="text-[#0A0908]">Display Name</Label>
        <Input
          id="display_name"
          value={profile.display_name}
          onChange={(e) => onChange('display_name', e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-[#0A0908]">Title</Label>
        <Input
          id="title"
          value={profile.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-[#0A0908]">Email</Label>
        <Input
          id="email"
          type="email"
          value={profile.email}
          onChange={(e) => onChange('email', e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location" className="text-[#0A0908]">Location</Label>
        <Input
          id="location"
          value={profile.location}
          onChange={(e) => onChange('location', e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="interests" className="text-[#0A0908]">Interests</Label>
        <Input
          id="interests"
          value={profile.interests}
          onChange={(e) => onChange('interests', e.target.value)}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="experience_years" className="text-[#0A0908]">Years of Experience</Label>
        <Input
          id="experience_years"
          type="number"
          value={profile.experience_years}
          onChange={(e) => onChange('experience_years', parseInt(e.target.value))}
          className="bg-white border-gray-300 text-[#0A0908]"
        />
      </div>
    </div>
  );
};
