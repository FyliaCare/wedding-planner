import { useState } from 'react';
import { Plus, Image, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import type { MoodBoardItem, MoodBoardCategory } from '@/types';
import { generateId } from '@/utils';

const categories: MoodBoardCategory[] = [
  'decor', 'dress', 'flowers', 'cake', 'venue', 'hair-makeup', 'invitations', 'other',
];

const categoryLabels: Record<MoodBoardCategory, string> = {
  decor: 'Decor', dress: 'Dress & Attire', flowers: 'Flowers', cake: 'Cake',
  venue: 'Venue', 'hair-makeup': 'Hair & Makeup', invitations: 'Invitations', other: 'Other',
};

export default function MoodBoardPage() {
  const [items, setItems] = useState<MoodBoardItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('all');

  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<MoodBoardCategory>('decor');

  const openCreate = () => {
    setImageUrl('');
    setCaption('');
    setCategory('decor');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!imageUrl.trim()) return;
    const item: MoodBoardItem = {
      id: generateId(),
      wedding_id: '',
      image_url: imageUrl,
      category,
      caption,
      created_at: new Date().toISOString(),
    };
    setItems((prev) => [...prev, item]);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filteredItems =
    selectedTab === 'all' ? items : items.filter((i) => i.category === selectedTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mood Board</h1>
          <p className="text-muted-foreground">Collect inspiration for your dream wedding</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Pin
        </Button>
      </div>

      {/* Category tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((c) => (
            <TabsTrigger key={c} value={c}>{categoryLabels[c]}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          {filteredItems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-2 p-8">
                <Image className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No pins yet. Add images to inspire your wedding look!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="mb-4 break-inside-avoid group relative">
                  <Card className="overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.caption}
                      className="w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/400x300/f1f5f9/94a3b8?text=Image';
                      }}
                    />
                    <CardContent className="p-3">
                      {item.caption && (
                        <p className="text-sm mb-1">{item.caption}</p>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[item.category]}
                      </Badge>
                    </CardContent>
                    {/* Overlay actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => window.open(item.image_url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Pin Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inspiration Pin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Image URL *</Label>
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="mt-2 max-h-40 w-full rounded-md object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input
                placeholder="What do you love about this?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MoodBoardCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Add Pin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
