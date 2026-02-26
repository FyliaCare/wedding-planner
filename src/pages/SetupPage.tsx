import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2, Calendar, MapPin, DollarSign, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/utils';
import type { Wedding } from '@/types';
import { db } from '@/lib/db';

export default function SetupPage() {
  const navigate = useNavigate();
  const { user, setWedding } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [partner1, setPartner1] = useState('Janet');
  const [partner2, setPartner2] = useState('Jojo');
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
      await db.weddings.add(wedding);
      if (user?.id) {
        await supabase.from('weddings').insert(wedding);
      }
      setWedding(wedding);
      navigate('/');
    } catch (error) {
      console.error('Setup error:', error);
      setWedding(wedding);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-romantic p-4 overflow-hidden">
      {/* Floating decorations */}
      <div className="absolute top-10 left-10 text-4xl animate-float opacity-60">💕</div>
      <div className="absolute bottom-20 right-10 text-3xl animate-float stagger-3 opacity-40">💍</div>
      <div className="absolute top-1/3 right-20 text-2xl animate-float stagger-5 opacity-30">✨</div>

      {/* Photo strip header */}
      <div className="mb-6 flex gap-3 animate-slide-up">
        {['/couple-1.jpeg', '/couple-2.jpeg', '/couple-3.jpeg'].map((photo, i) => (
          <div
            key={photo}
            className="h-20 w-20 overflow-hidden rounded-2xl shadow-lg border-2 border-white/50"
            style={{ animationDelay: `${i * 0.1}s`, transform: `rotate(${(i - 1) * 4}deg)` }}
          >
            <img src={photo} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      {/* Setup card */}
      <div className="w-full max-w-lg glass-heavy rounded-2xl p-6 shadow-xl animate-slide-up stagger-1">
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <Heart className="h-10 w-10 fill-primary text-primary animate-heart-beat mx-auto" />
            <Sparkles className="absolute -top-1 -right-2 h-4 w-4 text-amber-400 animate-bounce-gentle" />
          </div>
          <h1 className="text-2xl font-bold text-gradient mt-3">Set Up Your Wedding</h1>
          <p className="text-sm text-muted-foreground mt-1">Tell us about your big day! 🎉</p>
        </div>

        <div className="space-y-4">
          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p1" className="text-xs font-medium">Partner 1 Name *</Label>
              <Input
                id="p1"
                placeholder="First name"
                className="h-11 rounded-xl bg-background/50 border-primary/20"
                value={partner1}
                onChange={(e) => setPartner1(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p2" className="text-xs font-medium">Partner 2 Name *</Label>
              <Input
                id="p2"
                placeholder="First name"
                className="h-11 rounded-xl bg-background/50 border-primary/20"
                value={partner2}
                onChange={(e) => setPartner2(e.target.value)}
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="text-xs font-medium">
              <Calendar className="mr-1 inline h-3.5 w-3.5" />
              Wedding Date 📅
            </Label>
            <Input
              id="date"
              type="date"
              className="h-11 rounded-xl bg-background/50 border-primary/20"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
            />
          </div>

          {/* Venue & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="venue" className="text-xs font-medium">Venue Name 🏛️</Label>
              <Input
                id="venue"
                placeholder="The Grand Ballroom"
                className="h-11 rounded-xl bg-background/50 border-primary/20"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-medium">
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                Location 📍
              </Label>
              <Input
                id="location"
                placeholder="City, State"
                className="h-11 rounded-xl bg-background/50 border-primary/20"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <Label htmlFor="budget" className="text-xs font-medium">
              <DollarSign className="mr-1 inline h-3.5 w-3.5" />
              Total Budget 💵
            </Label>
            <Input
              id="budget"
              type="number"
              placeholder="30000"
              className="h-11 rounded-xl bg-background/50 border-primary/20"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <Button
            className="w-full h-12 rounded-xl text-base font-semibold shadow-lg bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Start Planning 🎊
          </Button>
        </div>
      </div>
    </div>
  );
}
