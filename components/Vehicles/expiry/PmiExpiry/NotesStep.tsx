import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface NotesStepProps {
  notes: string;
  setNotes: (value: string) => void;
  handleNotesSubmit: () => void;
  isLoading: boolean;
}

const NotesStep: React.FC<NotesStepProps> = ({ notes, setNotes, handleNotesSubmit, isLoading }) => (
  <div>
    <Label htmlFor="notes" className="text-sm font-medium">
      Describe action taken to notify maintenance provider
    </Label>
    <Textarea
      id="notes"
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      placeholder="Enter detailed notes about the action taken..."
      className="mt-1 min-h-[100px]"
      required
    />
    <Button onClick={handleNotesSubmit} disabled={isLoading || !notes.trim()} className="mt-3 w-full">
      {isLoading ? "Processing..." : "Submit Notes"}
    </Button>
  </div>
);

export default NotesStep;