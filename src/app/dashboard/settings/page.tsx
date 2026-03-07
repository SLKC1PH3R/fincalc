'use client'
import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { User, Mail, Camera, Check, Loader2, Lock, ShieldCheck } from 'lucide-react'

const DEMO_EMAIL = 'demo@digitalstack.cloud'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const { toast } = useToast()

  const isDemo = session?.user?.email === DEMO_EMAIL
  const isAdmin = session?.user?.isAdmin ?? false

  const [name, setName] = useState(session?.user?.name || '')
  const [imageUrl, setImageUrl] = useState(session?.user?.image || '')
  const [imagePreview, setImagePreview] = useState(session?.user?.image || '')
  const [saving, setSaving] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Admin override state for demo account
  const [adminDemoName, setAdminDemoName] = useState('')
  const [adminDemoImage, setAdminDemoImage] = useState('')
  const [savingDemo, setSavingDemo] = useState(false)

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      toast({ title: 'Image trop volumineuse', description: 'Maximum 500 Ko', variant: 'destructive' })
      return
    }
    setUploadingImg(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string
      setImageUrl(b64)
      setImagePreview(b64)
      setUploadingImg(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), image: imageUrl }),
      })
      if (!res.ok) throw new Error()
      await update({ name: name.trim(), image: imageUrl })
      toast({ title: 'Profil mis à jour', description: 'Vos modifications sont enregistrées.' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDemo = async () => {
    setSavingDemo(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: adminDemoName.trim(), image: adminDemoImage.trim(), targetEmail: DEMO_EMAIL }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Compte démo mis à jour', description: 'Profil du compte de démo modifié.' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le compte démo.', variant: 'destructive' })
    } finally {
      setSavingDemo(false)
    }
  }

  const initials = (session?.user?.name || session?.user?.email || 'U')[0].toUpperCase()

  return (
    <div className="space-y-6 animate-fade-in p-5 md:p-6 max-w-xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mon compte</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez votre profil et vos préférences</p>
      </div>

      {/* Demo account lock notice */}
      {isDemo && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Lock className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            Ce compte de démonstration est en lecture seule. Le nom d'affichage et la photo ne peuvent pas être modifiés.
          </p>
        </div>
      )}

      {/* Avatar */}
      <Card className={isDemo ? 'opacity-60 pointer-events-none select-none' : ''}>
        <CardHeader>
          <CardTitle>Photo de profil</CardTitle>
          <CardDescription>JPG ou PNG · maximum 500 Ko</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {imagePreview ? (
                <img src={imagePreview} alt="Avatar" className="h-16 w-16 rounded-full object-cover border border-border" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted border border-border flex items-center justify-center">
                  <span className="text-2xl font-semibold text-foreground">{initials}</span>
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/80 transition-colors"
              >
                {uploadingImg ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ou entrez une URL d'image</Label>
              <Input
                type="url"
                placeholder="https://..."
                value={imageUrl.startsWith('data:') ? '' : imageUrl}
                onChange={e => { setImageUrl(e.target.value); setImagePreview(e.target.value) }}
              />
            </div>
          </div>
          {imagePreview && (
            <button
              onClick={() => { setImageUrl(''); setImagePreview('') }}
              className="text-xs text-muted-foreground hover:text-crimson-finance transition-colors"
            >
              Supprimer la photo
            </button>
          )}
        </CardContent>
      </Card>

      {/* Profile info */}
      <Card className={isDemo ? 'opacity-60 pointer-events-none select-none' : ''}>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" />Nom d'affichage</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Votre nom"
              maxLength={50}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />Adresse email</Label>
            <Input value={session?.user?.email || ''} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié.</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving || isDemo} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
        Enregistrer les modifications
      </Button>

      {/* Admin override — modify demo account */}
      {isAdmin && (
        <Card style={{ borderColor: 'rgba(249,115,22,0.25)', background: 'rgba(249,115,22,0.04)' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4" style={{ color: '#f97316' }} />
              <span>Admin — Compte démo</span>
            </CardTitle>
            <CardDescription>Modifier le profil du compte de démonstration ({DEMO_EMAIL})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" />Nom d'affichage</Label>
              <Input
                value={adminDemoName}
                onChange={e => setAdminDemoName(e.target.value)}
                placeholder="Nom du compte démo"
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><Camera className="h-3.5 w-3.5 text-muted-foreground" />URL photo de profil</Label>
              <Input
                type="url"
                value={adminDemoImage}
                onChange={e => setAdminDemoImage(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <Button
              onClick={handleSaveDemo}
              disabled={savingDemo || (!adminDemoName.trim() && !adminDemoImage.trim())}
              variant="outline"
              className="w-full"
              style={{ borderColor: 'rgba(249,115,22,0.4)', color: '#f97316' }}
            >
              {savingDemo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Mettre à jour le compte démo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
