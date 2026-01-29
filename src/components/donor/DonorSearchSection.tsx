import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, Droplets, Phone, Users, UserCheck, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type District = Database["public"]["Tables"]["districts"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Area = Database["public"]["Tables"]["areas"]["Row"];

interface DonorWithArea extends Profile {
  areas: Area | null;
  isContact?: boolean;
}

interface ContactProfile extends Profile {
  areas: Area | null;
}

interface Props {
  profileId: string;
  stateId?: string;
}

export const DonorSearchSection = ({ profileId, stateId }: Props) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [donors, setDonors] = useState<DonorWithArea[]>([]);
  const [contacts, setContacts] = useState<ContactProfile[]>([]);
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showContactsOnly, setShowContactsOnly] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(true);

  useEffect(() => {
    fetchDistricts();
    fetchContacts();
  }, []);

  const fetchDistricts = async () => {
    setLoadingDistricts(true);
    // Fetch all districts - in production would filter by state
    const { data, error } = await supabase
      .from("districts")
      .select("*")
      .order("name");

    if (data) setDistricts(data);
    if (error) console.error("Error fetching districts:", error);
    setLoadingDistricts(false);
  };

  const fetchContacts = async () => {
    // Get all contacts for this user
    const { data: contactData } = await supabase
      .from("user_contacts")
      .select("contact_user_id")
      .eq("user_id", profileId);

    if (contactData) {
      const ids = contactData.map(c => c.contact_user_id);
      setContactIds(ids);

      if (ids.length > 0) {
        // Fetch contact profiles
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*, areas(*)")
          .in("id", ids)
          .eq("is_donor", false); // Get patients (non-donors) who might need blood

        if (profileData) {
          setContacts(profileData as ContactProfile[]);
        }
      }
    }
  };

  const handleDistrictSelect = (districtId: string) => {
    if (selectedDistricts.includes(districtId)) {
      setSelectedDistricts(prev => prev.filter(d => d !== districtId));
    } else if (selectedDistricts.length < 3) {
      setSelectedDistricts(prev => [...prev, districtId]);
    } else {
      toast.error("Maximum 3 districts allowed");
    }
  };

  const removeDistrict = (districtId: string) => {
    setSelectedDistricts(prev => prev.filter(d => d !== districtId));
  };

  const searchPatientsInDistricts = async () => {
    if (selectedDistricts.length === 0) {
      toast.error("Please select at least one district");
      return;
    }

    setLoading(true);

    // Get district names for matching
    const selectedDistrictNames = districts
      .filter(d => selectedDistricts.includes(d.id))
      .map(d => d.name);

    // Search for patients (non-donors) in selected districts who need blood
    const { data, error } = await supabase
      .from("profiles")
      .select("*, areas(*)")
      .eq("is_donor", false)
      .in("district", selectedDistrictNames)
      .neq("id", profileId);

    if (error) {
      toast.error("Search failed");
      console.error(error);
    } else if (data) {
      const patientsWithContactStatus = (data as DonorWithArea[]).map(patient => ({
        ...patient,
        isContact: contactIds.includes(patient.id)
      }));

      // Apply search query filter if exists
      let filtered = patientsWithContactStatus;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
          p.full_name.toLowerCase().includes(query) ||
          (p.phone && p.phone.includes(query))
        );
      }

      // Filter by contacts only if toggled
      if (showContactsOnly) {
        filtered = filtered.filter(p => p.isContact);
      }

      setDonors(filtered);

      if (filtered.length === 0) {
        toast.info("No patients found in selected districts");
      } else {
        toast.success(`Found ${filtered.length} patient(s)`);
      }
    }

    setLoading(false);
  };

  const getDistrictName = (id: string) => {
    return districts.find(d => d.id === id)?.name || id;
  };

  // Filter donors by search query
  const filteredDonors = donors.filter(donor => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      donor.full_name.toLowerCase().includes(query) ||
      (donor.phone && donor.phone.includes(query)) ||
      donor.blood_group.toLowerCase().includes(query)
    );
  });

  // Sort: contacts first
  const sortedDonors = [...filteredDonors].sort((a, b) => {
    if (a.isContact && !b.isContact) return -1;
    if (!a.isContact && b.isContact) return 1;
    return 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <Search className="w-6 h-6 text-blood" />
        <h2 className="text-xl font-bold text-foreground">Find Patients by District</h2>
      </div>

      <div className="bg-card rounded-3xl p-6 shadow-card border border-border">
        {/* District Selection */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Select up to 3 preferred districts
            </p>
            <Badge variant="outline" className="text-xs">
              {selectedDistricts.length}/3 selected
            </Badge>
          </div>

          {/* Selected Districts */}
          {selectedDistricts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedDistricts.map(districtId => (
                <Badge
                  key={districtId}
                  variant="default"
                  className="flex items-center gap-1 pr-1"
                >
                  <MapPin className="w-3 h-3" />
                  {getDistrictName(districtId)}
                  <button
                    onClick={() => removeDistrict(districtId)}
                    className="ml-1 p-0.5 rounded-full hover:bg-primary-foreground/20"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* District Dropdown */}
          <Select
            onValueChange={handleDistrictSelect}
            disabled={loadingDistricts || selectedDistricts.length >= 3}
          >
            <SelectTrigger className="h-12 rounded-xl bg-background">
              <SelectValue placeholder={
                loadingDistricts ? "Loading districts..." :
                selectedDistricts.length >= 3 ? "Maximum districts selected" :
                "Add a district..."
              } />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50 max-h-64">
              {districts
                .filter(d => !selectedDistricts.includes(d.id))
                .map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-xl"
            />
          </div>
          <Button
            variant={showContactsOnly ? "default" : "outline"}
            onClick={() => setShowContactsOnly(!showContactsOnly)}
            className="h-12 gap-2"
          >
            <Users className="w-4 h-4" />
            Contacts Only
          </Button>
          <Button
            onClick={searchPatientsInDistricts}
            disabled={loading || selectedDistricts.length === 0}
            className="h-12 gap-2"
          >
            <Filter className="w-4 h-4" />
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>

        {/* Results */}
        {sortedDonors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDonors.map((patient) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-background rounded-2xl p-4 border border-border hover:border-blood/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 rounded-full blood-gradient flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5 text-primary-foreground" />
                    {patient.isContact && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                        <UserCheck className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{patient.full_name}</p>
                      <span className="text-blood font-bold text-sm">{patient.blood_group}</span>
                    </div>
                    {patient.district && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {patient.district}
                      </p>
                    )}
                    {patient.isContact && patient.phone && (
                      <p className="text-xs text-success flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" />
                        {patient.phone}
                      </p>
                    )}
                    {patient.isContact && (
                      <Badge variant="default" className="bg-success text-xs mt-2">
                        Contact
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {selectedDistricts.length === 0
                ? "Select districts and search to find patients"
                : "No results found. Try different districts or search terms."}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
