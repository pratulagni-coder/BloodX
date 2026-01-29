import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DonorDashboard } from "@/components/dashboard/DonorDashboard";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { Navbar } from "@/components/layout/Navbar";
import { Loader2 } from "lucide-react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Area = Database["public"]["Tables"]["areas"]["Row"];

export interface ProfileWithArea extends Profile {
  areas: Area | null;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileWithArea | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Real-time notifications with sound
  useRealtimeNotifications({
    profileId: profile?.id || null,
    isDonor: profile?.is_donor ?? false,
    onNewRequest: () => {
      // Refresh dashboard when new request comes in
      setRefreshKey(prev => prev + 1);
    },
    onRequestUpdate: () => {
      // Refresh dashboard when request status changes
      setRefreshKey(prev => prev + 1);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  // Re-fetch when refreshKey changes (from realtime updates)
  useEffect(() => {
    if (profile && refreshKey > 0) {
      fetchProfile();
    }
  }, [refreshKey]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*, areas(*)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile(data as ProfileWithArea);
    }
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blood" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Profile not found. Please complete your registration.</p>
          <button onClick={() => navigate("/register")} className="text-primary hover:underline">
            Go to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar profileId={profile.id} />
      <main className="pt-20">
        {profile.is_donor ? (
          <DonorDashboard profile={profile} onProfileUpdate={fetchProfile} />
        ) : (
          <PatientDashboard profile={profile} />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
