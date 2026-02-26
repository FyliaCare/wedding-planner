import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, Mail, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';

const COUPLE_PHOTOS = ['/couple-1.jpeg', '/couple-2.jpeg', '/couple-3.jpeg'];
const FLOATING_EMOJIS = ['💕', '💍', '🥂', '✨', '🌸', '💐', '🎊', '💝', '🤍', '💗'];

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
  const { signUp, signIn } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'join' | 'returning'>('join');
  const [currentPhoto, setCurrentPhoto] = useState(0);

  // Join form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Returning user
  const [returnEmail, setReturnEmail] = useState('');

  // Auto-rotate photos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPhoto((prev) => (prev + 1) % COUPLE_PHOTOS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleJoin = async () => {
    if (!name.trim() || !email.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      await signUp(email, email, name);
      navigate('/');
    } catch (err: unknown) {
      try {
        await signIn(email, email);
        navigate('/');
      } catch {
        setError(err instanceof Error ? err.message : 'Something went wrong. Try again!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!returnEmail.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      await signIn(returnEmail, returnEmail);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not find your account. Try joining instead!');
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
        {/* Floating emojis */}
        {FLOATING_EMOJIS.map((emoji, i) => (
          <FloatingEmoji
            key={i}
            emoji={emoji}
            delay={i * 1.2}
            left={5 + (i * 9) % 90}
          />
        ))}

        {/* Photo collage */}
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
              <img
                src={photo}
                alt={`Janet & Jojo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          ))}
        </div>

        {/* Photo dots */}
        <div className="absolute bottom-8 flex gap-2">
          {COUPLE_PHOTOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPhoto(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentPhoto === i
                  ? 'w-8 bg-primary'
                  : 'w-2.5 bg-primary/30 hover:bg-primary/50'
              }`}
            />
          ))}
        </div>

        {/* Decorative text */}
        <div className="absolute top-10 left-10 animate-float">
          <span className="text-5xl">💕</span>
        </div>
        <div className="absolute bottom-20 right-10 animate-float stagger-3">
          <span className="text-4xl">💍</span>
        </div>
      </div>

      {/* Right side — Auth form */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-6 bg-romantic overflow-hidden">
        {/* Mobile floating emojis */}
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
          <h1 className="text-5xl font-bold tracking-tight text-gradient">
            Janet & Jojo
          </h1>
          <p className="text-xl text-muted-foreground font-light">
            We're getting married! 🎉
          </p>
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
            <div className="space-y-4">
              <div className="text-center mb-1">
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                  <span>Join the Wedding Party</span>
                  <span className="text-2xl">🥳</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your name so we know who you are!
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium">Your Name</Label>
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

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9 h-11 rounded-xl bg-background/50 border-primary/20 focus:border-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleJoin()}
                  />
                </div>
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
                onClick={() => setMode('returning')}
              >
                Already joined? <span className="underline font-medium">Sign back in</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center mb-1">
                <h2 className="text-xl font-semibold">Welcome Back! 💕</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the email you joined with
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="return-email" className="text-xs font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="return-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9 h-11 rounded-xl bg-background/50 border-primary/20 focus:border-primary"
                    value={returnEmail}
                    onChange={(e) => setReturnEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleReturn()}
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
                onClick={() => setMode('join')}
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
