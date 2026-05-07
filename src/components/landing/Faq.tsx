'use client';

import * as React from 'react';
import { I } from './icons';
import { SectionHead } from './Pillars';

export function Faq() {
  const [open, setOpen] = React.useState(0);
  const items = [
    { q: 'PatrImo est-il vraiment gratuit ?', a: 'Oui, et sans publicité. Le projet est financé par notre structure et reste open-source. Nous ne vendons aucune donnée.' },
    { q: 'Avez-vous besoin de mes identifiants bancaires ?', a: "Non. Toute la saisie est manuelle. Vous gardez un contrôle total sur vos données et aucun accès à vos comptes n'est requis." },
    { q: 'Quelle est la différence avec Finary ou Yomoni ?', a: 'PatrImo combine simulateurs fiscaux, agrégation patrimoniale et optimisation ETF — sans lier vos comptes bancaires. 100 % gratuit, open-source.' },
    { q: 'Mes données sont-elles chiffrées ?', a: 'Oui, chiffrement AES-256 au repos et TLS 1.3 en transit. Hébergement en Europe, conformité RGPD.' },
    { q: 'La fiscalité française 2026 est-elle à jour ?', a: 'Oui, tous les simulateurs intègrent les barèmes IR 2026, les plafonds PEA/PER/AV, ainsi que les prélèvements sociaux en vigueur.' },
    { q: 'Puis-je auto-héberger PatrImo ?', a: 'Oui. Le code est disponible sur GitHub. Stack : Next.js, PostgreSQL, Prisma. Documentation Docker fournie.' },
  ];
  return (
    <section id="faq" style={{
      padding: '100px 0',
      background: 'var(--surface)',
      borderTop: '1px solid var(--line)',
    }}>
      <div className="container" style={{ maxWidth: 880 }}>
        <SectionHead
          eyebrow="Questions"
          title={<>Les réponses, <span className="serif-i" style={{ color: 'var(--gold-deep)' }}>directes.</span></>}
        />
        <div style={{ marginTop: 40 }}>
          {items.map((it, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--line)', borderBottom: i === items.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} style={{
                width: '100%', padding: '22px 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                textAlign: 'left', gap: 20,
              }}>
                <span style={{ fontFamily: 'var(--f-serif)', fontSize: 22, color: 'var(--ink)', letterSpacing: '-0.01em', fontWeight: 400 }}>{it.q}</span>
                <span style={{
                  width: 32, height: 32, borderRadius: 99,
                  background: 'var(--surface-2)', border: '1px solid var(--line)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--ink)', flexShrink: 0,
                  transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                  transition: 'transform .3s',
                }}><I.plus size={14} stroke={2} /></span>
              </button>
              <div style={{
                overflow: 'hidden',
                maxHeight: open === i ? 200 : 0,
                opacity: open === i ? 1 : 0,
                transition: 'max-height .4s ease, opacity .3s ease, padding .3s',
                paddingBottom: open === i ? 22 : 0,
              }}>
                <p style={{ fontSize: 15.5, color: 'var(--muted)', lineHeight: 1.65, maxWidth: 680 }}>{it.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
