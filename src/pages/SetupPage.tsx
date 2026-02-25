import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, Calendar, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/utils';
import type { Wedding } from '@/types';
import { db } from '@/lib/db';

export default function SetupPage() {
  const navigate = useNavigate();
  const { user, setWedding } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [partner1, setPartner1] = useState('');
  const [partner2, setPartner2] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');

  const handleSubmit = async () => {
    if (!partner1.trim() || !partner2.trim()) return;
    setIsLoading(true);

    const wedding: Wedding = {
      id: generateId(),
      user_id: user?.id || 'local',
      partner1_name: partner1,
      partner2_name: partner2,
      wedding_date: weddingDate || '',
      venue: venue,
      location: location,
      theme: '',
      total_budget: Number(budget) || 0,
      cover_image_url: null,
      created_at: new Date().toISOString(),
    };

    try {
      // Save to IndexedDB for offline
      await db.weddings.add(wedding);

      // Try to save to Supabase
      if (user?.id) {
        await supabase.from('weddings').insert(wedding);
      }

      setWedding(wedding);
      navigate('/');
    } catch (error) {
      console.error('Setup error:', error);
      // Even on error, set wedding locally
      setWedding(wedding);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-6 w-6 fill-primary text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Wedding</CardTitle>
          <CardDescription>Tell us about your big day to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="p1">Partner 1 Name *</Label>
              <Input
                id="p1"
                placeholder="First name"
                value={partner1}
                onChange={(e) => setPartner1(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p2">Partner 2 Name *</Label>
              <Input
                id="p2"
                placeholder="First name"
                value={partner2}
                onChange={(e) => setPartner2(e.target.value)}
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">
              <Calendar className="mr-1 inline h-4 w-4" />
              Wedding Date
            </Label>
            <Input
              id="date"
              type="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
            />
          </div>

          {/* Venue & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="venue">Venue Name</Label>
              <Input
                id="venue"
                placeholder="The Grand Ballroom"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">
                <MapPin className="mr-1 inline h-4 w-4" />
                City / Location
              </Label>
              <Input
                id="location"
                placeholder="New York, NY"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">
              <DollarSign className="mr-1 inline h-4 w-4" />
              Total Budget
            </Label>
            <Input
              id="budget"
              type="number"
              placeholder="30000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Planning
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
