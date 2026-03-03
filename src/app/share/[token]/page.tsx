import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  compound: 'Intérêts Composés', dca: 'DCA', fire: 'FI/RE',
  buyrent: 'Acheter vs Louer', mortgage: 'Prêt Immobilier', rental: 'Rentabilité Locative',
  tax: 'Impôts IR', retirement: 'Retraite', 'savings-rate': "Taux d'épargne", budget: 'Budget 50/30/20',
  'flat-tax': 'Flat Tax vs Barème', 'envelope-compare': 'PEA vs CTO vs AV',
}

async function getSharedSim(token: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/share/${token}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

function fmt(n: unknown): string {
  if (typeof n !== 'number') return String(n ?? '—')
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)
}

function DataGrid({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object' && !Array.isArray(v))
  if (entries.length === 0) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
      {entries.map(([key, value]) => (
        <div key={key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
            {typeof value === 'number' ? fmt(value) : String(value)}
          </p>
        </div>
      ))}
    </div>
  )
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const sim = await getSharedSim(token)
  if (!sim) notFound()

  const typeLabel = TYPE_LABELS[sim.type] ?? sim.type
  const createdAt = new Date(sim.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>

      {/* Navbar */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(241,192,134,0.12)', border: '1px solid rgba(241,192,134,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp style={{ width: 14, height: 14, color: '#f1c086' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>FinCalc</span>
        </Link>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(241,192,134,0.12)', border: '1px solid rgba(241,192,134,0.25)', color: '#f1c086', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
          Créer mon compte gratuit →
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            Simulation partagée · {createdAt}
          </p>
          <h1 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: 6 }}>{sim.name}</h1>
          <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: '#f1c086', background: 'rgba(241,192,134,0.12)', border: '1px solid rgba(241,192,134,0.22)', borderRadius: 6, padding: '3px 10px' }}>
            {typeLabel}
          </span>
        </div>

        {/* Inputs */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Paramètres</p>
          <DataGrid data={sim.inputs as Record<string, unknown>} />
        </div>

        {/* Results */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Résultats</p>
          <DataGrid data={sim.results as Record<string, unknown>} />
        </div>

        {/* CTA */}
        <div style={{ background: 'rgba(241,192,134,0.06)', border: '1px solid rgba(241,192,134,0.15)', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
            Lancez votre propre simulation
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginBottom: 20 }}>
            FinCalc est 100% gratuit. 9 calculateurs financiers, historique illimité, partage de simulations.
          </p>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 12, background: '#f1c086', color: '#111', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
            Créer mon compte FinCalc gratuit →
          </Link>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const sim = await getSharedSim(token)
  if (!sim) return { title: 'Simulation introuvable · FinCalc' }
  return {
    title: `${sim.name} · FinCalc`,
    description: `Simulation ${TYPE_LABELS[sim.type] ?? sim.type} partagée via FinCalc — calculateur financier gratuit.`,
    openGraph: { title: `${sim.name} · FinCalc`, description: `Simulation ${TYPE_LABELS[sim.type] ?? sim.type}` },
  }
}
