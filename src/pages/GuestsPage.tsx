import { useEffect, useState } from 'react';
import { Plus, Search, Users as UsersIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/authStore';
import { useGuestStore } from '@/stores/guestStore';
import type { Guest, RSVPStatus, GuestGroup, MealPreference } from '@/types';

const rsvpColors: Record<RSVPStatus, string> = {
  invited: 'secondary',
  sent: 'outline',
  accepted: 'success',
  declined: 'destructive',
  pending: 'warning',
};

const groupLabels: Record<GuestGroup, string> = {
  'bride-family': "Bride's Family",
  'groom-family': "Groom's Family",
  'bride-friends': "Bride's Friends",
  'groom-friends': "Groom's Friends",
  work: 'Work',
  other: 'Other',
};

const mealOptions: MealPreference[] = [
  'standard', 'vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'other',
];

export default function GuestsPage() {
  const { wedding } = useAuthStore();
  const {
    guests, loadGuests, addGuest, updateGuest, deleteGuest,
    filter, setFilter, getFilteredGuests, getStats,
  } = useGuestStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState<GuestGroup>('other');
  const [mealPref, setMealPref] = useState<MealPreference>('standard');
  const [dietary, setDietary] = useState('');
  const [plusOne, setPlusOne] = useState(false);
  const [plusOneName, setPlusOneName] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>('invited');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (wedding?.id) void loadGuests(wedding.id);
  }, [wedding?.id, loadGuests]);

  const filteredGuests = getFilteredGuests();
  const stats = getStats();

  const openCreate = () => {
    setEditingGuest(null);
    setName(''); setEmail(''); setPhone(''); setGroup('other');
    setMealPref('standard'); setDietary(''); setPlusOne(false);
    setPlusOneName(''); setRsvpStatus('invited'); setNotes('');
    setDialogOpen(true);
  };

  const openEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setName(guest.name); setEmail(guest.email); setPhone(guest.phone);
    setGroup(guest.group); setMealPref(guest.meal_preference);
    setDietary(guest.dietary_restrictions); setPlusOne(guest.plus_one);
    setPlusOneName(guest.plus_one_name); setRsvpStatus(guest.rsvp_status);
    setNotes(guest.notes);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (!wedding?.id) {
      alert('Please set up your wedding first! Go to the Dashboard and click "Set Up Your Wedding".');
      return;
    }
    const data = {
      wedding_id: wedding.id, name, email, phone, group,
      meal_preference: mealPref, dietary_restrictions: dietary,
      plus_one: plusOne, plus_one_name: plusOneName,
      rsvp_status: rsvpStatus, notes,
      table_id: null, seat_number: null,
    };
    try {
      if (editingGuest) {
        await updateGuest(editingGuest.id, data);
      } else {
        await addGuest(data);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save guest:', err);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Group', 'RSVP', 'Meal', 'Dietary', 'Plus One', 'Plus One Name'];
    const escapeCSV = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
    const rows = guests.map((g) => [
      g.name, g.email, g.phone, groupLabels[g.group],
      g.rsvp_status, g.meal_preference, g.dietary_restrictions,
      g.plus_one ? 'Yes' : 'No', g.plus_one_name,
    ]);
    const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest-list.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Guest List</h1>
          <p className="text-muted-foreground">{guests.length} guests total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Guest
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.accepted}</p>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{stats.declined}</p>
            <p className="text-xs text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.plusOnes}</p>
            <p className="text-xs text-muted-foreground">Plus Ones</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            className="pl-9"
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
          />
        </div>
        <Select value={filter.rsvpStatus} onValueChange={(v) => setFilter({ rsvpStatus: v as RSVPStatus | 'all' })}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="RSVP" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All RSVP</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filter.group} onValueChange={(v) => setFilter({ group: v as GuestGroup | 'all' })}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Group" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {(Object.keys(groupLabels) as GuestGroup[]).map((g) => (
              <SelectItem key={g} value={g}>{groupLabels[g]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Guest list */}
      {filteredGuests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-8">
            <UsersIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No guests yet. Start adding your guest list!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGuests.map((guest) => (
            <Card
              key={guest.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => openEdit(guest)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{guest.name}</p>
                    {guest.email && (
                      <p className="text-xs text-muted-foreground">{guest.email}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={rsvpColors[guest.rsvp_status] as 'success' | 'destructive' | 'warning' | 'secondary' | 'outline'} className="capitalize">
                        {guest.rsvp_status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {groupLabels[guest.group]}
                      </Badge>
                    </div>
                  </div>
                  {guest.plus_one && (
                    <Badge variant="secondary" className="text-xs">+1</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGuest ? 'Edit Guest' : 'Add Guest'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" placeholder="+1..." value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Group</Label>
                <Select value={group} onValueChange={(v) => setGroup(v as GuestGroup)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(groupLabels) as GuestGroup[]).map((g) => (
                      <SelectItem key={g} value={g}>{groupLabels[g]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>RSVP Status</Label>
                <Select value={rsvpStatus} onValueChange={(v) => setRsvpStatus(v as RSVPStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Meal Preference</Label>
                <Select value={mealPref} onValueChange={(v) => setMealPref(v as MealPreference)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {mealOptions.map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dietary Restrictions</Label>
                <Input placeholder="e.g. Nut allergy" value={dietary} onChange={(e) => setDietary(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={plusOne}
                  onChange={(e) => setPlusOne(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Plus One</span>
              </label>
              {plusOne && (
                <Input
                  placeholder="Plus one name"
                  value={plusOneName}
                  onChange={(e) => setPlusOneName(e.target.value)}
                  className="flex-1"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingGuest && (
              <Button variant="destructive" onClick={async () => { if (!window.confirm('Delete this guest?')) return; await deleteGuest(editingGuest.id); setDialogOpen(false); }}>
                Delete
              </Button>
            )}
            <Button onClick={handleSave}>{editingGuest ? 'Save' : 'Add Guest'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
