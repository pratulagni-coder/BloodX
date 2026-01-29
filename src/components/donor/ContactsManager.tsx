import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Search, Trash2, Droplets, MapPin, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddContactDialog } from "@/components/contacts/AddContactDialog";
import { ImportContactsDialog } from "@/components/contacts/ImportContactsDialog";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Area = Database["public"]["Tables"]["areas"]["Row"];

interface ContactProfile extends Profile {
  areas: Area | null;
}

interface Props {
  profileId: string;
  onContactsChange?: () => void;
}

export const ContactsManager = ({ profileId, onContactsChange }: Props) => {
  const [contacts, setContacts] = useState<ContactProfile[]>([]);
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, [profileId]);

  const fetchContacts = async () => {
    setLoading(true);
    
    // Get contact IDs
    const { data: contactData } = await supabase
      .from("user_contacts")
      .select("contact_user_id")
      .eq("user_id", profileId);

    if (contactData) {
      const ids = contactData.map(c => c.contact_user_id);
      setContactIds(ids);

      if (ids.length > 0) {
        // Fetch profiles of contacts
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*, areas(*)")
          .in("id", ids)
          .order("full_name");

        if (profiles) {
          setContacts(profiles as ContactProfile[]);
        }
      } else {
        setContacts([]);
      }
    }

    setLoading(false);
  };

  const removeContact = async (contactId: string) => {
    setDeletingId(contactId);

    const { error } = await supabase
      .from("user_contacts")
      .delete()
      .eq("user_id", profileId)
      .eq("contact_user_id", contactId);

    if (error) {
      toast.error("Failed to remove contact");
      console.error(error);
    } else {
      toast.success("Contact removed");
      fetchContacts();
      onContactsChange?.();
    }

    setDeletingId(null);
  };

  const handleContactAdded = () => {
    fetchContacts();
    onContactsChange?.();
  };

  // Filter contacts by search
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.full_name.toLowerCase().includes(query) ||
      (contact.phone && contact.phone.includes(query)) ||
      contact.blood_group.toLowerCase().includes(query)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="mt-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blood" />
          <h2 className="text-xl font-bold text-foreground">My Contacts</h2>
          <Badge variant="secondary">{contacts.length}</Badge>
        </div>
        <div className="flex gap-2">
          <AddContactDialog
            currentProfileId={profileId}
            existingContacts={contactIds}
            onContactAdded={handleContactAdded}
          />
          <ImportContactsDialog
            currentProfileId={profileId}
            existingContacts={contactIds}
            onContactsImported={handleContactAdded}
          />
        </div>
      </div>

      <div className="bg-card rounded-3xl p-6 shadow-card border border-border">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {contacts.length === 0
                ? "No contacts yet. Add donors to your network!"
                : "No contacts match your search"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredContacts.map((contact) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-blood/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full blood-gradient flex items-center justify-center shrink-0">
                    <Droplets className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{contact.full_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-blood">{contact.blood_group}</span>
                      {contact.areas && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {contact.areas.name}
                          </span>
                        </>
                      )}
                    </div>
                    {contact.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {contact.phone}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeContact(contact.id)}
                  disabled={deletingId === contact.id}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  {deletingId === contact.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
