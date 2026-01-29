import { Pill, Activity, Eye, EyeOff, Shield } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DonorMedicalInfoProps {
  isOnMedication: boolean;
  medicationDetails: string;
  hasMedicalCondition: boolean;
  medicalConditionDetails: string;
  visibility: "everyone" | "contacts_only";
  onMedicationChange: (value: boolean) => void;
  onMedicationDetailsChange: (value: string) => void;
  onMedicalConditionChange: (value: boolean) => void;
  onMedicalConditionDetailsChange: (value: string) => void;
  onVisibilityChange: (value: "everyone" | "contacts_only") => void;
}

export const DonorMedicalInfo = ({
  isOnMedication,
  medicationDetails,
  hasMedicalCondition,
  medicalConditionDetails,
  visibility,
  onMedicationChange,
  onMedicationDetailsChange,
  onMedicalConditionChange,
  onMedicalConditionDetailsChange,
  onVisibilityChange,
}: DonorMedicalInfoProps) => {
  return (
    <div className="space-y-6 p-4 rounded-xl bg-muted/50 border border-border">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Activity className="w-4 h-4 text-blood" />
        Medical Information
      </h3>

      {/* Medication */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="medication" className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-muted-foreground" />
            Are you currently on any medication?
          </Label>
          <Switch
            id="medication"
            checked={isOnMedication}
            onCheckedChange={onMedicationChange}
          />
        </div>
        {isOnMedication && (
          <Textarea
            placeholder="Please list your current medications..."
            value={medicationDetails}
            onChange={(e) => onMedicationDetailsChange(e.target.value)}
            className="rounded-xl min-h-[80px]"
          />
        )}
      </div>

      {/* Medical Condition */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="condition" className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            Do you have any medical conditions?
          </Label>
          <Switch
            id="condition"
            checked={hasMedicalCondition}
            onCheckedChange={onMedicalConditionChange}
          />
        </div>
        {hasMedicalCondition && (
          <Textarea
            placeholder="Please describe your medical condition(s)..."
            value={medicalConditionDetails}
            onChange={(e) => onMedicalConditionDetailsChange(e.target.value)}
            className="rounded-xl min-h-[80px]"
          />
        )}
      </div>

      {/* Visibility Setting */}
      <div className="space-y-3 pt-4 border-t border-border">
        <Label className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blood" />
          Who can find you as a donor?
        </Label>
        <RadioGroup
          value={visibility}
          onValueChange={(val) => onVisibilityChange(val as "everyone" | "contacts_only")}
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-3 p-3 rounded-xl border border-border hover:border-blood/50 transition-colors cursor-pointer">
            <RadioGroupItem value="everyone" id="everyone" />
            <Label htmlFor="everyone" className="flex items-center gap-2 cursor-pointer">
              <Eye className="w-4 h-4" />
              <div>
                <p className="font-medium">Everyone</p>
                <p className="text-xs text-muted-foreground">Anyone can find you</p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-xl border border-border hover:border-blood/50 transition-colors cursor-pointer">
            <RadioGroupItem value="contacts_only" id="contacts_only" />
            <Label htmlFor="contacts_only" className="flex items-center gap-2 cursor-pointer">
              <EyeOff className="w-4 h-4" />
              <div>
                <p className="font-medium">Contacts Only</p>
                <p className="text-xs text-muted-foreground">Only your contacts</p>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};
