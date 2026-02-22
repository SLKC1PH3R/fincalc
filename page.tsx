'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { TrendingUp, Lock, Mail, User, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.ok) {
      router.push('/dashboard')
    } else {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Email ou mot de passe incorrect.' })
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    if (!res.ok) {
      setLoading(false)
      toast({ variant: 'destructive', title: 'Erreur', description: data.error })
      return
    }
    // Auto-login after register
    const loginRes = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (loginRes?.ok) router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-2 border border-gold/30 bg-gold/5">
              <TrendingUp className="h-6 w-6 text-gold" />
            </div>
            <h1 className="font-display text-3xl font-bold text-gold">FinCalc</h1>
          </div>
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
            // Outils de Finance Personnelle
          </p>
        </div>

        {/* Card */}
        <div className="finance-card p-8">
          {/* Mode toggle */}
          <div className="flex border border-border mb-8">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 font-mono text-xs tracking-widest uppercase transition-all ${mode === 'login' ? 'bg-gold text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 font-mono text-xs tracking-widest uppercase transition-all ${mode === 'register' ? 'bg-gold text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont" className="pl-9" required />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@exemple.com" className="pl-9" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input id="password" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? 'Min. 8 caractères' : '••••••••'} className="pl-9 pr-10" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading} size="lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 border border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  {mode === 'login' ? 'Connexion...' : 'Création...'}
                </span>
              ) : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          {mode === 'register' && (
            <p className="mt-4 font-mono text-xs text-muted-foreground text-center">
              L&apos;inscription est sur invitation uniquement.
            </p>
          )}
        </div>

        <p className="text-center font-mono text-xs text-muted-foreground/40 mt-6 tracking-widest">
          FinCalc v1.0 — Self-Hosted
        </p>
      </div>
    </div>
  )
}
