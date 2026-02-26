import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, Mail, Loader2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';

export default function AuthPage() {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'join' | 'returning'>('join');

  // Join form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Returning user
  const [returnEmail, setReturnEmail] = useState('');

  const handleJoin = async () => {
    if (!name.trim() || !email.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      // Simple password = email itself (no friction)
      await signUp(email, email, name);
      navigate('/');
    } catch (err: unknown) {
      // If already exists, try signing in
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Heart className="h-10 w-10 fill-primary text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Janet & Jojo
        </h1>
        <p className="text-lg text-muted-foreground">We're getting married! 🎉</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Join our wedding planner to help us plan, chat, and celebrate together
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {mode === 'join' ? (
            <>
              <div className="text-center mb-2">
                <PartyPopper className="h-8 w-8 mx-auto text-primary mb-2" />
                <h2 className="text-xl font-semibold">Join the Wedding Party</h2>
                <p className="text-sm text-muted-foreground">
                  Enter your name so we know who you are!
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="e.g. Aunty Debbie"
                    className="pl-9"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleJoin()}
                  />
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleJoin} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Heart className="mr-2 h-4 w-4" />
                )}
                Join the Wedding Party
              </Button>

              <button
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMode('returning')}
              >
                Already joined? <span className="underline">Sign back in</span>
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-2">
                <h2 className="text-xl font-semibold">Welcome Back!</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the email you joined with
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="return-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="return-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={returnEmail}
                    onChange={(e) => setReturnEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleReturn()}
                  />
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleReturn} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign Back In
              </Button>

              <button
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMode('join')}
              >
                New here? <span className="underline">Join the wedding</span>
              </button>
            </>
          )}
        </CardContent>
      </Card>

      <Button variant="link" className="mt-4 text-muted-foreground" onClick={handleSkip}>
        Just browsing? Continue as guest
      </Button>
    </div>
  );
}
