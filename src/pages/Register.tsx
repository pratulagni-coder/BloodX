import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplets, Mail, Lock, User, Phone, Heart, Stethoscope, ArrowRight, Eye, EyeOff, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LocationSelector } from "@/components/registration/LocationSelector";
import { DonorMedicalInfo } from "@/components/registration/DonorMedicalInfo";
import type { Database } from "@/integrations/supabase/types";

type BloodGroup = Database["public"]["Enums"]["blood_group"];

const bloodGroups: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const Register = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp, user } = useAuth();

  // Basic fields
  const [role, setRole] = useState<"donor" | "patient">(
    searchParams.get("role") === "patient" ? "patient" : "donor"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Location fields
  const [stateId, setStateId] = useState("");
  const [stateName, setStateName] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [areaId, setAreaId] = useState("");

  // Donor-specific fields
  const [isOnMedication, setIsOnMedication] = useState(false);
  const [medicationDetails, setMedicationDetails] = useState("");
  const [hasMedicalCondition, setHasMedicalCondition] = useState(false);
  const [medicalConditionDetails, setMedicalConditionDetails] = useState("");
  const [visibility, setVisibility] = useState<"everyone" | "contacts_only">("everyone");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodGroup) {
      toast.error("Please select your blood group");
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, {
        full_name: fullName,
        phone,
        blood_group: bloodGroup,
        is_donor: role === "donor",
        area_id: areaId || null,
      });

      // Create profile after signup
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const profileData: any = {
          user_id: authData.user.id,
          full_name: fullName,
          phone,
          blood_group: bloodGroup,
          is_donor: role === "donor",
          area_id: areaId || null,
          state: stateName || null,
          district: districtName || null,
        };

        // Add donor-specific fields
        if (role === "donor") {
          profileData.is_on_medication = isOnMedication;
          profileData.medication_details = isOnMedication ? medicationDetails : null;
          profileData.has_medical_condition = hasMedicalCondition;
          profileData.medical_condition_details = hasMedicalCondition ? medicalConditionDetails : null;
          profileData.visibility = visibility;
        }

        const { error: profileError } = await supabase.from("profiles").insert(profileData);

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }

      navigate("/dashboard");
    } catch (error) {
      // Error handled in useAuth
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-warm-cream via-background to-blood-light p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl blood-gradient flex items-center justify-center shadow-glow">
            <Droplets className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">BloodX</span>
        </Link>

        {/* Card */}
        <div className="bg-card rounded-3xl shadow-elevated p-8 border border-border">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Join BloodX</h1>
            <p className="text-muted-foreground">Start saving lives today</p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setRole("donor")}
              className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                role === "donor"
                  ? "border-blood bg-blood-light"
                  : "border-border hover:border-blood/50"
              }`}
            >
              <Heart className={`w-8 h-8 mx-auto mb-2 ${role === "donor" ? "text-blood" : "text-muted-foreground"}`} />
              <p className={`font-semibold ${role === "donor" ? "text-blood" : "text-muted-foreground"}`}>
                I'm a Donor
              </p>
            </button>
            <button
              type="button"
              onClick={() => setRole("patient")}
              className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
                role === "patient"
                  ? "border-blood bg-blood-light"
                  : "border-border hover:border-blood/50"
              }`}
            >
              <Stethoscope className={`w-8 h-8 mx-auto mb-2 ${role === "patient" ? "text-blood" : "text-muted-foreground"}`} />
              <p className={`font-semibold ${role === "patient" ? "text-blood" : "text-muted-foreground"}`}>
                I Need Blood
              </p>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic Info Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-12 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-12 h-12 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 rounded-xl"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Blood Group */}
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {bloodGroups.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setBloodGroup(group)}
                    className={`p-3 rounded-xl border-2 font-bold transition-all ${
                      bloodGroup === group
                        ? "border-blood bg-blood text-white"
                        : "border-border hover:border-blood/50 text-foreground"
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Selector */}
            <LocationSelector
              stateId={stateId}
              districtId={districtId}
              areaId={areaId}
              onStateChange={(id, name) => { setStateId(id); setStateName(name); }}
              onDistrictChange={(id, name) => { setDistrictId(id); setDistrictName(name); }}
              onAreaChange={setAreaId}
            />

            {/* Donor-specific fields */}
            {role === "donor" && (
              <DonorMedicalInfo
                isOnMedication={isOnMedication}
                medicationDetails={medicationDetails}
                hasMedicalCondition={hasMedicalCondition}
                medicalConditionDetails={medicalConditionDetails}
                visibility={visibility}
                onMedicationChange={setIsOnMedication}
                onMedicationDetailsChange={setMedicationDetails}
                onMedicalConditionChange={setHasMedicalCondition}
                onMedicalConditionDetailsChange={setMedicalConditionDetails}
                onVisibilityChange={setVisibility}
              />
            )}

            {role === "donor" && (
              <div className="p-4 rounded-xl bg-blood-light border border-blood/20">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blood mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Privacy Note</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      We only use your approximate area for matching. Your exact location and medical details are kept private.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
