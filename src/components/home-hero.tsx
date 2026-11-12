import Link from "next/link";

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function SignIcon() {
  return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false"><path d="M10 2.8 17.2 10 10 17.2 2.8 10Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
}

/** Illustrated road scene: sun, Rockies, Calgary skyline, highway and a speed sign. Decorative. */
function RoadScene() {
  return <svg className="hh-scene" viewBox="0 0 840 820" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="hh-arch"><path d="M0 400A420 400 0 0 1 840 400V788Q840 820 808 820H32Q0 820 0 788Z"/></clipPath>
    </defs>
    <g clipPath="url(#hh-arch)">
      <rect width="840" height="820" fill="#dce8e5"/>
      <circle cx="610" cy="262" r="122" fill="#f1c04f"/>
      {/* far range */}
      <path d="M0 470 120 392 230 438 330 360 430 430 520 380 610 230 700 330 760 290 840 352V560H0Z" fill="#b9d8cd"/>
      {/* main peak with snow cap */}
      <path d="M410 560 610 236 820 560Z" fill="#a3cbbd"/>
      <path d="M610 236 572 298 592 290 610 312 630 288 650 300Z" fill="#fff"/>
      <path d="M690 560 790 396 840 450V560Z" fill="#8cbcad"/>
      {/* foothills */}
      <path d="M0 520Q120 476 250 500T520 492Q680 470 840 500V590H0Z" fill="#8fbfae"/>
      {/* Calgary skyline */}
      <g fill="#2f5566">
        <rect x="104" y="472" width="26" height="62"/><rect x="134" y="452" width="20" height="82"/><rect x="158" y="480" width="22" height="54"/>
        <rect x="190" y="466" width="10" height="68"/><rect x="214" y="458" width="24" height="76"/><rect x="242" y="458" width="20" height="76"/>
        <rect x="266" y="462" width="22" height="72"/><rect x="292" y="470" width="20" height="64"/><rect x="316" y="476" width="18" height="58"/>
        <rect x="143" y="440" width="2" height="14"/>
      </g>
      <rect y="526" width="840" height="20" fill="#6fa894"/>
      <rect y="544" width="840" height="276" fill="#d3e5db"/>
      {/* highway */}
      <path d="M392 544H448L740 820H100Z" fill="#2b4a59"/>
      <path d="M398 546 150 820M442 546 690 820" stroke="#eef4ee" strokeWidth="6" fill="none"/>
      <g fill="#f1c04f">
        <path d="M418 560h4l1 18h-6Z"/><path d="M416 596h8l2 30h-12Z"/><path d="M413 650h14l3 46h-20Z"/><path d="M409 728h22l4 76h-30Z"/>
      </g>
      {/* pines */}
      <g fill="#2f6e5f">
        <path d="M60 640 92 560 124 640Z"/><path d="M50 676 92 586 134 676Z"/><rect x="88" y="676" width="7" height="30"/>
        <path d="M118 664 160 568 202 664Z"/><path d="M106 708 160 600 214 708Z"/><rect x="156" y="708" width="8" height="34"/>
      </g>
      {/* speed sign */}
      <rect x="762" y="650" width="7" height="190" fill="#1f3a48"/>
      <rect x="714" y="562" width="104" height="96" rx="12" fill="#fff" stroke="#123448" strokeWidth="6"/>
      <text x="766" y="592" textAnchor="middle" fontSize="15" fontWeight="800" letterSpacing="0.5" fill="#123448">MAXIMUM</text>
      <text x="766" y="640" textAnchor="middle" fontSize="44" fontWeight="900" fill="#123448">50</text>
    </g>
  </svg>;
}

export function HomeHero() {
  return <section className="home-hero" aria-labelledby="home-hero-title">
    <div className="page-width hh-grid">
      <div className="hh-copy">
        <p className="hh-chip"><span className="hh-chip-dot" aria-hidden="true"/>Calgary<span className="hh-chip-sep" aria-hidden="true">·</span><span className="sr-only">, </span>Alberta Class 7 learner&apos;s test</p>
        <h1 id="home-hero-title">Pass your knowledge test on the first try.</h1>
        <p className="hh-lead">Practise road signs, rules of the road and safe driving in the same multiple-choice format as Alberta&apos;s real Class&nbsp;7 test — so nothing on test day feels new.</p>
        <div className="hh-actions">
          <Link href="/practice" className="btn btn-primary hh-btn">Start a practice test <ArrowIcon/></Link>
          <Link href="/signs" className="btn btn-outline hh-btn"><SignIcon/> Study road signs</Link>
        </div>
        <dl className="hh-stats">
          <div><dt>questions on the real test</dt><dd>30</dd></div>
          <div><dt>correct answers to pass</dt><dd>25</dd></div>
          <div><dt>pass mark</dt><dd>83%</dd></div>
        </dl>
      </div>
      <div className="hh-visual" aria-hidden="true">
        <RoadScene/>
        <div className="hh-card hh-goal">
          <svg className="hh-ring" viewBox="0 0 44 44" width="56" height="56"><circle cx="22" cy="22" r="18" fill="none" stroke="#e3eeeb" strokeWidth="5"/><circle cx="22" cy="22" r="18" fill="none" stroke="#2f8b80" strokeWidth="5" strokeLinecap="round" strokeDasharray="94.2 113.1" transform="rotate(-90 22 22)"/></svg>
          <div><strong>25 / 30</strong><span>needed to pass</span></div>
        </div>
        <div className="hh-card hh-quiz">
          <div className="hh-quiz-top"><span>Question 12 of 30</span><span className="hh-dashes"><i className="on"/><i className="on"/><i/></span></div>
          <p className="hh-quiz-q">A flashing yellow light means…</p>
          <div className="hh-option"><span className="hh-letter">A</span>Stop and wait for green</div>
          <div className="hh-option is-picked"><span className="hh-check"><svg viewBox="0 0 16 16" width="14" height="14"><path d="M3.5 8.5 6.5 11.5 12.5 4.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>Proceed with caution</div>
        </div>
      </div>
    </div>
  </section>;
}
