import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Bell,
  Bluetooth,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  FileText,
  HeartPulse,
  Languages,
  MapPin,
  Menu,
  MoreHorizontal,
  Play,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  ClipboardList,
  Stethoscope,
  UserRound,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { type Language, type TFn, createT, LangContext, useT, languageNames } from '@/i18n';

type Screen = 'login' | 'dashboard' | 'register' | 'consent' | 'screening' | 'result' | 'pdf' | 'sync';
type Step = 'questionnaire' | 'sensor' | 'gait' | 'review';
type SyncStatus = 'synced' | 'pending' | 'failed';

type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  village: string;
  statusKey: string;
  risk: 'Low' | 'Moderate' | 'High';
  sync: SyncStatus;
  updated: string;
};

const patients: Patient[] = [
  { id: 'ASHA-2407', name: 'Jahnu Barua', age: 62, gender: 'F', village: 'Kamrup Metropolitan', statusKey: 'patient.status.referred', risk: 'High', sync: 'synced', updated: 'Today, 10:42 AM' },
  { id: 'ASHA-2406', name: 'Mitali Das', age: 54, gender: 'F', village: 'Beltola', statusKey: 'patient.status.in_progress', risk: 'Moderate', sync: 'pending', updated: 'Today, 9:18 AM' },
  { id: 'ASHA-2405', name: 'Ranjit Kalita', age: 48, gender: 'M', village: 'Sonapur', statusKey: 'patient.status.registered', risk: 'Low', sync: 'synced', updated: 'Yesterday' },
  { id: 'ASHA-2404', name: 'Anima Devi', age: 70, gender: 'F', village: 'Dispur', statusKey: 'patient.status.report_ready', risk: 'Moderate', sync: 'failed', updated: 'Yesterday' },
];

const questionKeys = [
  { key: 'walking', icon: Activity },
  { key: 'stairs', icon: ArrowRight },
  { key: 'morning', icon: RotateCcw },
  { key: 'grinding', icon: ClipboardList },
  { key: 'rising', icon: ArrowRight },
];

const ratingKeys = ['q.rating.none', 'q.rating.mild', 'q.rating.moderate', 'q.rating.severe', 'q.rating.extreme'];

function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [language, setLanguage] = useState<Language>('en');
  const [workerName, setWorkerName] = useState('Rina Das');
  const [networkOnline, setNetworkOnline] = useState(true);
  const [syncCount, setSyncCount] = useState(2);
  const [menuOpen, setMenuOpen] = useState(false);
  const [patient, setPatient] = useState({ name: '', age: '', gender: 'Female', phone: '', district: 'Kamrup Metropolitan', state: 'Assam' });
  const [consent, setConsent] = useState(false);
  const [signature, setSignature] = useState(false);
  const [step, setStep] = useState<Step>('questionnaire');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [sensorState, setSensorState] = useState<'idle' | 'scanning' | 'connected'>('idle');
  const [recording, setRecording] = useState(false);
  const [toast, setToast] = useState('');

  const t = useMemo(() => createT(language), [language]);

  const score = useMemo(() => {
    const total = Object.values(answers).reduce((sum, value) => sum + value, 0);
    return Math.min(98, Math.round((total / 20) * 100 + (recording ? 3 : 0)));
  }, [answers, recording]);

  const riskKey = score >= 65 ? 'result.risk.high' : score >= 35 ? 'result.risk.moderate' : 'result.risk.low';
  const high = riskKey === 'result.risk.high';

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const startScreening = () => {
    if (!patient.name) {
      setPatient((current) => ({ ...current, name: 'Jahnu Barua', age: '62' }));
    }
    setConsent(false);
    setSignature(false);
    setScreen('consent');
  };

  const registerPatient = () => {
    if (!patient.name || !patient.age) {
      showToast(t('toast.name_age'));
      return;
    }
    setScreen('consent');
  };

  const openSync = () => setScreen('sync');

  if (screen === 'login') {
    return (
      <LangContext.Provider value={t}>
        <LoginScreen workerName={workerName} setWorkerName={setWorkerName} onContinue={() => setScreen('dashboard')} language={language} setLanguage={setLanguage} />
      </LangContext.Provider>
    );
  }

  return (
    <LangContext.Provider value={t}>
      <div className="app-shell">
        <TopBar workerName={workerName} networkOnline={networkOnline} syncCount={syncCount} onSync={openSync} onMenu={() => setMenuOpen((open) => !open)} menuOpen={menuOpen} />
        {menuOpen && <QuickMenu onNavigate={(next) => { setMenuOpen(false); setScreen(next); }} />}
        {screen === 'dashboard' && <Dashboard onNewPatient={startScreening} onRegister={() => setScreen('register')} onSync={openSync} />}
        {screen === 'register' && <RegisterScreen patient={patient} setPatient={setPatient} onBack={() => setScreen('dashboard')} onContinue={registerPatient} language={language} />}
        {screen === 'consent' && <ConsentScreen patient={patient} consent={consent} setConsent={setConsent} signature={signature} setSignature={setSignature} onBack={() => setScreen('register')} onContinue={() => setScreen('screening')} language={language} />}
        {screen === 'screening' && <ScreeningScreen step={step} setStep={setStep} answers={answers} setAnswers={setAnswers} sensorState={sensorState} setSensorState={setSensorState} recording={recording} setRecording={setRecording} patient={patient} onResult={() => setScreen('result')} onBack={() => setScreen('consent')} />}
        {screen === 'result' && <ResultScreen patient={patient} score={score} riskKey={riskKey} high={high} onPdf={() => setScreen('pdf')} onDashboard={() => { setScreen('dashboard'); setSyncCount((count) => count + 1); }} />}
        {screen === 'pdf' && <PdfScreen patient={patient} score={score} riskKey={riskKey} onBack={() => setScreen('result')} />}
        {screen === 'sync' && <SyncScreen networkOnline={networkOnline} setNetworkOnline={setNetworkOnline} syncCount={syncCount} setSyncCount={setSyncCount} onBack={() => setScreen('dashboard')} />}
        <MobileNav screen={screen} setScreen={setScreen} />
        {toast && <div className="toast"><CheckCircle2 size={18} />{toast}</div>}
      </div>
    </LangContext.Provider>
  );
}

