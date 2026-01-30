import { useState, useRef } from "react";
import { Upload, FileText, X, Droplets, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type UrgencyLevel = Database["public"]["Enums"]["urgency_level"];

interface BloodRequestFormProps {
  patientProfileId: string;
  bloodGroup: string;
  donorId?: string;
  onRequestSent: () => void;
}

export const BloodRequestForm = ({ patientProfileId, bloodGroup, donorId, onRequestSent }: BloodRequestFormProps) => {
  const [open, setOpen] = useState(false);
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [urgency, setUrgency] = useState<UrgencyLevel>("normal");
  const [hospitalName, setHospitalName] = useState("");
  const [message, setMessage] = useState("");
  const [medicalReport, setMedicalReport] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setMedicalReport(file);
    }
  };

  // Upload and return the FILE PATH (not a public URL) for secure storage
  const uploadMedicalReport = async (userId: string): Promise<string | null> => {
    if (!medicalReport) return null;

    const fileExt = medicalReport.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("medical-reports")
      .upload(filePath, medicalReport, { upsert: false });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    // Return the file path, NOT a public URL
    // Signed URLs will be generated when viewing the file
    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      // Get current user for file upload path
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      let reportUrl = null;
      if (medicalReport && userId) {
        reportUrl = await uploadMedicalReport(userId);
        if (!reportUrl) {
          toast.error("Failed to upload medical report");
        }
      }

      const { error } = await supabase.from("blood_requests").insert({
        patient_id: patientProfileId,
        donor_id: donorId || null,
        blood_group: bloodGroup as Database["public"]["Enums"]["blood_group"],
        urgency,
        hospital_name: hospitalName || null,
        message: message || null,
        units_required: unitsRequired,
        medical_report_path: reportUrl, // Store file path, not URL
      });

      if (error) {
        console.error("Request error:", error);
        toast.error("Failed to send request");
      } else {
        toast.success("Blood request sent successfully!");
        setOpen(false);
        onRequestSent();
        // Reset form
        setUnitsRequired(1);
        setUrgency("normal");
        setHospitalName("");
        setMessage("");
        setMedicalReport(null);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Droplets className="w-4 h-4" />
          Request Blood
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blood" />
            Blood Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Units Required */}
          <div className="space-y-2">
            <Label htmlFor="units">Units Required</Label>
            <Input
              id="units"
              type="number"
              min={1}
              max={20}
              value={unitsRequired}
              onChange={(e) => setUnitsRequired(parseInt(e.target.value) || 1)}
              className="h-12 rounded-xl"
            />
          </div>

          {/* Urgency Level */}
          <div className="space-y-2">
            <Label>Urgency Level</Label>
            <Select value={urgency} onValueChange={(val) => setUrgency(val as UrgencyLevel)}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border z-50">
                <SelectItem value="normal">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    Normal
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    Urgent
                  </div>
                </SelectItem>
                <SelectItem value="critical">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blood" />
                    Critical
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hospital Name */}
          <div className="space-y-2">
            <Label htmlFor="hospital">Hospital Name (Optional)</Label>
            <Input
              id="hospital"
              type="text"
              placeholder="Enter hospital name"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              className="h-12 rounded-xl"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Any additional details..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-xl min-h-[80px]"
            />
          </div>

          {/* Medical Report Upload */}
          <div className="space-y-2">
            <Label>Medical Report (Optional)</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-blood/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              {medicalReport ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-blood" />
                  <span className="text-sm font-medium">{medicalReport.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMedicalReport(null);
                    }}
                    className="p-1 rounded-full hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload PDF, JPG, or PNG (max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? "Sending Request..." : "Send Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
