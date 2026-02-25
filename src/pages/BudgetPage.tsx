import { useEffect, useState } from 'react';
import { Plus, DollarSign, PieChart, TrendingDown, TrendingUp } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { useBudgetStore } from '@/stores/budgetStore';
import { formatCurrency, percentOf } from '@/utils';
import type { BudgetCategory, BudgetItem, PaymentStatus } from '@/types';

const CHART_COLORS = [
  '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
];

export default function BudgetPage() {
  const { wedding } = useAuthStore();
  const {
    categories, loadBudget,
    addCategory, updateCategory, deleteCategory,
    addItem, updateItem, deleteItem,
    getTotalEstimated, getTotalActual, getItemsByCategory,
  } = useBudgetStore();

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<BudgetCategory | null>(null);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Category form
  const [catName, setCatName] = useState('');
  const [catAmount, setCatAmount] = useState('');

  // Item form
  const [itemName, setItemName] = useState('');
  const [itemEstimated, setItemEstimated] = useState('');
  const [itemActual, setItemActual] = useState('');
  const [itemPaymentStatus, setItemPaymentStatus] = useState<PaymentStatus>('pending');
  const [itemNotes, setItemNotes] = useState('');
  const [itemCatId, setItemCatId] = useState('');

  useEffect(() => {
    if (wedding?.id) void loadBudget(wedding.id);
  }, [wedding?.id, loadBudget]);

  const totalBudget = wedding?.total_budget || 0;
  const totalEstimated = getTotalEstimated();
  const totalActual = getTotalActual();
  const remaining = totalBudget - totalActual;

  // Pie chart data
  const pieData = categories.map((cat) => {
    const catItems = getItemsByCategory(cat.id);
    const spent = catItems.reduce((sum, i) => sum + i.actual_cost, 0);
    return { name: cat.name, value: spent || cat.allocated_amount };
  });

  const openCreateCategory = () => {
    setEditingCat(null);
    setCatName('');
    setCatAmount('');
    setCatDialogOpen(true);
  };

  const openEditCategory = (cat: BudgetCategory) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatAmount(String(cat.allocated_amount));
    setCatDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim() || !wedding?.id) return;
    if (editingCat) {
      await updateCategory(editingCat.id, {
        name: catName,
        allocated_amount: Number(catAmount) || 0,
      });
    } else {
      await addCategory({
        wedding_id: wedding.id,
        name: catName,
        allocated_amount: Number(catAmount) || 0,
        icon: '💰',
      });
    }
    setCatDialogOpen(false);
  };

  const openCreateItem = (categoryId: string) => {
    setEditingItem(null);
    setItemName('');
    setItemEstimated('');
    setItemActual('');
    setItemPaymentStatus('pending');
    setItemNotes('');
    setItemCatId(categoryId);
    setItemDialogOpen(true);
  };

  const openEditItem = (item: BudgetItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemEstimated(String(item.estimated_cost));
    setItemActual(String(item.actual_cost));
    setItemPaymentStatus(item.payment_status);
    setItemNotes(item.notes);
    setItemCatId(item.category_id);
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemName.trim() || !wedding?.id) return;
    if (editingItem) {
      await updateItem(editingItem.id, {
        name: itemName,
        estimated_cost: Number(itemEstimated) || 0,
        actual_cost: Number(itemActual) || 0,
        payment_status: itemPaymentStatus,
        notes: itemNotes,
      });
    } else {
      await addItem({
        wedding_id: wedding.id,
        category_id: itemCatId,
        name: itemName,
        estimated_cost: Number(itemEstimated) || 0,
        actual_cost: Number(itemActual) || 0,
        payment_status: itemPaymentStatus,
        vendor_id: null,
        notes: itemNotes,
      });
    }
    setItemDialogOpen(false);
  };

  const paymentBadge = (status: PaymentStatus) => {
    const map: Record<PaymentStatus, { variant: 'success' | 'warning' | 'secondary'; label: string }> = {
      'fully-paid': { variant: 'success', label: 'Paid' },
      'deposit-paid': { variant: 'warning', label: 'Deposit' },
      'pending': { variant: 'secondary', label: 'Pending' },
    };
    const { variant, label } = map[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground">Track every dollar of your wedding spend</p>
        </div>
        <Button onClick={openCreateCategory}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalEstimated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalActual)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-emerald-600'}`}>
              {formatCurrency(remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Categories */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pie chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Add budget categories to see your breakdown
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Categories list */}
        <div className="space-y-4 lg:col-span-2">
          {categories.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-8">
                <p className="text-sm text-muted-foreground">No budget categories yet</p>
                <Button variant="outline" size="sm" onClick={openCreateCategory}>
                  <Plus className="mr-1 h-3 w-3" /> Create your first category
                </Button>
              </CardContent>
            </Card>
          ) : (
            categories.map((cat) => {
              const catItems = getItemsByCategory(cat.id);
              const catSpent = catItems.reduce((sum, i) => sum + i.actual_cost, 0);
              const catPercent = percentOf(catSpent, cat.allocated_amount);
              const isExpanded = selectedCatId === cat.id;

              return (
                <Card key={cat.id}>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setSelectedCatId(isExpanded ? null : cat.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{cat.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(catSpent)} / {formatCurrency(cat.allocated_amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{catPercent}%</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCategory(cat);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    <Progress
                      value={catPercent}
                      className={`h-2 ${catPercent > 100 ? '[&>div]:bg-destructive' : ''}`}
                    />
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-3">
                      {catItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent/50"
                          onClick={() => openEditItem(item)}
                        >
                          <div>
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Est: {formatCurrency(item.estimated_cost)} · Actual: {formatCurrency(item.actual_cost)}
                            </p>
                          </div>
                          {paymentBadge(item.payment_status)}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => openCreateItem(cat.id)}
                      >
                        <Plus className="mr-1 h-3 w-3" /> Add Item
                      </Button>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCat ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g. Photography" value={catName} onChange={(e) => setCatName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Allocated Amount</Label>
              <Input
                type="number"
                placeholder="5000"
                value={catAmount}
                onChange={(e) => setCatAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingCat && (
              <Button variant="destructive" onClick={async () => { await deleteCategory(editingCat.id); setCatDialogOpen(false); }}>
                Delete
              </Button>
            )}
            <Button onClick={handleSaveCategory}>{editingCat ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'New Budget Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g. Engagement shoot" value={itemName} onChange={(e) => setItemName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Estimated Cost</Label>
                <Input type="number" placeholder="0" value={itemEstimated} onChange={(e) => setItemEstimated(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Actual Cost</Label>
                <Input type="number" placeholder="0" value={itemActual} onChange={(e) => setItemActual(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={itemPaymentStatus} onValueChange={(v) => setItemPaymentStatus(v as PaymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="deposit-paid">Deposit Paid</SelectItem>
                  <SelectItem value="fully-paid">Fully Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Optional notes..." value={itemNotes} onChange={(e) => setItemNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingItem && (
              <Button variant="destructive" onClick={async () => { await deleteItem(editingItem.id); setItemDialogOpen(false); }}>
                Delete
              </Button>
            )}
            <Button onClick={handleSaveItem}>{editingItem ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