function LoginScreen({ workerName, setWorkerName, onContinue, language, setLanguage }: { workerName: string; setWorkerName: (value: string) => void; onContinue: () => void; language: Language; setLanguage: (value: Language) => void }) {
  const t = useT();
  const [pin, setPin] = useState('');
  return (
    <div className="login-page">
      <div className="login-decoration decoration-one" /><div className="login-decoration decoration-two" />
      <div className="login-card">
        <div className="brand-mark"><HeartPulse size={27} strokeWidth={2.4} /></div>
        <div className="eyebrow">{t('login.eyebrow')}</div>
        <h1>{t('login.greeting_prefix')}<br /><span>{t('login.greeting_highlight')}</span></h1>
        <p className="muted login-copy">{t('login.copy')}</p>
        <div className="language-toggle"><Languages size={17} /><select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>{(Object.keys(languageNames) as Language[]).map((lang) => <option key={lang} value={lang}>{languageNames[lang]}</option>)}</select></div>
        <label className="field-label">{t('login.worker_name')}<input value={workerName} onChange={(event) => setWorkerName(event.target.value)} placeholder={t('login.name_placeholder')} /></label>
        <label className="field-label">{t('login.pin')}<div className="pin-input"><input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="••••" type="password" /><ShieldCheck size={19} /></div></label>
        <button className="button primary full" onClick={onContinue}>{t('login.open_workspace')} <ArrowRight size={19} /></button>
        <div className="secure-note"><WifiOff size={15} /> {t('login.secure_note')}</div>
      </div>
      <div className="login-footer"><span>{t('login.footer_pilot')}</span><span>{t('login.footer_version')}</span></div>
    </div>
  );
}

function TopBar({ workerName, networkOnline, syncCount, onSync, onMenu, menuOpen }: { workerName: string; networkOnline: boolean; syncCount: number; onSync: () => void; onMenu: () => void; menuOpen: boolean }) {
  const t = useT();
  return (
    <header className="topbar">
      <div className="topbar-brand"><div className="tiny-brand"><HeartPulse size={18} /></div><div><strong>{t('topbar.brand')}</strong><span>{t('topbar.tagline')}</span></div></div>
      <div className="topbar-actions">
        <button className={`network-pill ${networkOnline ? 'online' : 'offline'}`} onClick={onSync}>{networkOnline ? <Wifi size={15} /> : <WifiOff size={15} />}<span>{networkOnline ? t('topbar.online') : t('topbar.offline')}</span>{syncCount > 0 && <b>{syncCount}</b>}</button>
        <button className="icon-button notification" aria-label="Notifications"><Bell size={19} /><i /></button>
        <button className="profile-chip" onClick={onMenu}><span className="avatar">RD</span><span className="profile-name">{workerName}</span><ChevronRight size={16} className={menuOpen ? 'rotate-90' : ''} /></button>
      </div>
      <button className="mobile-menu" onClick={onMenu}><Menu size={22} /></button>
    </header>
  );
}

