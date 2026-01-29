import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2, Droplets, Check, X, Phone } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Area = Database["public"]["Tables"]["areas"]["Row"];

interface DonorMatch extends Profile {
  areas: Area | null;
}

interface Props {
  currentProfileId: string;
  existingContacts: string[];
  onContactsImported: () => void;
}

// Contact Picker API types
interface ContactInfo {
  name?: string[];
  tel?: string[];
}

export const ImportContactsDialog = ({ currentProfileId, existingContacts, onContactsImported }: Props) => {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [matchedDonors, setMatchedDonors] = useState<DonorMatch[]>([]);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"initial" | "results">("initial");

  const isContactPickerSupported = "contacts" in navigator && "ContactsManager" in window;

  const handleImportFromDevice = async () => {
    if (!isContactPickerSupported) {
      toast.error("Contact import is not supported on this device/browser");
      return;
    }

    setImporting(true);

    try {
      // @ts-ignore - Contact Picker API
      const contacts: ContactInfo[] = await navigator.contacts.select(["name", "tel"], { multiple: true });

      if (!contacts || contacts.length === 0) {
        toast.info("No contacts selected");
        setImporting(false);
        return;
      }

      // Extract phone numbers
      const phoneNumbers: string[] = [];
      contacts.forEach((contact) => {
        if (contact.tel) {
          contact.tel.forEach((phone) => {
            // Normalize phone number (remove spaces, dashes, etc.)
            const normalized = phone.replace(/[\s\-\(\)]/g, "");
            if (normalized.length >= 10) {
              // Get last 10 digits for matching
              phoneNumbers.push(normalized.slice(-10));
            }
          });
        }
      });

      if (phoneNumbers.length === 0) {
        toast.info("No valid phone numbers found in selected contacts");
        setImporting(false);
        return;
      }

      // Search for donors with matching phone numbers
      const { data, error } = await supabase
        .from("profiles")
        .select("*, areas(*)")
        .eq("is_donor", true)
        .neq("id", currentProfileId);

      if (error) {
        toast.error("Failed to search donors");
        console.error(error);
        setImporting(false);
        return;
      }

      // Filter donors whose phone numbers match
      const matches = (data as DonorMatch[]).filter((donor) => {
        if (!donor.phone) return false;
        const donorPhone = donor.phone.replace(/[\s\-\(\)]/g, "").slice(-10);
        return phoneNumbers.includes(donorPhone);
      });

      setMatchedDonors(matches);
      setStep("results");

      if (matches.length === 0) {
        toast.info("No registered donors found in your contacts");
      } else {
        toast.success(`Found ${matches.length} donor(s) from your contacts!`);
      }
    } catch (err) {
      console.error("Contact picker error:", err);
      toast.error("Failed to access contacts");
    }

    setImporting(false);
  };

  const addContact = async (donorId: string) => {
    setAddingIds((prev) => new Set(prev).add(donorId));

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
      toast.success("Contact added!");
      onContactsImported();
    }

    setAddingIds((prev) => {
      const next = new Set(prev);
      next.delete(donorId);
      return next;
    });
  };

  const addAllContacts = async () => {
    const toAdd = matchedDonors.filter((d) => !existingContacts.includes(d.id));
    if (toAdd.length === 0) {
      toast.info("All donors are already in your contacts");
      return;
    }

    setImporting(true);

    const inserts = toAdd.map((donor) => ({
      user_id: currentProfileId,
      contact_user_id: donor.id,
    }));

    const { error } = await supabase.from("user_contacts").insert(inserts);

    if (error) {
      toast.error("Failed to add some contacts");
      console.error(error);
    } else {
      toast.success(`Added ${toAdd.length} contact(s)!`);
      onContactsImported();
    }

    setImporting(false);
  };

  const isAlreadyContact = (donorId: string) => existingContacts.includes(donorId);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setStep("initial");
      setMatchedDonors([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="w-4 h-4" />
          Import from Phone
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-blood" />
            Import Contacts
          </DialogTitle>
        </DialogHeader>

        {step === "initial" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Import contacts from your phone to find registered blood donors among your friends and family.
            </p>

            {!isContactPickerSupported && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <p className="font-medium">Not Supported</p>
                <p className="text-xs mt-1">
                  Contact import requires a modern mobile browser (Chrome on Android). Try using the manual search
                  instead.
                </p>
              </div>
            )}

            <Button
              onClick={handleImportFromDevice}
              disabled={importing || !isContactPickerSupported}
              className="w-full gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Accessing Contacts...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Select Contacts from Phone
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Your contacts are only used to find registered donors. We never store your phone contacts.
            </p>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4 pt-2">
            {matchedDonors.length > 0 && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Found {matchedDonors.length} donor(s)
                </p>
                <Button size="sm" variant="secondary" onClick={addAllContacts} disabled={importing}>
                  {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add All"}
                </Button>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-2">
              {matchedDonors.map((donor) => (
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
                      <span className="text-xs font-semibold text-blood">{donor.blood_group}</span>
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
                      disabled={addingIds.has(donor.id)}
                      className="h-8"
                    >
                      {addingIds.has(donor.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                    </Button>
                  )}
                </div>
              ))}

              {matchedDonors.length === 0 && (
                <div className="text-center py-8">
                  <X className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No registered donors found in your contacts</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try searching manually or invite friends to register
                  </p>
                </div>
              )}
            </div>

            <Button variant="outline" onClick={() => setStep("initial")} className="w-full">
              Import More Contacts
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
