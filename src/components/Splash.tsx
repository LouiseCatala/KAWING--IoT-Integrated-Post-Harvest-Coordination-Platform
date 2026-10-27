import { IconCheck, IconDroplet, IconHeartHandshake, IconTruck } from '@tabler/icons-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import './landing/landing.css';
import ThemeToggle from './ThemeToggle';
import baseIslandImage from '../assets/images/land-without.png';
import kawingLogo from '../assets/images/kawing_logo_new_1784129186773.jpg';
import revealIslandImage from '../assets/images/ratatatatata.nbg.png';

interface SplashProps { onComplete: () => void; }

const facts = [
  { icon: <span className="inline-flex items-center gap-1.5 align-middle"><IconHeartHandshake size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>, category: 'Better Market Access', title: 'Bring Your Harvest Directly to Buyers', description: 'Post palay and compare offers from verified buyers.', result: 'Clearer choices and stronger market connections' },
  { icon: <span className="inline-flex items-center gap-1.5 align-middle"><IconDroplet size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>, category: 'PalaySense Guidance', title: 'Know Your Palay Before You Negotiate', description: 'Use fresh moisture readings to plan drying and set your price.', result: 'Better-informed moisture decisions' },
  { icon: <span className="inline-flex items-center gap-1.5 align-middle"><IconTruck size={24} stroke={2} aria-hidden="true" className="inline-block shrink-0" /></span>, category: 'Connected Farm Services', title: 'Arrange Post-Harvest Support in One Place', description: 'Find approved hauling, drying, storage, and milling providers in one place.', result: 'One platform for essential agricultural services' },
  { icon: '₱', category: 'Production Support', title: 'Prepare for the Next Production Cycle', description: 'Review available production support with visible terms and requirements before making a commitment.', result: 'Transparent support for farm production' },
];

export default function Splash({ onComplete }: SplashProps) {
  const heroRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: -999, y: -999 });
  const [activeFact, setActiveFact] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => setActiveFact((current) => (current + 1) % facts.length), 6000);
    return () => window.clearInterval(timer);
  }, [autoplay]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const updateSpotlight = useCallback(() => {
    frameRef.current = null;
    const hero = heroRef.current;
    const reveal = revealRef.current;
    if (!hero || !reveal) return;
    const bounds = hero.getBoundingClientRect();
    reveal.style.setProperty('--spot-x', `${pointerRef.current.x - bounds.left}px`);
    reveal.style.setProperty('--spot-y', `${pointerRef.current.y - bounds.top}px`);
  }, []);

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    pointerRef.current = { x: event.clientX, y: event.clientY };
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(updateSpotlight);
  };

  const handlePointerLeave = () => {
    revealRef.current?.style.setProperty('--spot-x', '-999px');
    revealRef.current?.style.setProperty('--spot-y', '-999px');
  };

  const enterKawing = () => {
    setIsExiting(true);
    window.setTimeout(onComplete, 300);
  };

  const fact = facts[activeFact];
  return (
    <div className={`kawing-landing ${isExiting ? 'is-exiting' : ''}`}>
      <section ref={heroRef} className="landing-hero" onClick={enterKawing} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
        <ThemeToggle variant="landing" />
        <div className="landing-wordmark" aria-label="KAWING"><span>KA</span><span>WING</span></div>
        <div className="landing-image landing-image-base" style={{ backgroundImage: `url(${baseIslandImage})` }} aria-hidden="true" />
        <div ref={revealRef} className="landing-image landing-image-reveal" style={{ backgroundImage: `url(${revealIslandImage})` }} aria-hidden="true" />
        <div className="landing-hero-vignette" aria-hidden="true" />
        <div className="landing-hero-actions">
          <button type="button" className="landing-enter"><span /> CLICK ANYWHERE TO ENTER KAWING</button>
          <a href="#kawing-benefits" className="landing-scroll-link" onClick={(event) => event.stopPropagation()}>Discover KAWING <ChevronDown /></a>
        </div>
      </section>

      <main id="kawing-benefits" className="landing-info">
        <div className="landing-info-inner">
          <header className="landing-info-header"><span>How KAWING helps</span><h2>From harvest to market, connected at every step.</h2><p>Farm tools, opportunities, and trusted services in one place.</p></header>
          <div className="landing-tabs" role="tablist" aria-label="KAWING benefits">
            {facts.map((item, index) => <button key={item.category} type="button" role="tab" aria-selected={activeFact === index} className={activeFact === index ? 'is-active' : ''} onClick={() => setActiveFact(index)}><span>{item.icon}</span>{item.category}</button>)}
          </div>
          <article className="landing-benefit-card" key={fact.category}>
            {autoplay && <div className="landing-progress"><span /></div>}
            <span className="landing-card-count">0{activeFact + 1} / 0{facts.length}</span>
            <div className="landing-card-icon">{fact.icon}</div>
            <div><span className="landing-card-label">{fact.category}</span><h3>{fact.title}</h3></div>
            <p>{fact.description}</p><strong className="landing-card-result"><span className="inline-flex items-center gap-1.5 align-middle mr-1.5"><IconCheck size={14} stroke={2} aria-hidden="true" className="inline-block shrink-0 text-emerald-500" /></span>{fact.result}</strong>
          </article>
          <div className="landing-card-controls">
            <button type="button" onClick={() => setAutoplay((value) => !value)}>{autoplay ? <Pause /> : <Play />}{autoplay ? 'Pause' : 'Play'}</button>
            <div><button type="button" aria-label="Previous benefit" onClick={() => setActiveFact((activeFact - 1 + facts.length) % facts.length)}><ChevronLeft /></button><button type="button" aria-label="Next benefit" onClick={() => setActiveFact((activeFact + 1) % facts.length)}><ChevronRight /></button></div>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div className="landing-footer-brand"><img src={kawingLogo} alt="KAWING" /><p>Connecting farmers and agricultural businesses across Pampanga and Mount Arayat.</p></div>
          <div><h3>Address</h3><p>6M67+94C, Magalang, Pampanga</p></div>
          <div><h3>Office Hours</h3><p>Monday–Friday: 8:00 AM–5:00 PM</p><p>Saturday–Sunday: Closed</p></div>
        </div>
        <div className="landing-copyright">© 2026 KAWING Agricultural Platform. All rights reserved.</div>
      </footer>
    </div>
  );
}
