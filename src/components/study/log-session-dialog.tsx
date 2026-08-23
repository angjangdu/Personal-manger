"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { appStore } from "@/services/app-store";
import { useAppState } from "@/hooks/use-app-state";

interface LogSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preset subject (logging from a subject page). */
  defaultSubjectId?: string;
  defaultTopicId?: string;
}

export function LogSessionDialog({
  open,
  onOpenChange,
  defaultSubjectId,
  defaultTopicId,
}: LogSessionDialogProps) {
  const state = useAppState();

  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? "");
  const [topicId, setTopicId] = useState(defaultTopicId ?? "");
  const [type, setType] = useState<"study" | "revision">("study");
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [duration, setDuration] = useState("45");
  const [notes, setNotes] = useState("");

  const topics = useMemo(
    () =>
      state.studyTopics.filter(
        (t) =>
          t.subjectId === (subjectId || "__none__") && Boolean(t.parentId)
      ),
    [state.studyTopics, subjectId]
  );

  if (!open) return null;

  const valid =
    subjectId !== "" && subjectId !== "none" && Number(duration) > 0;

  function submit() {
    if (!valid) return;
    appStore.addSession({
      subjectId,
      topicId: topicId === "none" || topicId === "" ? undefined : topicId,
      type,
      date: new Date(date + "T00:00:00").toISOString(),
      durationMinutes: Number(duration),
      notes,
    });
    toast(type === "revision" ? "Revision logged" : "Study session logged", {
      description:
        type === "revision" && topicId !== "none"
          ? "Topic's last-revised date updated."
          : `${duration} minutes.`,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log session</DialogTitle>
          <DialogDescription>
            Record what you studied or revised — revisions update the topic.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={subjectId || undefined}
                onValueChange={(v) => {
                  setSubjectId(v);
                  setTopicId("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  {state.studySubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Topic (optional)</Label>
              <Select value={topicId || "none"} onValueChange={setTopicId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "study" | "revision")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="revision">Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-date">Date</Label>
              <Input
                id="session-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-duration">Minutes</Label>
              <Input
                id="session-duration"
                type="number"
                min={1}
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-notes">Notes</Label>
            <Textarea
              id="session-notes"
              rows={2}
              placeholder="What did you cover?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Log session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
