import { useState } from 'react';
import { Armchair, Plus, Circle, RectangleHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Badge available for future use
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import type { SeatingTable, TableShape } from '@/types';
import { generateId } from '@/utils';

export default function SeatingPage() {
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SeatingTable | null>(null);

  const [tableName, setTableName] = useState('');
  const [shape, setShape] = useState<TableShape>('round');
  const [capacity, setCapacity] = useState('8');

  const openCreate = () => {
    setEditing(null);
    setTableName(`Table ${tables.length + 1}`);
    setShape('round');
    setCapacity('8');
    setDialogOpen(true);
  };

  const openEdit = (table: SeatingTable) => {
    setEditing(table);
    setTableName(table.name);
    setShape(table.shape);
    setCapacity(String(table.capacity));
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!tableName.trim()) return;
    if (editing) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? { ...t, name: tableName, shape, capacity: Number(capacity) || 8 }
            : t
        )
      );
    } else {
      const newTable: SeatingTable = {
        id: generateId(),
        wedding_id: '',
        name: tableName,
        shape,
        capacity: Number(capacity) || 8,
        position_x: Math.random() * 400 + 50,
        position_y: Math.random() * 300 + 50,
      };
      setTables((prev) => [...prev, newTable]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    setDialogOpen(false);
  };

  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seating Chart</h1>
          <p className="text-muted-foreground">
            {tables.length} tables · {totalSeats} seats
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Table
        </Button>
      </div>

      {/* Floor plan */}
      {tables.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 p-8">
            <Armchair className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No tables yet. Start building your seating chart!
            </p>
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-3 w-3" /> Add first table
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Visual floor plan */}
          <Card>
            <CardHeader>
              <CardTitle>Floor Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative min-h-[400px] rounded-lg border-2 border-dashed bg-muted/30">
                {/* Head Table marker */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
                  ◆ HEAD TABLE AREA ◆
                </div>

                {tables.map((table) => (
                  <div
                    key={table.id}
                    className="absolute cursor-pointer transition-transform hover:scale-105"
                    style={{
                      left: table.position_x,
                      top: table.position_y,
                    }}
                    onClick={() => openEdit(table)}
                  >
                    <div
                      className={`flex flex-col items-center justify-center border-2 border-primary/40 bg-card shadow-sm hover:shadow-md transition-shadow ${
                        table.shape === 'round'
                          ? 'h-20 w-20 rounded-full'
                          : table.shape === 'rectangular'
                          ? 'h-16 w-28 rounded-lg'
                          : 'h-20 w-20 rounded-lg'
                      }`}
                    >
                      <p className="text-xs font-semibold">{table.name}</p>
                      <p className="text-[10px] text-muted-foreground">{table.capacity} seats</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Table list */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tables.map((table) => (
              <Card
                key={table.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openEdit(table)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  {table.shape === 'round' ? (
                    <Circle className="h-8 w-8 text-primary" />
                  ) : (
                    <RectangleHorizontal className="h-8 w-8 text-primary" />
                  )}
                  <div>
                    <p className="font-medium">{table.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {table.shape} · {table.capacity} seats
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Table' : 'Add Table'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Table Name</Label>
              <Input value={tableName} onChange={(e) => setTableName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Shape</Label>
              <Select value={shape} onValueChange={(v) => setShape(v as TableShape)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="round">Round</SelectItem>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                  <SelectItem value="square">Square</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" min="1" max="20" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editing && (
              <Button variant="destructive" onClick={() => handleDelete(editing.id)}>Delete</Button>
            )}
            <Button onClick={handleSave}>{editing ? 'Save' : 'Add Table'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
