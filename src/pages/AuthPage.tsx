import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, MapPin, Lock, Users, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';

const COUPLE_PHOTOS = ['/couple-1.jpeg', '/couple-2.jpeg', '/couple-3.jpeg'];
const FLOATING_EMOJIS = ['💕', '💍', '🥂', '✨', '🌸', '💐', '🎊', '💝', '🤍', '💗'];

const RELATIONSHIPS = [
  { value: 'bridesmaid', label: '💃 Bridesmaid' },
  { value: 'groomsman', label: '🕺 Groomsman' },
  { value: 'parent', label: '👨‍👩‍👧 Parent' },
  { value: 'sibling', label: '👫 Sibling' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Family' },
  { value: 'friend', label: '🤝 Friend' },
  { value: 'planner', label: '📋 Wedding Planner' },
  { value: 'other', label: '✨ Other' },
];

function FloatingEmoji({ emoji, delay, left }: { emoji: string; delay: number; left: number }) {
  return (
    <div
      className="absolute text-2xl pointer-events-none opacity-60 select-none"
      style={{
        left: `${left}%`,
        top: '-5%',
        animation: `confetti-fall ${8 + Math.random() * 6}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {emoji}
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { joinParty, signInWithPin } = useAuthStore();

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'join' | 'returning'>('join');
  const [currentPhoto, setCurrentPhoto] = useState(0);

  // Join form
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [pin, setPin] = useState('');
  const [relationship, setRelationship] = useState('');

  // Returning user
  const [returnPin, setReturnPin] = useState('');

  // Auto-rotate photos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % COUPLE_PHOTOS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleJoin = async () => {
    if (!name.trim()) return setError('Please enter your name!');
    if (!location.trim()) return setError('Where are you from?');
    if (!pin.trim() || pin.length < 4) return setError('PIN must be at least 4 digits!');
    if (!relationship) return setError('Pick your relationship to the couple!');
    setError('');
    setIsLoading(true);
    try {
      await joinParty(name.trim(), location.trim(), relationship, pin.trim());
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!returnPin.trim()) return setError('Enter your secret PIN!');
    setError('');
    setIsLoading(true);
    try {
      const found = await signInWithPin(returnPin.trim());
      if (found) {
        navigate('/');
      } else {
        setError('No account found with that PIN. Try joining instead!');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    useAuthStore.getState().skipAuth();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Left side — Photo showcase (hidden on mobile) */}
      <div className="relative hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-primary/20 via-pink-100 to-rose-50 dark:from-primary/10 dark:via-pink-950/30 dark:to-rose-950/20 overflow-hidden">
        {FLOATING_EMOJIS.map((emoji, i) => (
          <FloatingEmoji key={i} emoji={emoji} delay={i * 1.2} left={5 + (i * 9) % 90} />
        ))}

        <div className="relative w-80 h-96">
          {COUPLE_PHOTOS.map((photo, i) => (
            <div
              key={photo}
              className="absolute inset-0 transition-all duration-1000 rounded-3xl overflow-hidden shadow-2xl"
              style={{
                opacity: currentPhoto === i ? 1 : 0,
                transform: currentPhoto === i
                  ? 'scale(1) rotate(0deg)'
                  : `scale(0.9) rotate(${(i - currentPhoto) * 5}deg)`,
                zIndex: currentPhoto === i ? 10 : 1,
              }}
            >
              <img src={photo} alt={`Janet & Jojo ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          ))}
        </div>

        <div className="absolute bottom-8 flex gap-2">
          {COUPLE_PHOTOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPhoto(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentPhoto === i ? 'w-8 bg-primary' : 'w-2.5 bg-primary/30 hover:bg-primary/50'
              }`}
            />
          ))}
        </div>

        <div className="absolute top-10 left-10 animate-float">
          <span className="text-5xl">💕</span>
        </div>
        <div className="absolute bottom-20 right-10 animate-float stagger-3">
          <span className="text-4xl">💍</span>
        </div>
      </div>

      {/* Right side — Auth form */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 bg-romantic overflow-hidden">
        <div className="lg:hidden">
          {FLOATING_EMOJIS.slice(0, 5).map((emoji, i) => (
            <FloatingEmoji key={i} emoji={emoji} delay={i * 2} left={10 + i * 18} />
          ))}
        </div>

        {/* Mobile photo strip */}
        <div className="mb-6 flex gap-3 overflow-hidden lg:hidden">
          {COUPLE_PHOTOS.map((photo, i) => (
            <div
              key={photo}
              className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl shadow-lg animate-slide-up"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>

        {/* Branding */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center animate-slide-up">
          <div className="relative">
            <Heart className="h-14 w-14 fill-primary text-primary animate-heart-beat" />
            <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-400 animate-bounce-gentle" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-gradient">Janet & Jojo</h1>
          <p className="text-xl text-muted-foreground font-light">We're getting married! 🎉</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Join our wedding crew to help us plan, chat, and celebrate together
          </p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md glass-heavy rounded-2xl p-6 shadow-xl animate-slide-up stagger-2">
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive animate-slide-up">
              {error}
            </div>
          )}

          {mode === 'join' ? (
            <div className="space-y-3.5">
              <div className="text-center mb-1">
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                  <span>Join the Wedding Party</span>
                  <span className="text-2xl">🥳</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Tell us a bit about you!</p>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">Your Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="e.g. Aunty Debbie 👋"
                    className="pl-9 h-11 rounded-xl bg-background/50 border-primary/20 focus:border-primary"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-xs font-medium">Where are you from? *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g. Lagos, Nigeria 🌍"
                    className="pl-9 h-11 rounded-xl bg-background/50 border-primary/20 focus:border-primary"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              {/* Relationship */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  <Users className="mr-1 inline h-3.5 w-3.5" />
                  Relationship to Couple *
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {RELATIONSHIPS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRelationship(r.value)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-all border ${
                        relationship === r.value
                          ? 'bg-primary/15 border-primary text-primary font-medium scale-[1.02]'
                          : 'bg-background/50 border-primary/10 hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secret PIN */}
              <div className="space-y-1.5">
                <Label htmlFor="pin" className="text-xs font-medium">Secret PIN * (to sign back in later)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="e.g. 1234"
                    maxLength={8}
                    className="pl-9 h-11 rounded-xl bg-background/50 border-primary/20 focus:border-primary tracking-widest text-lg"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Remember this! You'll use it to sign back in 🔑</p>
              </div>

              <Button
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
                onClick={handleJoin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Heart className="mr-2 h-5 w-5" />
                )}
                Join the Party 🎊
              </Button>

              <button
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={() => { setMode('returning'); setError(''); }}
              >
                Already joined? <span className="underline font-medium">Enter your PIN</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-1">
                <h2 className="text-xl font-semibold">Welcome Back! 💕</h2>
                <p className="text-sm text-muted-foreground mt-1">Enter the secret PIN you created</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="return-pin" className="text-xs font-medium">Your Secret PIN 🔑</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="return-pin"
                    type="password"
                    inputMode="numeric"
                    placeholder="Enter your PIN"
                    maxLength={8}
                    className="pl-9 h-11 rounded-xl bg-background/50 border-primary/20 focus:border-primary tracking-widest text-lg"
                    value={returnPin}
                    onChange={(e) => setReturnPin(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleReturn()}
                  />
                </div>
              </div>

              <Button
                className="w-full h-12 rounded-xl text-base font-semibold shadow-lg bg-gradient-to-r from-primary to-pink-500"
                onClick={handleReturn}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Sign Back In 👋
              </Button>

              <button
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={() => { setMode('join'); setError(''); }}
              >
                New here? <span className="underline font-medium">Join the wedding</span>
              </button>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          className="mt-4 text-muted-foreground hover:text-foreground"
          onClick={handleSkip}
        >
          Just browsing? Continue as guest ✨
        </Button>
      </div>
    </div>
  );
}
