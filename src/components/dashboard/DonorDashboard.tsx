import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, MapPin, Bell, Calendar, ToggleLeft, ToggleRight, Check, X, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ProfileWithArea } from "@/pages/Dashboard";
import type { Database } from "@/integrations/supabase/types";

type Area = Database["public"]["Tables"]["areas"]["Row"];
type BloodRequest = Database["public"]["Tables"]["blood_requests"]["Row"];

interface Props {
  profile: ProfileWithArea;
  onProfileUpdate: () => void;
}

interface RequestWithPatient extends BloodRequest {
  patient: {
    full_name: string;
    phone: string | null;
  } | null;
}

export const DonorDashboard = ({ profile, onProfileUpdate }: Props) => {
  const [isAvailable, setIsAvailable] = useState(profile.is_available ?? true);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState(profile.area_id || "");
  const [requests, setRequests] = useState<RequestWithPatient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAreas();
    fetchPendingRequests();
  }, []);

  const fetchAreas = async () => {
    const { data } = await supabase.from("areas").select("*").order("name");
    if (data) setAreas(data);
  };

  const fetchPendingRequests = async () => {
    const { data } = await supabase
      .from("blood_requests")
      .select("*, patient:patient_id(full_name, phone)")
      .eq("donor_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    
    if (data) setRequests(data as RequestWithPatient[]);
  };

  const toggleAvailability = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_available: !isAvailable })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update availability");
    } else {
      setIsAvailable(!isAvailable);
      toast.success(isAvailable ? "You are now unavailable" : "You are now available to donate!");
    }
    setLoading(false);
  };

  const updateArea = async (areaId: string) => {
    setSelectedArea(areaId);
    const { error } = await supabase
      .from("profiles")
      .update({ area_id: areaId })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update area");
    } else {
      toast.success("Area updated successfully");
      onProfileUpdate();
    }
  };

  const handleRequest = async (requestId: string, accept: boolean) => {
    const { error } = await supabase
      .from("blood_requests")
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", requestId);

    if (error) {
      toast.error("Failed to update request");
    } else {
      toast.success(accept ? "Request accepted! Contact details shared." : "Request declined.");
      fetchPendingRequests();
    }
  };

  return (
    <div className="container px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Welcome, {profile.full_name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Thank you for being a lifesaver 💚
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blood-light border border-blood/20">
            <Droplets className="w-5 h-5 text-blood" />
            <span className="font-bold text-blood">{profile.blood_group}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Availability Toggle Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-3xl p-6 shadow-card border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isAvailable ? "bg-success/20" : "bg-muted"}`}>
                <Heart className={`w-6 h-6 ${isAvailable ? "text-success" : "text-muted-foreground"}`} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Availability</h3>
                <p className="text-sm text-muted-foreground">
                  {isAvailable ? "Ready to donate" : "Not available"}
                </p>
              </div>
            </div>
            <Button
              variant={isAvailable ? "success" : "outline"}
              className="w-full"
              onClick={toggleAvailability}
              disabled={loading}
            >
              {isAvailable ? (
                <>
                  <ToggleRight className="w-5 h-5" />
                  Available
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5" />
                  Unavailable
                </>
              )}
            </Button>
          </motion.div>

          {/* Area Selection Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-3xl p-6 shadow-card border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blood-light flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blood" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Approximate Area</h3>
                <p className="text-sm text-muted-foreground">For donor matching</p>
              </div>
            </div>
            <Select value={selectedArea} onValueChange={updateArea}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Select your area" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Last Donation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-3xl p-6 shadow-card border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Last Donation</h3>
                <p className="text-sm text-muted-foreground">Track your history</p>
              </div>
            </div>
            <p className="text-lg font-medium text-foreground">
              {profile.last_donation_date
                ? new Date(profile.last_donation_date).toLocaleDateString()
                : "No donations yet"}
            </p>
          </motion.div>
        </div>

        {/* Pending Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-blood" />
            <h2 className="text-xl font-bold text-foreground">Blood Requests</h2>
            {requests.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-blood text-primary-foreground text-sm font-medium">
                {requests.length}
              </span>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="bg-card rounded-3xl p-8 shadow-card border border-border text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending requests</p>
              <p className="text-sm text-muted-foreground mt-1">
                You'll be notified when someone in your area needs blood.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-card rounded-2xl p-6 shadow-card border border-border"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          request.urgency === "critical" ? "urgency-critical" :
                          request.urgency === "urgent" ? "urgency-urgent" : "urgency-normal"
                        }`}>
                          {request.urgency?.toUpperCase()}
                        </span>
                        <span className="text-blood font-bold">{request.blood_group}</span>
                      </div>
                      <p className="font-semibold text-foreground">
                        {request.patient?.full_name || "Anonymous"}
                      </p>
                      {request.hospital_name && (
                        <p className="text-sm text-muted-foreground">{request.hospital_name}</p>
                      )}
                      {request.message && (
                        <p className="text-sm text-muted-foreground mt-2">{request.message}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        onClick={() => handleRequest(request.id, true)}
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRequest(request.id, false)}
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-2xl bg-blood-light border border-blood/20">
          <p className="text-sm text-center text-muted-foreground">
            <strong>Important:</strong> Please proceed to a registered blood bank for screening and donation. 
            Never donate blood outside of official medical facilities.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
