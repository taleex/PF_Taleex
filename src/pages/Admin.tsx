import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Home, Code2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProfileEditor from "@/components/admin/ProfileEditor";
import ProjectsEditor from "@/components/admin/ProjectsEditor";
import ExperiencesEditor from "@/components/admin/ExperiencesEditor";
import SkillsEditor from "@/components/admin/SkillsEditor";
import ContactEditor from "@/components/admin/ContactEditor";
import PageSectionsEditor from "@/components/admin/PageSectionsEditor";
import MessagesViewer from "@/components/admin/MessagesViewer";

const Admin = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/auth");
  };

  return (
    <div className="light min-h-screen bg-[#FFFFFA]">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FF6542]/10 text-[#FF6542]">
                <Code2 className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.location.pathname === "/admin") {
                    window.scrollTo({ top: 0, behavior: "auto" });
                  } else {
                    navigate("/admin");
                  }
                }}
                className="text-2xl font-bold tracking-tight hover:opacity-80"
              >
                <span className="text-[#FF6542]">Tal</span>
                <span className="text-[#0A0908]">eex</span>
              </button>
              <span className="text-sm font-medium text-gray-500">
                Admin Dashboard
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => navigate("/")} variant="default">
                <Home className="h-4 w-4 mr-2" />
                View Site
              </Button>
              <Button size="sm" onClick={handleLogout} variant="default">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="inline-flex">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="sections">Page Sections</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileEditor />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <ProjectsEditor />
          </TabsContent>

          <TabsContent value="experience" className="mt-6">
            <ExperiencesEditor />
          </TabsContent>

          <TabsContent value="skills" className="mt-6">
            <SkillsEditor />
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <ContactEditor />
          </TabsContent>

          <TabsContent value="sections" className="mt-6">
            <PageSectionsEditor />
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <MessagesViewer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
