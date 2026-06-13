import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";
import Navigation from "@/components/Navigation";
import { SciFiFrame } from "@/components/ui/sci-fi-frame";
import { SciFiButton } from "@/components/ui/sci-fi-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/BackButton";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePersona } from "./usePersona";
import {
  ALL_INTERESTS,
  PERSONAS,
  type Interest,
  type PersonaId,
} from "./personas.config";

function GateContent() {
  const navigate = useNavigate();
  const { availableIds, interests, setAvailable, setInterests } = usePersona();
  const [draftPersonas, setDraftPersonas] = useState<PersonaId[]>(availableIds);
  const [draftInterests, setDraftInterests] = useState<Interest[]>(interests);

  const togglePersona = (id: PersonaId) => {
    setDraftPersonas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleInterest = (i: Interest) => {
    setDraftInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );
  };

  const save = () => {
    setAvailable(draftPersonas);
    setInterests(draftInterests);
    toast.success("Guardian settings saved");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen relative">
      <StarfieldBackground />
      <Navigation />
      <main className="relative z-10 pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-3xl space-y-6">
          <div className="flex items-center gap-2">
            <BackButton />
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl font-bold text-gradient">
              Guardian Persona Settings
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Choose which AI guides are available to your child and select the interests they
            care about. These tailor the experience without collecting any new personal info.
          </p>

          <SciFiFrame className="p-5">
            <h2 className="font-display text-lg mb-3">Available personas</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {PERSONAS.map((p) => {
                const checked = draftPersonas.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 cursor-pointer min-h-[44px]"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => togglePersona(p.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </SciFiFrame>

          <SciFiFrame className="p-5">
            <h2 className="font-display text-lg mb-3">Child's interests</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ALL_INTERESTS.map((i) => {
                const checked = draftInterests.includes(i);
                return (
                  <label
                    key={i}
                    className="flex items-center gap-2 p-3 rounded-lg border border-border/50 cursor-pointer min-h-[44px] capitalize"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleInterest(i)}
                    />
                    <Label className="cursor-pointer">{i}</Label>
                  </label>
                );
              })}
            </div>
          </SciFiFrame>

          <div className="flex justify-end gap-3">
            <SciFiButton
              type="button"
              variant="ghost"
              shape="angled"
              onClick={() => navigate(-1)}
            >
              Cancel
            </SciFiButton>
            <SciFiButton type="button" variant="primary" shape="angled" onClick={save}>
              Save Settings
            </SciFiButton>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GuardianPersonaGate() {
  // Uses the existing auth-gated route guard (ProtectedRoute) as the guardian gate path.
  return (
    <ProtectedRoute>
      <GateContent />
    </ProtectedRoute>
  );
}
