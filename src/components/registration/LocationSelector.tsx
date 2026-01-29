import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface State {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
  state_id: string;
}

interface Area {
  id: string;
  name: string;
  city: string;
}

interface LocationSelectorProps {
  stateId: string;
  districtId: string;
  areaId: string;
  onStateChange: (stateId: string, stateName: string) => void;
  onDistrictChange: (districtId: string, districtName: string) => void;
  onAreaChange: (areaId: string) => void;
}

export const LocationSelector = ({
  stateId,
  districtId,
  areaId,
  onStateChange,
  onDistrictChange,
  onAreaChange,
}: LocationSelectorProps) => {
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      const { data, error } = await supabase
        .from("states")
        .select("*")
        .order("name");
      if (data) setStates(data);
      if (error) console.error("Error fetching states:", error);
      setLoadingStates(false);
    };
    fetchStates();
  }, []);

  useEffect(() => {
    if (stateId) {
      setLoadingDistricts(true);
      const fetchDistricts = async () => {
        const { data, error } = await supabase
          .from("districts")
          .select("*")
          .eq("state_id", stateId)
          .order("name");
        if (data) setDistricts(data);
        if (error) console.error("Error fetching districts:", error);
        setLoadingDistricts(false);
      };
      fetchDistricts();
    } else {
      setDistricts([]);
    }
  }, [stateId]);

  useEffect(() => {
    const fetchAreas = async () => {
      const { data, error } = await supabase.from("areas").select("*").order("name");
      if (data) setAreas(data);
      if (error) console.error("Error fetching areas:", error);
    };
    fetchAreas();
  }, []);

  const handleStateChange = (value: string) => {
    const state = states.find(s => s.id === value);
    onStateChange(value, state?.name || "");
    onDistrictChange("", ""); // Reset district when state changes
  };

  const handleDistrictChange = (value: string) => {
    const district = districts.find(d => d.id === value);
    onDistrictChange(value, district?.name || "");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <MapPin className="w-4 h-4" />
        <span>Location (for matching nearby donors/recipients)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>State</Label>
          <Select value={stateId} onValueChange={handleStateChange} disabled={loadingStates}>
            <SelectTrigger className="h-12 rounded-xl bg-background">
              <SelectValue placeholder={loadingStates ? "Loading..." : "Select State"} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {states.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>District</Label>
          <Select 
            value={districtId} 
            onValueChange={handleDistrictChange} 
            disabled={!stateId || loadingDistricts}
          >
            <SelectTrigger className="h-12 rounded-xl bg-background">
              <SelectValue placeholder={loadingDistricts ? "Loading..." : "Select District"} />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {districts.length === 0 ? (
                <SelectItem value="_none" disabled>
                  No districts available
                </SelectItem>
              ) : (
                districts.map((district) => (
                  <SelectItem key={district.id} value={district.id}>
                    {district.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Area</Label>
          <Select value={areaId} onValueChange={onAreaChange}>
            <SelectTrigger className="h-12 rounded-xl bg-background">
              <SelectValue placeholder="Select Area" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name} ({area.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
