import Link from 'next/link'
import { Zap, Shield, Star, Check, ArrowRight } from 'lucide-react'
import { PatrimoLogo } from '@/components/PatrimoLogo'

export const metadata = {
  title: 'À propos — PatrImo',
}

export default function About() {
  return (
    <div style={{ background: '#060606', color: '#fff', minHeight: '100vh', fontFamily: "'Geist', system-ui, sans-serif" }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(6,6,6,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <PatrimoLogo width={120} uid="about" />
          </Link>
          <Link href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Retour</Link>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 20px 100px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: 'rgba(176,120,32,0.15)', border: '1px solid rgba(176,120,32,0.25)', color: '#B07820', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
          Notre histoire
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 400, letterSpacing: '-0.025em', marginBottom: 20, lineHeight: 1.15 }}>
          À propos de{' '}
          <span style={{ fontStyle: 'italic', color: '#B07820' }}>PatrImo</span>
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginBottom: 48, maxWidth: 600 }}>
          PatrImo est né d'un constat simple : les outils de simulation financière disponibles en France sont soit trop complexes, soit trop imprécis, soit noyés dans la publicité. Nous avons voulu créer l'alternative.
        </p>

        {/* Mission */}
        <div style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '32px', marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Notre mission</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>
            Démocratiser la planification financière personnelle en France. Offrir à chaque personne — qu'elle commence à épargner, achète son premier bien immobilier ou planifie sa retraite — des outils de qualité professionnelle, gratuits, sans publicité et respectueux de ses données.
          </p>
        </div>

        {/* Values */}
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 20, marginTop: 48 }}>Nos valeurs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 48 }}>
          {[
            { icon: Zap, title: 'Simplicité', desc: 'Des outils puissants qui restent accessibles à tous, sans jargon inutile.' },
            { icon: Shield, title: 'Confidentialité', desc: 'Vos données ne sont jamais vendues ni partagées. Point final.' },
            { icon: Star, title: 'Qualité', desc: 'Des modèles financiers précis, mis à jour chaque année avec la fiscalité française.' },
            { icon: Check, title: 'Gratuité', desc: 'PatrImo sera toujours gratuit. C\'est une promesse, pas un argument marketing.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(176,120,32,0.15)', border: '1px solid rgba(176,120,32,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon style={{ width: 16, height: 16, color: '#B07820' }} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>{title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Tech */}
        <div style={{ background: 'linear-gradient(135deg, rgba(176,120,32,0.06) 0%, rgba(52,211,153,0.03) 100%)', border: '1px solid rgba(176,120,32,0.2)', borderRadius: 20, padding: '32px', marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Stack technique</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginBottom: 16 }}>
            PatrImo est construit avec des technologies modernes et open-source :
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Next.js 15', 'TypeScript', 'Tailwind CSS', 'NextAuth', 'Neon (PostgreSQL)', 'Vercel', 'Recharts'].map(tech => (
              <span key={tech} style={{ padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div style={{ textAlign: 'center', padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
            Une question, une suggestion, un bug à signaler ?
          </p>
          <a href="mailto:contact@digitalstack.cloud" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: '#B07820', color: '#000', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            Nous contacter <ArrowRight style={{ width: 14, height: 14 }} />
          </a>
        </div>
      </main>
    </div>
  )
}
