import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Search, Loader2, Droplets, MapPin, Check } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Area = Database["public"]["Tables"]["areas"]["Row"];

interface DonorResult extends Profile {
  areas: Area | null;
}

interface Props {
  currentProfileId: string;
  existingContacts: string[];
  onContactAdded: () => void;
}

export const AddContactDialog = ({ currentProfileId, existingContacts, onContactAdded }: Props) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<DonorResult[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a name or phone number");
      return;
    }

    setSearching(true);
    setResults([]);

    // Search donors by name or phone
    const { data, error } = await supabase
      .from("profiles")
      .select("*, areas(*)")
      .eq("is_donor", true)
      .neq("id", currentProfileId)
      .or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      .limit(10);

    if (error) {
      toast.error("Search failed");
      console.error(error);
    } else {
      setResults((data as DonorResult[]) || []);
      if (data?.length === 0) {
        toast.info("No donors found matching your search");
      }
    }

    setSearching(false);
  };

  const addContact = async (donorId: string) => {
    setAddingId(donorId);

    const { error } = await supabase.from("user_contacts").insert({
      user_id: currentProfileId,
      contact_user_id: donorId,
    });

    if (error) {
      if (error.code === "23505") {
        toast.info("This donor is already in your contacts");
      } else {
        toast.error("Failed to add contact");
        console.error(error);
      }
    } else {
      toast.success("Contact added successfully!");
      onContactAdded();
    }

    setAddingId(null);
  };

  const isAlreadyContact = (donorId: string) => existingContacts.includes(donorId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Donor
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blood" />
            Search & Add Donor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="rounded-xl"
            />
            <Button onClick={handleSearch} disabled={searching} size="icon" className="shrink-0">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {results.map((donor) => (
              <div
                key={donor.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full blood-gradient flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{donor.full_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-blood">{donor.blood_group}</span>
                      {donor.areas && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {donor.areas.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isAlreadyContact(donor.id) ? (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <Check className="w-4 h-4" />
                    Added
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => addContact(donor.id)}
                    disabled={addingId === donor.id}
                    className="h-8"
                  >
                    {addingId === donor.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UserPlus className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>
            ))}

            {results.length === 0 && !searching && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Search for donors by name or phone number
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
