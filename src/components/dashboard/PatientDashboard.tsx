import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, MapPin, Droplets, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProfileWithArea } from "@/pages/Dashboard";
import type { Database } from "@/integrations/supabase/types";

type Area = Database["public"]["Tables"]["areas"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface DonorWithArea extends Profile {
  areas: Area | null;
}

interface Props {
  profile: ProfileWithArea;
}

export const PatientDashboard = ({ profile }: Props) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [donors, setDonors] = useState<DonorWithArea[]>([]);
  const [networkContacts, setNetworkContacts] = useState<DonorWithArea[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAreas();
    fetchNetworkContacts();
  }, []);

  const fetchAreas = async () => {
    const { data } = await supabase.from("areas").select("*").order("name");
    if (data) setAreas(data);
  };

  const fetchNetworkContacts = async () => {
    // Simulate network contacts (users who share matching blood compatibility)
    const { data } = await supabase
      .from("profiles")
      .select("*, areas(*)")
      .eq("is_donor", true)
      .eq("is_available", true)
      .eq("blood_group", profile.blood_group)
      .neq("id", profile.id)
      .limit(10);
    
    if (data) setNetworkContacts(data as DonorWithArea[]);
  };

  const searchDonors = async () => {
    if (!selectedArea) {
      toast.error("Please select an area");
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*, areas(*)")
      .eq("is_donor", true)
      .eq("is_available", true)
      .eq("area_id", selectedArea)
      .neq("id", profile.id);
    
    if (data) setDonors(data as DonorWithArea[]);
    setLoading(false);
  };

  const sendRequest = async (donorId: string) => {
    const { error } = await supabase.from("blood_requests").insert({
      patient_id: profile.id,
      donor_id: donorId,
      blood_group: profile.blood_group,
      urgency: "normal",
    });

    if (error) {
      toast.error("Failed to send request");
    } else {
      toast.success("Request sent! The donor will be notified.");
    }
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

        {/* My Network - Bubble View */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blood" />
            <h2 className="text-xl font-bold text-foreground">My Network</h2>
          </div>
          
          <div className="bg-card rounded-3xl p-8 shadow-card border border-border">
            {networkContacts.length === 0 ? (
              <p className="text-center text-muted-foreground">No matching donors in your network yet.</p>
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
                        <button className="w-20 h-20 md:w-24 md:h-24 rounded-full blood-gradient flex flex-col items-center justify-center shadow-glow hover:scale-110 transition-transform">
                          <span className="text-primary-foreground font-bold text-lg">{contact.blood_group}</span>
                          <span className="text-primary-foreground/80 text-xs truncate max-w-[60px]">
                            {contact.full_name.split(" ")[0]}
                          </span>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="rounded-3xl">
                        <DialogHeader>
                          <DialogTitle>{contact.full_name}</DialogTitle>
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
                          <Button className="w-full" onClick={() => sendRequest(contact.id)}>
                            <MessageCircle className="w-4 h-4" />
                            Send Request
                          </Button>
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
              <SelectTrigger className="h-12 rounded-xl flex-1">
                <SelectValue placeholder="Select an area" />
              </SelectTrigger>
              <SelectContent>
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
                  <div className="w-14 h-14 rounded-full blood-gradient flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">{donor.blood_group}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{donor.full_name}</p>
                    <p className="text-sm text-muted-foreground">{donor.areas?.name}</p>
                  </div>
                </div>
                <Button className="w-full" onClick={() => sendRequest(donor.id)}>
                  <MessageCircle className="w-4 h-4" />
                  Request Blood
                </Button>
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