function QuickMenu({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const t = useT();
  return (
    <div className="quick-menu">
      <button onClick={() => onNavigate('sync')}><RefreshCw size={17} /> {t('menu.sync')}</button>
      <button onClick={() => onNavigate('dashboard')}><Users size={17} /> {t('menu.directory')}</button>
      <button onClick={() => onNavigate('login')}><X size={17} /> {t('menu.signout')}</button>
    </div>
  );
}

function Dashboard({ onNewPatient, onRegister, onSync }: { onNewPatient: () => void; onRegister: () => void; onSync: () => void }) {
  const t = useT();
  return (
    <main className="page dashboard-page">
      <div className="welcome-row">
        <div><div className="eyebrow">{t('dash.date')}</div><h2>{t('dash.greeting')} <span>•</span></h2><p className="muted">{t('dash.subtitle')}</p></div>
        <button className="button soft" onClick={onSync}><RefreshCw size={17} /> {t('dash.check_sync')}</button>
      </div>
      <section className="hero-card">
        <div>
          <span className="hero-kicker"><HeartPulse size={15} /> {t('dash.focus')}</span>
          <h3>{t('dash.hero_title_1')}<br />{t('dash.hero_title_2')}</h3>
          <p>{t('dash.hero_copy')}</p>
          <button className="button white" onClick={onNewPatient}>{t('dash.new_screening')} <ArrowRight size={18} /></button>
        </div>
        <div className="hero-illustration"><div className="sun-orb" /><div className="person-art"><div className="head" /><div className="body" /><div className="leg leg-back" /><div className="leg leg-front" /><div className="knee-dot" /></div><div className="leaf leaf-one" /><div className="leaf leaf-two" /></div>
      </section>
      <div className="stats-grid">
        <StatCard icon={<Users />} label={t('dash.stat_screenings')} value="03" note={t('dash.stat_screenings_note')} color="blue" />
        <StatCard icon={<HeartPulse />} label={t('dash.stat_risk')} value="01" note={t('dash.stat_risk_note')} color="coral" />
        <StatCard icon={<Cloud />} label={t('dash.stat_sync')} value="02" note={t('dash.stat_sync_note')} color="amber" />
      </div>
      <section className="directory-section">
        <div className="section-heading"><div><div className="eyebrow">{t('dash.directory')}</div><h3>{t('dash.recent')}</h3></div><button className="text-button" onClick={onRegister}>{t('dash.register')} <ArrowRight size={16} /></button></div>
        <div className="search-field"><Search size={17} /><input placeholder={t('dash.search_placeholder')} /></div>
        <div className="patient-list">{patients.slice(0, 3).map((item) => <PatientRow key={item.id} patient={item} />)}</div>
        <button className="button outlined full directory-button" onClick={onRegister}>{t('dash.view_directory')} <ChevronRight size={17} /></button>
      </section>
    </main>
  );
}

function StatCard({ icon, label, value, note, color }: { icon: React.ReactNode; label: string; value: string; note: string; color: string }) {
  return <div className={`stat-card ${color}`}><div className="stat-icon">{icon}</div><div><div className="stat-label">{label}</div><strong>{value}</strong><small>{note}</small></div></div>;
}

function PatientRow({ patient }: { patient: Patient }) {
  const t = useT();
  const initials = patient.name.split(' ').map((part) => part[0]).join('').slice(0, 2);
  return (
    <div className="patient-row">
      <div className="patient-avatar">{initials}</div>
      <div className="patient-info"><strong>{patient.name}</strong><span>{patient.age} {t('patient.yrs')} • {patient.gender} • {patient.village}</span></div>
      <div className="patient-status"><span className={`status-dot ${patient.risk.toLowerCase()}`} /><span className={`risk-text ${patient.risk.toLowerCase()}`}>{t(patient.statusKey)}</span></div>
      <div className="row-sync">{patient.sync === 'synced' ? <CheckCircle2 size={16} /> : patient.sync === 'pending' ? <RefreshCw size={16} /> : <Cloud size={16} />}</div>
      <ChevronRight size={17} className="row-arrow" />
    </div>
  );
}

function RegisterScreen({ patient, setPatient, onBack, onContinue, language }: { patient: { name: string; age: string; gender: string; phone: string; district: string; state: string }; setPatient: React.Dispatch<React.SetStateAction<{ name: string; age: string; gender: string; phone: string; district: string; state: string }>>; onBack: () => void; onContinue: () => void; language: Language }) {
  const t = useT();
  const langName = languageNames[language];
  return (
    <main className="page form-page">
      <BackHeader title={t('reg.title')} subtitle={t('reg.subtitle')} onBack={onBack} />
      <div className="progress-line"><span className="active" /><span /><span /><span /></div>
      <section className="form-card">
        <div className="form-intro"><div className="step-number">01</div><div><div className="eyebrow">{t('reg.profile')}</div><h2>{t('reg.heading')}</h2><p className="muted">{t('reg.copy')}</p></div></div>
        <div className="form-grid">
          <label className="field-label wide">{t('reg.full_name')}<input value={patient.name} onChange={(event) => setPatient((current) => ({ ...current, name: event.target.value }))} placeholder={t('reg.name_placeholder')} /></label>
          <label className="field-label">{t('reg.age')}<input value={patient.age} onChange={(event) => setPatient((current) => ({ ...current, age: event.target.value.replace(/\D/g, '').slice(0, 3) }))} inputMode="numeric" placeholder={t('reg.age_placeholder')} /></label>
          <label className="field-label">{t('reg.gender')}<select value={patient.gender} onChange={(event) => setPatient((current) => ({ ...current, gender: event.target.value }))}><option>{t('reg.female')}</option><option>{t('reg.male')}</option><option>{t('reg.other')}</option></select></label>
          <label className="field-label wide">{t('reg.phone')} <span className="optional">{t('reg.optional')}</span><input value={patient.phone} onChange={(event) => setPatient((current) => ({ ...current, phone: event.target.value }))} inputMode="tel" placeholder={t('reg.phone_placeholder')} /></label>
          <label className="field-label">{t('reg.district')}<select value={patient.district} onChange={(event) => setPatient((current) => ({ ...current, district: event.target.value }))}><option>Kamrup Metropolitan</option><option>Kamrup</option><option>Dibrugarh</option><option>Sonitpur</option></select></label>
          <label className="field-label">{t('reg.state')}<select value={patient.state} onChange={(event) => setPatient((current) => ({ ...current, state: event.target.value }))}><option>Assam</option><option>Meghalaya</option><option>Nagaland</option></select></label>
        </div>
        <div className="language-callout"><Languages size={18} /><div><strong>{t('reg.patient_lang')}</strong><span>{t('reg.lang_note', { lang: langName })}</span></div><ChevronRight size={17} /></div>
      </section>
      <div className="bottom-actions"><button className="button ghost" onClick={onBack}><ArrowLeft size={17} /> {t('reg.back')}</button><button className="button primary" onClick={onContinue}>{t('reg.continue')} <ArrowRight size={18} /></button></div>
    </main>
  );
}

function BackHeader({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return <div className="back-header"><button className="icon-button" onClick={onBack}><ArrowLeft size={20} /></button><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button"><MoreHorizontal size={20} /></button></div>;
}

function ConsentScreen({ patient, consent, setConsent, signature, setSignature, onBack, onContinue, language }: { patient: { name: string; age: string }; consent: boolean; setConsent: (value: boolean) => void; signature: boolean; setSignature: (value: boolean) => void; onBack: () => void; onContinue: () => void; language: Language }) {
  const t = useT();
  const langName = languageNames[language];
  return (
    <main className="page form-page">
      <BackHeader title={t('consent.title')} subtitle={t('consent.subtitle')} onBack={onBack} />
      <div className="progress-line"><span className="active" /><span className="active" /><span /><span /></div>
      <section className="consent-card">
        <div className="consent-icon"><ShieldCheck size={28} /></div>
        <div className="eyebrow">{t('consent.digital')}</div>
        <h2>{t('consent.heading')}</h2>
        <p className="consent-lead">{t('consent.lead', { lang: langName })}</p>
        <div className="consent-copy">
          <p>{t('consent.body_1_before')}<strong>{patient.name || t('patient.the_patient')}{t('consent.body_1_after')}</strong></p>
          <p>{t('consent.body_2')}</p>
        </div>
        <label className={`check-row ${consent ? 'checked' : ''}`}><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span className="fake-check"><Check size={15} /></span><span>{t('consent.agree')}</span></label>
        <div className="signature-box" onClick={() => setSignature(!signature)}>
          <div className="signature-title"><span>{t('consent.signature')}</span><small>{t('consent.tap_sign')}</small></div>
          <div className={`signature-pad ${signature ? 'signed' : ''}`}>{signature ? <span>Jahnu B.</span> : <span className="signature-placeholder">{t('consent.draw_here')}</span>}</div>
          <button className="clear-signature" onClick={(event) => { event.stopPropagation(); setSignature(false); }}><RotateCcw size={14} /> {t('consent.clear')}</button>
        </div>
        <div className="consent-meta"><span><CheckCircle2 size={15} /> {t('consent.timestamp')}</span><span><WifiOff size={15} /> {t('consent.offline_safe')}</span></div>
      </section>
      <div className="bottom-actions"><button className="button ghost" onClick={onBack}><ArrowLeft size={17} /> {t('reg.back')}</button><button className="button primary" disabled={!consent || !signature} onClick={onContinue}>{t('consent.save_start')} <ArrowRight size={18} /></button></div>
    </main>
  );
}

function ScreeningScreen({ step, setStep, answers, setAnswers, sensorState, setSensorState, recording, setRecording, patient, onResult, onBack }: { step: Step; setStep: (step: Step) => void; answers: Record<string, number>; setAnswers: React.Dispatch<React.SetStateAction<Record<string, number>>>; sensorState: 'idle' | 'scanning' | 'connected'; setSensorState: (value: 'idle' | 'scanning' | 'connected') => void; recording: boolean; setRecording: (value: boolean) => void; patient: { name: string }; onResult: () => void; onBack: () => void }) {
  const t = useT();
  const steps: { key: Step; labelKey: string }[] = [
    { key: 'questionnaire', labelKey: 'screen.step_q' },
    { key: 'sensor', labelKey: 'screen.step_s' },
    { key: 'gait', labelKey: 'screen.step_w' },
    { key: 'review', labelKey: 'screen.step_r' },
  ];
  const currentIndex = steps.findIndex((item) => item.key === step);
  const next = () => { if (step === 'questionnaire') setStep('sensor'); else if (step === 'sensor') setStep('gait'); else if (step === 'gait') setStep('review'); else onResult(); };
  return (
    <main className="page screening-page">
      <BackHeader title={t('screen.title')} subtitle={`${patient.name || t('patient.the_patient')} • ${t('screen.guided')}`} onBack={onBack} />
      <div className="stepper">{steps.map((item, index) => <button key={item.key} className={`${index <= currentIndex ? 'active' : ''} ${index === currentIndex ? 'current' : ''}`} onClick={() => index <= currentIndex && setStep(item.key)}><span>{index < currentIndex ? <Check size={14} /> : index + 1}</span>{t(item.labelKey)}</button>)}</div>
      {step === 'questionnaire' && <Questionnaire answers={answers} setAnswers={setAnswers} />}
      {step === 'sensor' && <SensorCapture sensorState={sensorState} setSensorState={setSensorState} />}
      {step === 'gait' && <GaitCapture recording={recording} setRecording={setRecording} />}
      {step === 'review' && <ReviewStep answers={answers} sensorState={sensorState} recording={recording} />}
      <div className="bottom-actions screening-actions">
        <button className="button ghost" onClick={() => currentIndex === 0 ? onBack() : setStep(steps[currentIndex - 1].key)}><ArrowLeft size={17} /> {t('reg.back')}</button>
        <button className="button primary" disabled={step === 'questionnaire' && Object.keys(answers).length < questionKeys.length} onClick={next}>{step === 'review' ? t('screen.run') : t('screen.continue')} <ArrowRight size={18} /></button>
      </div>
    </main>
  );
}

function Questionnaire({ answers, setAnswers }: { answers: Record<string, number>; setAnswers: React.Dispatch<React.SetStateAction<Record<string, number>>> }) {
  const t = useT();
  return (
    <section className="screening-content">
      <div className="section-heading"><div><div className="eyebrow">{t('q.womac')}</div><h2>{t('q.heading')}</h2><p className="muted">{t('q.copy')}</p></div><div className="question-count">{Object.keys(answers).length}<span>/ {questionKeys.length}</span></div></div>
      <div className="question-list">{questionKeys.map((q) => { const Icon = q.icon; return (
        <div className="question-card" key={q.key}>
          <div className="question-title"><div className="question-icon"><Icon size={19} /></div><div><strong>{t(`q.${q.key}.label`)}</strong><span>{t(`q.${q.key}.hint`)}</span></div></div>
          <div className="rating-grid">{ratingKeys.map((rk, index) => <button key={rk} className={answers[q.key] === index ? 'selected' : ''} onClick={() => setAnswers((current) => ({ ...current, [q.key]: index }))}><span>{index}</span><small>{t(rk)}</small></button>)}</div>
        </div>
      ); })}</div>
      <div className="helper-card"><ClipboardList size={18} /><span>{t('q.helper')}</span></div>
    </section>
  );
}

function SensorCapture({ sensorState, setSensorState }: { sensorState: 'idle' | 'scanning' | 'connected'; setSensorState: (value: 'idle' | 'scanning' | 'connected') => void }) {
  const t = useT();
  return (
    <section className="screening-content">
      <div className="eyebrow">{t('sensor.eyebrow')}</div>
      <h2>{t('sensor.heading')}</h2>
      <p className="muted intro-copy">{t('sensor.copy')}</p>
      <div className={`sensor-visual ${sensorState}`}><div className="sensor-radar" /><div className="sensor-device"><Bluetooth size={31} /><span>IMU</span></div><div className="signal signal-one" /><div className="signal signal-two" /></div>
      {sensorState === 'connected' ? (
        <div className="connected-card"><div className="connected-check"><Check size={19} /></div><div><strong>{t('sensor.connected')}</strong><span><BatteryCharging size={14} /> {t('sensor.battery')}</span></div><span className="live-pill">LIVE</span></div>
      ) : (
        <div className="sensor-actions"><p>{sensorState === 'scanning' ? t('sensor.scanning_msg') : t('sensor.idle_msg')}</p><button className="button primary" onClick={() => { setSensorState('scanning'); window.setTimeout(() => setSensorState('connected'), 1700); }}>{sensorState === 'scanning' ? <><RefreshCw className="spin" size={18} /> {t('sensor.scanning_btn')}</> : <><Bluetooth size={18} /> {t('sensor.connect_btn')}</>}</button></div>
      )}
      <div className="tip-row"><ShieldCheck size={17} /><span>{t('sensor.tip')}</span></div>
    </section>
  );
}

function GaitCapture({ recording, setRecording }: { recording: boolean; setRecording: (value: boolean) => void }) {
  const t = useT();
  return (
    <section className="screening-content">
      <div className="eyebrow">{t('gait.eyebrow')}</div>
      <h2>{t('gait.heading')}</h2>
      <p className="muted intro-copy">{t('gait.copy')}</p>
      <div className="gait-stage"><div className="floor-line" /><div className="walk-person"><div className="walk-head" /><div className="walk-body" /><div className="walk-leg left" /><div className="walk-leg right" /></div><div className="pose-line pose-a" /><div className="pose-line pose-b" /><div className="camera-frame"><span /><span /><span /><span /></div><div className="camera-label"><Activity size={17} /> {t('gait.simulated')}</div></div>
      {recording ? (
        <div className="recording-panel"><div className="recording-time">00:08</div><div className="recording-wave"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><span>{t('gait.capturing')}</span></div>
      ) : (
        <button className="button primary center-button" onClick={() => { setRecording(true); window.setTimeout(() => setRecording(false), 2800); }}><Play size={18} fill="currentColor" /> {t('gait.start')}</button>
      )}
      <div className="metric-preview"><Metric label={t('gait.stride')} value="—" note={t('gait.waiting')} /><Metric label={t('gait.speed')} value="—" note={t('gait.ms')} /><Metric label={t('gait.cadence')} value="—" note={t('gait.steps')} /></div>
    </section>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }

function ReviewStep({ answers, sensorState, recording }: { answers: Record<string, number>; sensorState: string; recording: boolean }) {
  const t = useT();
  const totalPoints = Object.values(answers).reduce((a, b) => a + b, 0);
  return (
    <section className="screening-content">
      <div className="eyebrow">{t('review.eyebrow')}</div>
      <h2>{t('review.heading')}</h2>
      <p className="muted intro-copy">{t('review.copy')}</p>
      <div className="review-grid">
        <ReviewTile icon={<Activity />} label={t('review.q')} value={t('review.points', { count: String(totalPoints) })} status={t('review.complete')} />
        <ReviewTile icon={<Bluetooth />} label={t('review.sensor')} value={t('review.readings')} status={sensorState === 'connected' ? t('review.connected') : t('review.check_sensor')} />
        <ReviewTile icon={<Stethoscope />} label={t('review.gait')} value={recording ? t('review.captured') : t('review.ready_record')} status={t('review.complete')} />
      </div>
      <div className="review-note"><ShieldCheck size={20} /><div><strong>{t('review.private_title')}</strong><span>{t('review.private_copy')}</span></div></div>
    </section>
  );
}

function ReviewTile({ icon, label, value, status }: { icon: React.ReactNode; label: string; value: string; status: string }) {
  return <div className="review-tile"><div className="review-tile-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small><CheckCircle2 size={14} /> {status}</small></div><ChevronRight size={17} /></div>;
}

function ResultScreen({ patient, score, riskKey, high, onPdf, onDashboard }: { patient: { name: string; age: string; district: string }; score: number; riskKey: string; high: boolean; onPdf: () => void; onDashboard: () => void }) {
  const t = useT();
  return (
    <main className="page result-page">
      <div className="result-top"><div><div className="eyebrow">{t('result.eyebrow')}</div><h2>{patient.name || t('result.default_name')}{t('result.snapshot_suffix')}</h2><p className="muted">{t('result.disclaimer')}</p></div><button className="button soft" onClick={onDashboard}><ArrowLeft size={16} /> {t('result.directory')}</button></div>
      <section className={`risk-hero ${high ? 'high' : ''}`}>
        <div className="gauge"><div className="gauge-inner"><strong>{score}<small>%</small></strong><span>{t('result.risk_score')}</span></div></div>
        <div className="risk-summary">
          <span className={`risk-badge ${high ? 'high' : 'moderate'}`}><span />{t(riskKey)}</span>
          <h3>{high ? t('result.high_heading') : t('result.low_heading')}</h3>
          <p>{high ? t('result.high_copy') : t('result.low_copy')}</p>
        </div>
        <div className="result-meta"><span><UserRound size={15} /> {patient.age || '62'} {t('result.years')} • {t('result.female')}</span><span><MapPin size={15} /> {patient.district || 'Kamrup Metropolitan'}</span></div>
      </section>
      <section className="result-columns">
        <div className="explain-card">
          <div className="section-heading"><div><div className="eyebrow">{t('result.key_findings')}</div><h3>{t('result.factors_heading')}</h3></div><ClipboardList size={20} /></div>
          <p className="muted">{t('result.factors_copy')}</p>
          <div className="factor-list">
            <Factor name={t('result.factor.stairs')} value={t('result.factor.stairs_val')} width="84%" direction="increases" />
            <Factor name={t('result.factor.rom')} value={t('result.factor.rom_val')} width="61%" direction="increases" />
            <Factor name={t('result.factor.stride')} value={t('result.factor.stride_val')} width="32%" direction="decreases" />
          </div>
        </div>
        <div className="referral-card">
          <div className="referral-icon"><MapPin size={21} /></div>
          <div className="eyebrow">{t('result.referral')}</div>
          <h3>{t('result.phc')}</h3>
          <p>{t('result.referral_copy')}</p>
          <span className="priority"><span /> {t('result.priority')}</span>
        </div>
      </section>
      <section className="advice-card">
        <div className="advice-heading"><div className="advice-icon"><HeartPulse size={20} /></div><div><div className="eyebrow">{t('result.advice')}</div><h3>{t('result.advice_heading')}</h3></div></div>
        <div className="advice-list">
          <Advice number="01" title={t('result.advice1_title')} text={t('result.advice1_text')} />
          <Advice number="02" title={t('result.advice2_title')} text={t('result.advice2_text')} />
          <Advice number="03" title={t('result.advice3_title')} text={t('result.advice3_text')} />
        </div>
      </section>
      <div className="bottom-actions result-actions">
        <button className="button outlined" onClick={onPdf}><FileText size={18} /> {t('result.generate_pdf')}</button>
        <button className="button primary" onClick={onDashboard}>{t('result.save_dashboard')} <ArrowRight size={18} /></button>
      </div>
    </main>
  );
}

function Factor({ name, value, width, direction }: { name: string; value: string; width: string; direction: string }) {
  const t = useT();
  return <div className="factor"><div><strong>{name}</strong><span>{direction === 'increases' ? '↑' : '↓'} {value}</span></div><div className="factor-track"><i style={{ width }} /></div></div>;
}

function Advice({ number, title, text }: { number: string; title: string; text: string }) {
  return <div><span className="advice-number">{number}</span><div><strong>{title}</strong><p>{text}</p></div><CheckCircle2 size={18} /></div>;
}

function PdfScreen({ patient, score, riskKey, onBack }: { patient: { name: string; age: string; district: string }; score: number; riskKey: string; onBack: () => void }) {
  const t = useT();
  return (
    <main className="page pdf-page">
      <BackHeader title={t('pdf.title')} subtitle={t('pdf.subtitle')} onBack={onBack} />
      <div className="pdf-toolbar"><span><FileText size={17} /> {t('pdf.toolbar')}</span><div><button className="icon-button"><Printer size={18} /></button><button className="button outlined"><Send size={16} /> {t('pdf.share')}</button></div></div>
      <article className="report-paper">
        <div className="report-header"><div className="report-logo"><HeartPulse size={22} /> {t('topbar.brand')}</div><span>{t('pdf.report_title')}<br /><small>{t('pdf.generated')}</small></span></div>
        <div className="report-rule" />
        <div className="report-patient">
          <div><span>{t('pdf.patient')}</span><strong>{patient.name || t('result.default_name')}</strong></div>
          <div><span>{t('pdf.age_gender')}</span><strong>{patient.age || '62'} {t('result.years')} / {t('result.female')}</strong></div>
          <div><span>{t('pdf.district')}</span><strong>{patient.district || 'Kamrup Metropolitan'}</strong></div>
        </div>
        <div className="report-score"><div><span>{t('pdf.result')}</span><h2>{t(riskKey)}</h2><p>{t('pdf.result_copy')}</p></div><strong>{score}<small>%</small></strong></div>
        <h4>{t('pdf.what_shaped')}</h4>
        <div className="report-bars">
          <span>{t('result.factor.stairs')} <i style={{ width: '84%' }} /></span>
          <span>{t('result.factor.rom')} <i style={{ width: '61%' }} /></span>
          <span>{t('result.factor.stride')} <i style={{ width: '32%' }} /></span>
        </div>
        <div className="report-referral"><MapPin size={18} /><div><strong>{t('pdf.referral')}</strong><span>{t('pdf.referral_detail')}</span></div></div>
        <h4>{t('pdf.advice')}</h4>
        <ol><li>{t('pdf.advice1')}</li><li>{t('pdf.advice2')}</li><li>{t('pdf.advice3')}</li></ol>
        <div className="report-footer">{t('pdf.footer')}<span>{t('pdf.footer_brand')}</span></div>
      </article>
    </main>
  );
}

function SyncScreen({ networkOnline, setNetworkOnline, syncCount, setSyncCount, onBack }: { networkOnline: boolean; setNetworkOnline: (value: boolean) => void; syncCount: number; setSyncCount: (value: number) => void; onBack: () => void }) {
  const t = useT();
  const records = [
    { name: 'Jahnu Barua', id: 'ASHA-2407', status: 'synced' as SyncStatus, timeKey: 'sync.time_today' },
    { name: 'Mitali Das', id: 'ASHA-2406', status: 'pending' as SyncStatus, timeKey: 'sync.waiting_conn' },
    { name: 'Anima Devi', id: 'ASHA-2404', status: 'failed' as SyncStatus, timeKey: 'sync.tap_retry' },
  ];
  return (
    <main className="page sync-page">
      <BackHeader title={t('sync.title')} subtitle={t('sync.subtitle')} onBack={onBack} />
      <section className="sync-status-card">
        <div className={`big-network-icon ${networkOnline ? 'online' : ''}`}>{networkOnline ? <Wifi size={28} /> : <WifiOff size={28} />}</div>
        <div><div className="eyebrow">{t('sync.network')}</div><h2>{networkOnline ? t('sync.connected') : t('sync.offline')}</h2><p>{networkOnline ? t('sync.connected_copy') : t('sync.offline_copy')}</p></div>
        <button className="toggle" onClick={() => setNetworkOnline(!networkOnline)}><span className={networkOnline ? 'on' : ''} /></button>
      </section>
      <div className="sync-summary">
        <div><strong>{syncCount}</strong><span>{t('sync.waiting')}</span></div>
        <div><strong>12</strong><span>{t('sync.synced')}</span></div>
        <button className="button primary" disabled={!networkOnline || syncCount === 0} onClick={() => { setSyncCount(0); }}><RefreshCw size={17} /> {t('sync.sync_now')}</button>
      </div>
      <section className="sync-list">
        <div className="section-heading"><div><div className="eyebrow">{t('sync.local')}</div><h3>{t('sync.activity')}</h3></div><button className="text-button">{t('sync.sync_all')} <Cloud size={16} /></button></div>
        {records.map((record) => (
          <div className="sync-row" key={record.id}>
            <div className={`sync-row-icon ${record.status}`}><FileText size={18} /></div>
            <div><strong>{record.name}</strong><span>{record.id} • {t(record.timeKey)}</span></div>
            <div className={`sync-label ${record.status}`}>{record.status === 'synced' ? <><CheckCircle2 size={15} /> {t('sync.synced_label')}</> : record.status === 'pending' ? <><RefreshCw size={15} /> {t('sync.pending_label')}</> : <><Cloud size={15} /> {t('sync.failed_label')}</>}</div>
            {record.status === 'failed' && <button className="retry-button"><RotateCcw size={15} /> {t('sync.retry')}</button>}
          </div>
        ))}
      </section>
    </main>
  );
}

function MobileNav({ screen, setScreen }: { screen: Screen; setScreen: (screen: Screen) => void }) {
  const t = useT();
  if (screen === 'login' || screen === 'register' || screen === 'consent' || screen === 'screening' || screen === 'result' || screen === 'pdf' || screen === 'sync') return null;
  return (
    <nav className="mobile-nav">
      <button className={screen === 'dashboard' ? 'active' : ''} onClick={() => setScreen('dashboard')}><Activity size={20} /><span>{t('nav.today')}</span></button>
      <button onClick={() => setScreen('register')}><UserRound size={20} /><span>{t('nav.register')}</span></button>
      <button onClick={() => setScreen('sync')}><Cloud size={20} /><span>{t('nav.sync')}</span></button>
    </nav>
  );
}

export default App;
