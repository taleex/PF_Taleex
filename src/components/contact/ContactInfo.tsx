import type { ComponentType, SVGAttributes } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import {
  contactInfo as defaultContactInfo,
  socialLinks as defaultSocialLinks,
} from "@/data/contact";

interface ContactIconProps {
  size?: number | string;
  className?: string;
}

interface ContactInfoProps {
  contactInfo?: {
    email: string;
    phone: string;
    location: string;
  };
  socialLinks?: Array<{
    icon: ComponentType<ContactIconProps>;
    href: string;
    label: string;
  }>;
}

const ContactInfo = ({
  contactInfo = defaultContactInfo,
  socialLinks = defaultSocialLinks,
}: ContactInfoProps) => {
  return (
    <div className="animate-slide-in-left">
      <h3 className="text-2xl font-bold theme-text mb-8">Get In Touch</h3>

      <div className="space-y-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-3 rounded-full">
            <Mail size={20} className="text-primary-foreground" />
          </div>
          <div>
            <div className="theme-text font-medium">Email</div>
            <div className="theme-text-muted">{contactInfo.email}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-primary p-3 rounded-full">
            <Phone size={20} className="text-primary-foreground" />
          </div>
          <div>
            <div className="theme-text font-medium">Phone</div>
            <div className="theme-text-muted">{contactInfo.phone}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-primary p-3 rounded-full">
            <MapPin size={20} className="text-primary-foreground" />
          </div>
          <div>
            <div className="theme-text font-medium">Location</div>
            <div className="theme-text-muted">{contactInfo.location}</div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold theme-text mb-4">Follow Me</h4>
        <div className="flex gap-4">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-muted hover:bg-primary theme-text hover:text-primary-foreground p-3 rounded-full"
              style={{
                transition: "background-color 0.3s, color 0.3s, transform 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
              }}
              aria-label={social.label}
            >
              <social.icon size={20} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;
