import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, MapPin, Droplets, Phone, Lock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BloodRequestForm } from "@/components/patient/BloodRequestForm";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { ImportContactsDialog } from "@/components/contacts/ImportContactsDialog";
import type { ProfileWithArea } from "@/pages/Dashboard";
import type { Database } from "@/integrations/supabase/types";

type Area = Database["public"]["Tables"]["areas"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface DonorWithArea extends Profile {
  areas: Area | null;
  isContact?: boolean;
}

interface Props {
  profile: ProfileWithArea;
  refreshKey?: number;
}

export const PatientDashboard = ({ profile, refreshKey = 0 }: Props) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [donors, setDonors] = useState<DonorWithArea[]>([]);
  const [networkContacts, setNetworkContacts] = useState<DonorWithArea[]>([]);
  const [userContacts, setUserContacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAreas();
    fetchUserContacts();
  }, []);

  useEffect(() => {
    if (userContacts.length >= 0) {
      fetchNetworkContacts();
    }
  }, [userContacts]);

  const fetchAreas = async () => {
    const { data } = await supabase.from("areas").select("*").order("name");
    if (data) setAreas(data);
  };

  const fetchUserContacts = async () => {
    // Fetch the user's saved contacts
    const { data } = await supabase
      .from("user_contacts")
      .select("contact_user_id")
      .eq("user_id", profile.id);
    
    if (data) {
      setUserContacts(data.map(c => c.contact_user_id));
    }
  };

  const fetchNetworkContacts = async () => {
    // Fetch donors who match blood group AND are in user's contacts
    // These contacts show full details immediately
    if (userContacts.length === 0) {
      // Still show matching donors, but they won't be "contacts"
      // Use profiles_public view for field-level access control
      const { data } = await supabase
        .from("profiles_public" as any) // View with field-level security
        .select("*")
        .eq("is_donor", true)
        .eq("is_available", true)
        .eq("blood_group", profile.blood_group)
        .neq("id", profile.id)
        .limit(10);
      
      if (data) {
        // Fetch areas separately for these profiles
        const profilesWithAreas = await Promise.all(
          (data as unknown as Profile[]).map(async (d) => {
            let area: Area | null = null;
            if (d.area_id) {
              const { data: areaData } = await supabase
                .from("areas")
                .select("*")
                .eq("id", d.area_id)
                .single();
              area = areaData;
            }
            return { ...d, areas: area, isContact: false };
          })
        );
        setNetworkContacts(profilesWithAreas);
      }
      return;
    }

    // First get contacts who are donors with matching blood group
    // Use profiles_public view for field-level access control
    const { data } = await supabase
      .from("profiles_public" as any) // View with field-level security
      .select("*")
      .eq("is_donor", true)
      .eq("is_available", true)
      .eq("blood_group", profile.blood_group)
      .in("id", userContacts)
      .neq("id", profile.id);
    
    if (data) {
      // Fetch areas separately for these profiles
      const profilesWithAreas = await Promise.all(
        (data as unknown as Profile[]).map(async (d) => {
          let area: Area | null = null;
          if (d.area_id) {
            const { data: areaData } = await supabase
              .from("areas")
              .select("*")
              .eq("id", d.area_id)
              .single();
            area = areaData;
          }
          return { ...d, areas: area, isContact: true };
        })
      );
      setNetworkContacts(profilesWithAreas);
    }
  };

  const searchDonors = async () => {
    if (!selectedArea) {
      toast.error("Please select an area");
      return;
    }
    setLoading(true);
    
    // Fetch donors - Use profiles_public view for field-level access control
    // RLS handles visibility, view masks sensitive fields for non-contacts
    const { data } = await supabase
      .from("profiles_public" as any) // View with field-level security
      .select("*")
      .eq("is_donor", true)
      .eq("is_available", true)
      .eq("area_id", selectedArea)
      .neq("id", profile.id);
    
    if (data) {
      // Fetch areas separately for these profiles
      const profilesWithAreas = await Promise.all(
        (data as unknown as Profile[]).map(async (d) => {
          let area: Area | null = null;
          if (d.area_id) {
            const { data: areaData } = await supabase
              .from("areas")
              .select("*")
              .eq("id", d.area_id)
              .single();
            area = areaData;
          }
          return { ...d, areas: area, isContact: userContacts.includes(d.id) };
        })
      );
      setDonors(profilesWithAreas);
    }
    setLoading(false);
  };

  const handleRequestSent = () => {
    // Refresh data after request sent
    fetchNetworkContacts();
  };

  return (
    <div className="container px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Find a Donor</h1>
            <p className="text-muted-foreground mt-1">Connect with donors in your community</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blood-light border border-blood/20">
            <Droplets className="w-5 h-5 text-blood" />
            <span className="font-bold text-blood">{profile.blood_group}</span>
          </div>
        </div>

        {/* My Network - Contacts with full access */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blood" />
              <h2 className="text-xl font-bold text-foreground">My Network</h2>
              <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                Contacts see full details
              </Badge>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <AddContactDialog
                currentProfileId={profile.id}
                existingContacts={userContacts}
                onContactAdded={fetchUserContacts}
              />
              <ImportContactsDialog
                currentProfileId={profile.id}
                existingContacts={userContacts}
                onContactsImported={fetchUserContacts}
              />
            </div>
          </div>
          
          <div className="bg-card rounded-3xl p-8 shadow-card border border-border">
            {networkContacts.length === 0 ? (
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No matching donors in your contacts yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add donors as contacts to see their details directly
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                {networkContacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    style={{ animationDelay: `${index * 0.5}s` }}
                    className="animate-float"
                  >
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="relative w-20 h-20 md:w-24 md:h-24 rounded-full blood-gradient flex flex-col items-center justify-center shadow-glow hover:scale-110 transition-transform">
                          {contact.isContact && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                              <UserCheck className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <span className="text-primary-foreground font-bold text-lg">{contact.blood_group}</span>
                          <span className="text-primary-foreground/80 text-xs truncate max-w-[60px]">
                            {contact.full_name.split(" ")[0]}
                          </span>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="rounded-3xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {contact.full_name}
                            {contact.isContact && (
                              <Badge variant="default" className="bg-success text-xs">Contact</Badge>
                            )}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-5 h-5 text-blood" />
                            <span className="font-semibold">{contact.blood_group}</span>
                          </div>
                          
                          {contact.areas && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-5 h-5 text-muted-foreground" />
                              <span>{contact.areas.name}</span>
                            </div>
                          )}

                          {/* Contact details shown for contacts */}
                          {contact.isContact && contact.phone && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
                              <Phone className="w-5 h-5 text-success" />
                              <span className="font-medium">{contact.phone}</span>
                            </div>
                          )}

                          {!contact.isContact && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted border border-border">
                              <Lock className="w-5 h-5 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Contact details will be shared after donor accepts your request
                              </span>
                            </div>
                          )}

                          <BloodRequestForm
                            patientProfileId={profile.id}
                            bloodGroup={profile.blood_group}
                            donorId={contact.id}
                            onRequestSent={handleRequestSent}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search by Area */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-6 h-6 text-blood" />
            <h2 className="text-xl font-bold text-foreground">Search Donors by Area</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger className="h-12 rounded-xl flex-1 bg-background">
                <SelectValue placeholder="Select an area" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={searchDonors} disabled={loading} className="h-12">
              <Search className="w-4 h-4" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {donors.map((donor) => (
              <motion.div
                key={donor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-6 shadow-card border border-border"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-14 h-14 rounded-full blood-gradient flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">{donor.blood_group}</span>
                    {donor.isContact && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                        <UserCheck className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{donor.full_name}</p>
                    <p className="text-sm text-muted-foreground">{donor.areas?.name}</p>
                    {donor.isContact && (
                      <Badge variant="default" className="bg-success text-xs mt-1">Contact</Badge>
                    )}
                  </div>
                </div>

                {/* Show phone for contacts */}
                {donor.isContact && donor.phone && (
                  <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-success/10 text-sm">
                    <Phone className="w-4 h-4 text-success" />
                    <span>{donor.phone}</span>
                  </div>
                )}

                {!donor.isContact && (
                  <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-muted text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    <span>Contact details after acceptance</span>
                  </div>
                )}

                <BloodRequestForm
                  patientProfileId={profile.id}
                  bloodGroup={profile.blood_group}
                  donorId={donor.id}
                  onRequestSent={handleRequestSent}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-blood-light border border-blood/20">
          <p className="text-sm text-center text-muted-foreground">
            <strong>Important:</strong> Please proceed to a registered blood bank for screening and donation.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
