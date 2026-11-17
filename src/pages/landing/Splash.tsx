import { IconCheck, IconDroplet, IconHeartHandshake, IconTruck } from '@tabler/icons-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import './landing.css';
import ThemeToggle from '../../components/ThemeToggle';
import { useApp } from '../../context/AppContext';
import baseIslandImage from '../../assets/images/land-without.png';
import kawingLogo from '../../assets/images/kawing_logo_new_1784129186773.jpg';
import revealIslandImage from '../../assets/images/ratatatatata.nbg.png';

interface SplashProps { onComplete: () => void; }

export default function Splash({ onComplete }: SplashProps) {
  const { lang } = useApp();
  const heroRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: -999, y: -999 });
  const [activeFact, setActiveFact] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const facts = [
    { icon: <IconHeartHandshake size={24} stroke={2} aria-hidden="true" />, category: lang === 'en' ? 'Better Market Access' : 'Mas Malawak na Pamilihan', title: lang === 'en' ? 'Bring Your Harvest Directly to Buyers' : 'Direktang I-alok ang Iyong Ani sa mga Mamimili', description: lang === 'en' ? 'Post palay and compare offers from verified buyers.' : 'I-post ang palay at ihambing ang mga alok mula sa beripikadong mamimili.', result: lang === 'en' ? 'Clearer choices and stronger market connections' : 'Mas malinaw na pagpipilian at ugnayan sa pamilihan' },
    { icon: <IconDroplet size={24} stroke={2} aria-hidden="true" />, category: 'PalaySense', title: lang === 'en' ? 'Know Your Palay Before You Negotiate' : 'Alamin ang Kalagayan ng Palay Bago Makipag-usap', description: lang === 'en' ? 'Use fresh moisture readings to plan drying and set your price.' : 'Gamitin ang bagong sukat ng moisture para magplano ng pagpapatuyo at presyo.', result: lang === 'en' ? 'Make better-informed decisions about moisture' : 'Mas may batayang pagpapasya tungkol sa moisture' },
    { icon: <IconTruck size={24} stroke={2} aria-hidden="true" />, category: lang === 'en' ? 'Farm Services' : 'Serbisyo sa Sakahan', title: lang === 'en' ? 'Arrange Post-Harvest Support in One Place' : 'Maghanap ng Serbisyo Pagkatapos ng Anihan', description: lang === 'en' ? 'Find approved hauling, drying, storage, and milling providers.' : 'Maghanap ng beripikadong tagahatid, patuyuan, imbakan, at gilingan.', result: lang === 'en' ? 'Find essential farm services in one place' : 'Hanapin sa iisang lugar ang mahahalagang serbisyo sa sakahan' },
    { icon: '₱', category: lang === 'en' ? 'Production Support' : 'Suporta sa Produksyon', title: lang === 'en' ? 'Prepare for the Next Production Cycle' : 'Maghanda para sa Susunod na Panahon ng Pagtatanim', description: lang === 'en' ? 'Review available production support, terms, and requirements before deciding.' : 'Suriin ang suporta, mga tuntunin, at kailangan bago magpasya.', result: lang === 'en' ? 'Clear terms for farm production support' : 'Malinaw na mga tuntunin para sa suporta sa sakahan' },
  ];
  const copy = lang === 'en'
    ? { enter: 'CLICK ANYWHERE TO ENTER KAWING', discover: 'Discover KAWING', how: 'How KAWING helps', heading: 'From harvest to market, connected at every step.', subheading: 'Farm tools, opportunities, and trusted services in one place.', benefits: 'KAWING benefits', pause: 'Pause', play: 'Play', previous: 'Previous benefit', next: 'Next benefit', connecting: 'Connecting Pampanga’s farmers to trusted buyers, reliable services, and better opportunities.', address: 'Address', office: 'Office Hours', weekdays: 'Monday–Friday: 8:00 AM–5:00 PM', weekends: 'Saturday–Sunday: Closed', rights: '© 2026 KAWING Agricultural Platform. All rights reserved.', disclaimer: 'KAWING only connects farmers, buyers, and delivery or service providers. All deals are made between the users.' }
    : { enter: 'I-CLICK KAHIT SAAN PARA PUMASOK SA KAWING', discover: 'Kilalanin ang KAWING', how: 'Paano nakatutulong ang KAWING', heading: 'Magkakaugnay ang bawat hakbang mula anihan hanggang pamilihan.', subheading: 'Mga kagamitan, oportunidad, at mapagkakatiwalaang serbisyo para sa sakahan.', benefits: 'Mga benepisyo ng KAWING', pause: 'I-pause', play: 'I-play', previous: 'Nakaraang benepisyo', next: 'Susunod na benepisyo', connecting: 'Iniuugnay ang mga magsasaka ng Pampanga sa mapagkakatiwalaang mamimili, serbisyo, at mas maraming oportunidad.', address: 'Address', office: 'Oras ng Opisina', weekdays: 'Lunes–Biyernes: 8:00 AM–5:00 PM', weekends: 'Sabado–Linggo: Sarado', rights: '© 2026 KAWING Agricultural Platform. Lahat ng karapatan ay nakalaan.', disclaimer: 'Iniuugnay lamang ng KAWING ang mga magsasaka, mamimili, at tagapaghatid o tagapagbigay ng serbisyo. Ang mga kasunduan ay direkta sa pagitan ng mga gumagamit.' };

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
    <div className={`kawing-landing landing-overdrive ${isExiting ? 'is-exiting' : ''}`}>
      <section ref={heroRef} className="landing-hero" onClick={enterKawing} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
        <ThemeToggle variant="landing" />
        <div className="landing-wordmark" aria-label="KAWING"><span>KA</span><span>WING</span></div>
        <div className="landing-image landing-image-base" style={{ backgroundImage: `url(${baseIslandImage})` }} aria-hidden="true" />
        <div ref={revealRef} className="landing-image landing-image-reveal" style={{ backgroundImage: `url(${revealIslandImage})` }} aria-hidden="true" />
        <div className="landing-hero-vignette" aria-hidden="true" />
        <div className="landing-hero-actions">
          <button type="button" className="landing-enter"><span /> {copy.enter}</button>
          <a href="#kawing-benefits" className="landing-scroll-link" onClick={(event) => event.stopPropagation()}>{copy.discover} <ChevronDown /></a>
        </div>
      </section>

      <main id="kawing-benefits" className="landing-info">
        <div className="landing-info-inner">
          <header className="landing-info-header"><span>{copy.how}</span><h2>{copy.heading}</h2><p>{copy.subheading}</p></header>
          <div className="landing-tabs" role="tablist" aria-label={copy.benefits}>
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
            <button type="button" onClick={() => setAutoplay((value) => !value)}>{autoplay ? <Pause /> : <Play />}{autoplay ? copy.pause : copy.play}</button>
            <div><button type="button" aria-label={copy.previous} onClick={() => setActiveFact((activeFact - 1 + facts.length) % facts.length)}><ChevronLeft /></button><button type="button" aria-label={copy.next} onClick={() => setActiveFact((activeFact + 1) % facts.length)}><ChevronRight /></button></div>
          </div>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div className="landing-footer-brand"><img src={kawingLogo} alt="KAWING" /><p>{copy.connecting}</p></div>
          <div><h3>{copy.address}</h3><p>6M67+94C, Magalang, Pampanga</p></div>
          <div><h3>{copy.office}</h3><p>{copy.weekdays}</p><p>{copy.weekends}</p></div>
        </div>
        <div className="landing-copyright">{copy.rights}</div>
        <p className="landing-disclaimer">{copy.disclaimer}</p>
      </footer>
    </div>
  );
}
