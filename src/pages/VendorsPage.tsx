import { useEffect, useState } from 'react';
import { Plus, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { useVendorStore } from '@/stores/vendorStore';
import { formatCurrency } from '@/utils';
import type { Vendor, VendorCategory } from '@/types';

const vendorCategories: VendorCategory[] = [
  'venue', 'catering', 'photography', 'videography', 'florist',
  'music-dj', 'music-band', 'cake', 'hair-makeup', 'transportation',
  'stationery', 'rentals', 'planner', 'officiant', 'other',
];

const categoryLabels: Record<VendorCategory, string> = {
  venue: 'Venue', catering: 'Catering', photography: 'Photography',
  videography: 'Videography', florist: 'Florist', 'music-dj': 'DJ',
  'music-band': 'Band', cake: 'Cake', 'hair-makeup': 'Hair & Makeup',
  transportation: 'Transportation', stationery: 'Stationery',
  rentals: 'Rentals', planner: 'Planner', officiant: 'Officiant', other: 'Other',
};

export default function VendorsPage() {
  const { wedding } = useAuthStore();
  const {
    vendors, loadVendors, addVendor, updateVendor, deleteVendor,
    filter, setFilter, getFilteredVendors, getTotalCost, getTotalDeposits,
  } = useVendorStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorCategory>('other');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [depositPaid, setDepositPaid] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (wedding?.id) void loadVendors(wedding.id);
  }, [wedding?.id, loadVendors]);

  const filteredVendors = getFilteredVendors();

  const openCreate = () => {
    setEditing(null);
    setName(''); setCategory('other'); setEmail(''); setPhone('');
    setWebsite(''); setTotalCost(''); setDepositPaid(''); setRating(0); setNotes('');
    setDialogOpen(true);
  };

  const openEdit = (vendor: Vendor) => {
    setEditing(vendor);
    setName(vendor.name); setCategory(vendor.category); setEmail(vendor.email);
    setPhone(vendor.phone); setWebsite(vendor.website);
    setTotalCost(String(vendor.total_cost)); setDepositPaid(String(vendor.deposit_paid));
    setRating(vendor.rating); setNotes(vendor.notes);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !wedding?.id) return;
    const data = {
      wedding_id: wedding.id, name, category, email, phone, website,
      contract_url: null,
      total_cost: Number(totalCost) || 0,
      deposit_paid: Number(depositPaid) || 0,
      rating, notes,
    };
    try {
      if (editing) {
        await updateVendor(editing.id, data);
      } else {
        await addVendor(data);
      }
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save vendor:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            {vendors.length} vendors · {formatCurrency(getTotalCost())} total · {formatCurrency(getTotalDeposits())} deposited
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Vendor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            className="pl-9"
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
          />
        </div>
        <Select value={filter.category} onValueChange={(v) => setFilter({ category: v as VendorCategory | 'all' })}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {vendorCategories.map((c) => (
              <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vendor grid */}
      {filteredVendors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-8">
            <p className="text-sm text-muted-foreground">No vendors yet. Start adding your wedding vendors!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card
              key={vendor.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => openEdit(vendor)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{vendor.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">{categoryLabels[vendor.category]}</Badge>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s <= vendor.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {(vendor.email || vendor.phone) && (
                  <div className="text-xs text-muted-foreground">
                    {vendor.email && <p>{vendor.email}</p>}
                    {vendor.phone && <p>{vendor.phone}</p>}
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span>Total: <strong>{formatCurrency(vendor.total_cost)}</strong></span>
                  <span>
                    Deposit:{' '}
                    <strong
                      className={vendor.deposit_paid > 0 ? 'text-emerald-600' : 'text-muted-foreground'}
                    >
                      {formatCurrency(vendor.deposit_paid)}
                    </strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Vendor Name *</Label>
              <Input placeholder="e.g. Golden Hour Photography" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vendorCategories.map((c) => (
                    <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input type="url" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Total Cost</Label>
                <Input type="number" placeholder="0" value={totalCost} onChange={(e) => setTotalCost(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Deposit Paid</Label>
                <Input type="number" placeholder="0" value={depositPaid} onChange={(e) => setDepositPaid(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-0.5"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Contract details, contact notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editing && (
              <Button variant="destructive" onClick={async () => { await deleteVendor(editing.id); setDialogOpen(false); }}>
                Delete
              </Button>
            )}
            <Button onClick={handleSave}>{editing ? 'Save' : 'Add Vendor'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
