'use client';

import * as React from 'react';
import {
  Nav, Hero, Logos, Stats, Pillars, Simulators, Envelopes,
  WorldMap, LiveRates, Score, DashboardSection, Compare,
  Testimonials, Security, Faq, Footer,
} from '@/components/landing';

export function LandingPage() {
  React.useEffect(() => {
    const els = document.querySelectorAll('.patrimo-landing .reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '-10% 0px', threshold: 0.08 },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <main className="patrimo-landing">
      <Nav />
      <Hero />
      <Logos />
      <Stats />
      <Pillars />
      <Simulators />
      <Envelopes />
      <WorldMap />
      <LiveRates />
      <Score />
      <DashboardSection />
      <Compare />
      <Testimonials />
      <Security />
      <Faq />
      <Footer />
    </main>
  );
}
