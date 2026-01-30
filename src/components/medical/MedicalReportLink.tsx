import { useState } from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MedicalReportLinkProps {
  filePath: string;
  className?: string;
}

/**
 * Component that generates signed URLs for medical reports on-demand.
 * This ensures medical files are only accessible through authenticated,
 * time-limited URLs rather than permanent public URLs.
 */
export const MedicalReportLink = ({ filePath, className = "" }: MedicalReportLinkProps) => {
  const [loading, setLoading] = useState(false);

  const handleViewReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate a signed URL valid for 1 hour
      const { data, error } = await supabase.storage
        .from("medical-reports")
        .createSignedUrl(filePath, 3600); // 1 hour expiration

      if (error) {
        console.error("Failed to generate signed URL:", error);
        toast.error("Unable to access the medical report");
        return;
      }

      if (data?.signedUrl) {
        // Open the signed URL in a new tab
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Error accessing medical report:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleViewReport}
      disabled={loading}
      className={`inline-flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      {loading ? "Loading..." : "View Medical Report"}
    </button>
  );
};
