import { useEffect, useState } from 'react';
import { Plus, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { useTimelineStore } from '@/stores/timelineStore';

import type { TimelineEvent } from '@/types';

export default function TimelinePage() {
  const { wedding } = useAuthStore();
  const { events, loadTimeline, addEvent, updateEvent, deleteEvent } = useTimelineStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [responsible, setResponsible] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (wedding?.id) void loadTimeline(wedding.id);
  }, [wedding?.id, loadTimeline]);

  const openCreate = () => {
    setEditing(null);
    setTitle(''); setStartTime(''); setEndTime('');
    setLocation(''); setResponsible(''); setNotes('');
    setDialogOpen(true);
  };

  const openEdit = (event: TimelineEvent) => {
    setEditing(event);
    setTitle(event.title);
    setStartTime(event.start_time);
    setEndTime(event.end_time);
    setLocation(event.location);
    setResponsible(event.responsible_person);
    setNotes(event.notes);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !wedding?.id) return;
    const data = {
      wedding_id: wedding.id,
      title, start_time: startTime, end_time: endTime,
      location, responsible_person: responsible, notes,
      sort_order: editing?.sort_order ?? events.length,
    };
    if (editing) {
      await updateEvent(editing.id, data);
    } else {
      await addEvent(data);
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Day-of Timeline</h1>
          <p className="text-muted-foreground">Plan every moment of your wedding day</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-8">
            <Clock className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No timeline events yet. Plan out your wedding day schedule!
            </p>
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-3 w-3" /> Create first event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="relative ml-4 border-l-2 border-primary/20 pl-8 space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-background">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              </div>

              <Card
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => openEdit(event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{event.title}</p>
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {event.start_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {event.start_time}
                            {event.end_time && ` – ${event.end_time}`}
                          </span>
                        )}
                        {event.location && <span>📍 {event.location}</span>}
                        {event.responsible_person && <span>👤 {event.responsible_person}</span>}
                      </div>
                      {event.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Event' : 'New Timeline Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Event Title *</Label>
              <Input placeholder="e.g. Ceremony begins" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="e.g. Garden Terrace" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Responsible Person</Label>
              <Input placeholder="e.g. Wedding coordinator" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional details..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editing && (
              <Button variant="destructive" onClick={async () => { await deleteEvent(editing.id); setDialogOpen(false); }}>
                <Trash2 className="mr-1 h-4 w-4" /> Delete
              </Button>
            )}
            <Button onClick={handleSave}>{editing ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
