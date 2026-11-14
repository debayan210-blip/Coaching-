"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { GraduationCap, Search, ArrowRight, MapPin, ShieldCheck, BookOpen, Building2, CalendarDays, Menu, X, Sparkles } from "lucide-react";

const groups = [
  ["Engineering", ["JEE Main", "JEE Advanced", "WBJEE", "GATE"]],
  ["Medical", ["NEET UG", "NEET PG"]],
  ["Government & Civil Services", ["UPSC CSE", "WBCS", "SSC CGL", "SSC CHSL", "SSC MTS", "WB Police", "Kolkata Police"]],
  ["Banking & Insurance", ["IBPS PO", "IBPS Clerk", "SBI PO", "SBI Clerk", "RBI"]],
  ["Railway", ["RRB NTPC", "RRB Group D", "RRB ALP"]],
  ["Defence", ["NDA", "CDS", "AFCAT", "Agniveer"]],
  ["Management & Law", ["CAT", "XAT", "CLAT", "MAT"]]
] as const;
const categories = ["All", ...groups.flatMap(g => [...g[1]])];

type Centre = { id: string; name: string; city: string; verification_status: string };
type Course = { id: string; title: string; category: string; monthly_fee: number; centre_id: string; centres?: { name: string; city: string } | null; batches?: { id: string; batch_name: string; available_seats: number }[] };

export default function Home() {
  const db = useMemo(() => createClient(), []);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState("");
  const [tab, setTab] = useState("Discover");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [role, setRole] = useState<"student" | "centre">("student");
  const [centreName, setCentreName] = useState("");
  const [city, setCity] = useState("Kolkata");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("NEET UG");
  const [fee, setFee] = useState("3000");
  const [batchName, setBatchName] = useState("Regular batch");
  const [seats, setSeats] = useState("30");
  const [mobile, setMobile] = useState(false);

  async function loadCourses() {
    const { data, error } = await db.from("courses")
      .select("id,title,category,monthly_fee,centre_id,centres(name,city),batches(id,batch_name,available_seats)")
      .eq("published", true).order("created_at", { ascending: false });
    if (error) setNotice(error.message);
    else setCourses((data || []) as any);
  }

  async function loadAccount(id: string) {
    const [{ data: p }, { data: b }, { data: owned }] = await Promise.all([
      db.from("profiles").select("*").eq("id", id).maybeSingle(),
      db.from("bookings").select("*,batches(batch_name,courses(title,centres(name,city)))").eq("student_id", id).order("created_at", { ascending: false }),
      db.from("centres").select("id,name,city,verification_status").eq("owner_id", id).order("created_at", { ascending: false })
    ]);
    setProfile(p);
    setBookings(b || []);
    setCentres((owned || []) as Centre[]);
    if (owned?.length) setSelectedCentreId(current => owned.some((c: Centre) => c.id === current) ? current : owned[0].id);
    else setSelectedCentreId("");
  }

  useEffect(() => {
    db.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadAccount(data.session.user.id);
    });
    loadCourses();
    const { data: listener } = db.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) loadAccount(s.user.id);
      else { setProfile(null); setBookings([]); setCentres([]); setSelectedCentreId(""); }
    });
    return () => listener.subscription.unsubscribe();
  }, [db]);

  async function auth(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      if (authMode === "signup") {
        const { error } = await db.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } });
        if (error) throw error;
        setNotice("Account created. Check your email to confirm it.");
      } else {
        const { error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setNotice("Signed in successfully.");
      }
    } catch (e: any) { setNotice(e.message || "Authentication failed"); }
    finally { setBusy(false); }
  }

  async function saveProfile() {
    if (!session?.user) return;
    const { error } = await db.from("profiles").update({ full_name: fullName || profile?.full_name, phone }).eq("id", session.user.id);
    setNotice(error ? error.message : "Profile updated.");
    if (!error) loadAccount(session.user.id);
  }

  async function register(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) { setNotice("Sign in first using a Centre account."); setTab("Account"); return; }
    setBusy(true);
    const { data, error } = await db.from("centres").insert({
      owner_id: session.user.id, name: centreName.trim(), city: city.trim(), verification_status: "pending"
    }).select("id,name,city,verification_status").single();
    if (error) setNotice(error.message);
    else {
      setCentres(current => [data as Centre, ...current]);
      setSelectedCentreId(data.id);
      setCentreName("");
      setNotice("Centre application submitted. You can register another branch or add a course.");
    }
    setBusy(false);
  }

  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) { setNotice("Please sign in first."); setTab("Account"); return; }
    if (!selectedCentreId) { setNotice("Register or select a centre first."); return; }
    setBusy(true);
    const { data: course, error } = await db.from("courses").insert({
      centre_id: selectedCentreId, title: courseTitle, category: courseCategory,
      monthly_fee: Number(fee), minimum_duration_months: 6, mode: "offline", published: false
    }).select().single();
    if (error) { setNotice(error.message); setBusy(false); return; }
    const { error: batchError } = await db.from("batches").insert({
      course_id: course.id, batch_name: batchName, total_seats: Number(seats), available_seats: Number(seats)
    });
    setNotice(batchError ? batchError.message : "Course and batch saved. They remain unpublished until approved/published.");
    setBusy(false);
  }

  async function book(batchId: string, monthlyFee: number) {
    if (!session?.user) { setNotice("Please sign in before requesting a seat."); setTab("Account"); return; }
    const name = profile?.full_name || session.user.user_metadata?.full_name || "Student";
    const tel = profile?.phone || phone;
    if (!tel) { setNotice("Add your phone number in your profile before booking."); setTab("Account"); return; }
    setBusy(true);
    const { error } = await db.from("bookings").insert({
      student_id: session.user.id, batch_id: batchId, student_name: name, student_phone: tel,
      duration_months: 6, monthly_fee: monthlyFee, commission_rate: 15
    });
    setNotice(error ? error.message : "Booking request submitted. The centre will review it.");
    if (!error) loadAccount(session.user.id);
    setBusy(false);
  }

  const filtered = courses.filter(c =>
    (category === "All" || c.category.toLowerCase() === category.toLowerCase()) &&
    `${c.title} ${c.category} ${c.centres?.name || ""} ${c.centres?.city || ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const nav = ["Discover", "My Bookings", "For Centres", "Account"];
  const go = (value: string) => { setTab(value); setMobile(false); };
  const input = "mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";

  return <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
    <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <button onClick={() => go("Discover")} className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600 text-white"><GraduationCap size={25}/></span><span className="text-xl font-black">Class<span className="text-indigo-600">Orbit</span><small className="block text-[9px] uppercase tracking-[.25em] text-slate-400">Learn · Choose · Grow</small></span></button>
        <nav className="hidden gap-1 md:flex">{nav.map(n => <button key={n} onClick={() => go(n)} className={`rounded-full px-4 py-2 text-sm font-bold ${tab === n ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}>{n}</button>)}</nav>
        <div className="hidden md:block">{session ? <button onClick={() => db.auth.signOut()} className="rounded-full border px-4 py-2 text-sm font-bold">Sign out</button> : <button onClick={() => go("Account")} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">Sign in <ArrowRight className="ml-1 inline" size={15}/></button>}</div>
        <button className="rounded-xl border p-2 md:hidden" onClick={() => setMobile(!mobile)}>{mobile ? <X/> : <Menu/>}</button>
      </div>
      {mobile && <div className="border-t bg-white p-3 md:hidden">{nav.map(n => <button key={n} onClick={() => go(n)} className="block w-full rounded-xl px-4 py-3 text-left font-bold">{n}</button>)}</div>}
    </header>

    <div className="mx-auto max-w-7xl px-5 py-8">
      {notice && <div className="mb-5 flex justify-between rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">{notice}<button onClick={() => setNotice("")}>×</button></div>}

      {tab === "Discover" && <>
        <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#111936] px-6 py-12 text-white md:px-12 md:py-16">
          <div className="pointer-events-none absolute -right-20 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-500/30 blur-3xl"/>
          <div className="relative max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-wider text-indigo-100"><Sparkles size={14}/> INDIA'S COACHING DISCOVERY PLATFORM</span>
            <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">Your next big goal starts <span className="text-indigo-300">with the right class.</span></h1>
            <p className="mt-5 max-w-xl text-slate-300 md:text-lg">Discover coaching institutes, compare courses and find a learning path built around your ambition.</p>
            <div className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 sm:flex-row"><div className="flex flex-1 items-center gap-3 px-3"><Search className="text-indigo-600"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams, courses or institutes..." className="w-full py-3 text-sm text-slate-900 outline-none"/></div><button onClick={() => document.getElementById("results")?.scrollIntoView({behavior:"smooth"})} className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white">Explore courses <ArrowRight className="ml-2 inline" size={16}/></button></div>
            <div className="mt-7 flex flex-wrap gap-5 text-sm text-slate-300"><span><ShieldCheck className="mr-2 inline text-emerald-300"/>Verified institute listings</span><span><BookOpen className="mr-2 inline text-emerald-300"/>Multiple exam categories</span></div>
          </div>
        </section>
        <section className="py-10"><p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">Find your direction</p><h2 className="mt-2 text-3xl font-black">Explore by exam category</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{groups.map((g,i) => <div key={g[0]} className="rounded-2xl border bg-white p-5 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700">{i === 0 ? <GraduationCap/> : i === 2 ? <ShieldCheck/> : <BookOpen/>}</span><h3 className="mt-4 text-lg font-black">{g[0]}</h3><div className="mt-3 flex flex-wrap gap-2">{g[1].map(x => <button key={x} onClick={() => {setCategory(x);document.getElementById("results")?.scrollIntoView({behavior:"smooth"});}} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-indigo-600 hover:text-white">{x}</button>)}</div></div>)}</div></section>
        <section id="results" className="scroll-mt-28 pb-10"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.2em] text-indigo-600">Discover learning</p><h2 className="mt-2 text-3xl font-black">Courses & coaching centres</h2></div><span className="text-sm text-slate-500">{filtered.length} results</span></div><div className="my-5 flex gap-2 overflow-x-auto pb-2">{categories.map(x => <button key={x} onClick={() => setCategory(x)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${category === x ? "bg-indigo-600 text-white" : "border bg-white text-slate-600"}`}>{x}</button>)}</div>
          {filtered.length === 0 ? <div className="rounded-3xl border border-dashed bg-white p-12 text-center"><BookOpen className="mx-auto text-indigo-500" size={32}/><h3 className="mt-4 text-xl font-black">No published courses yet</h3><p className="mt-2 text-sm text-slate-500">Courses appear here when centres publish their listings.</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(c => <article key={c.id} className="overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="flex h-24 items-end justify-between bg-gradient-to-br from-indigo-800 to-violet-500 p-5 text-white"><b className="rounded-full bg-white/15 px-3 py-1 text-xs">{c.category}</b><GraduationCap size={28}/></div><div className="p-5"><h3 className="text-lg font-black">{c.title}</h3><p className="mt-2 text-sm text-slate-500"><MapPin className="mr-1 inline" size={14}/>{c.centres?.name || "Coaching centre"} · {c.centres?.city || "India"}</p><p className="mt-5 text-2xl font-black">₹{Number(c.monthly_fee).toLocaleString("en-IN")}<span className="text-xs font-medium text-slate-400"> / month</span></p><div className="mt-4 space-y-2">{(c.batches || []).map(b => <div key={b.id} className="rounded-xl bg-slate-50 p-3"><div className="flex justify-between text-sm"><b>{b.batch_name}</b><span className="text-xs text-emerald-700">{b.available_seats} seats</span></div><button disabled={busy || b.available_seats < 1} onClick={() => book(b.id, Number(c.monthly_fee))} className="mt-3 w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white disabled:opacity-50">Request a seat <ArrowRight className="ml-1 inline" size={14}/></button></div>)}</div></div></article>)}</div>}
        </section>
        <section className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-indigo-50 p-7 md:flex-row md:items-center"><div><p className="text-xs font-black uppercase tracking-widest text-indigo-600">For coaching institutes</p><h2 className="mt-2 text-2xl font-black">Bring your courses to more students.</h2><p className="mt-2 text-sm text-slate-600">Create your institute profile and add courses and batches.</p></div><button onClick={() => go("For Centres")} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">List your centre <ArrowRight className="ml-2 inline" size={15}/></button></section>
      </>}

      {tab === "Account" && <section className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border bg-white md:grid-cols-2"><div className="bg-[#111936] p-8 text-white md:p-10"><GraduationCap size={35}/><h1 className="mt-8 text-3xl font-black">{session ? "Your ClassOrbit account" : "Your learning journey, one account away."}</h1><p className="mt-3 text-sm leading-6 text-slate-300">Manage your profile, booking requests and coaching centre connections.</p></div><div className="p-7 md:p-10"><h2 className="text-2xl font-black">{session ? "Profile details" : "Welcome back"}</h2>
        {session ? <div className="mt-5 space-y-4"><p className="text-sm text-slate-500">{session.user.email}</p><label className="block text-sm font-bold">Full name<input value={fullName} onChange={e => setFullName(e.target.value)} className={input}/></label><label className="block text-sm font-bold">Phone number<input value={phone || profile?.phone || ""} onChange={e => setPhone(e.target.value)} className={input}/></label><button onClick={saveProfile} className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">Save profile</button><button onClick={() => db.auth.signOut()} className="ml-2 rounded-xl border px-5 py-3 font-bold">Sign out</button></div> : <form onSubmit={auth} className="mt-5 space-y-4"><div className="flex rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setAuthMode("signup")} className={`flex-1 rounded-lg py-2 font-bold ${authMode === "signup" ? "bg-white text-indigo-700 shadow" : ""}`}>Create account</button><button type="button" onClick={() => setAuthMode("login")} className={`flex-1 rounded-lg py-2 font-bold ${authMode === "login" ? "bg-white text-indigo-700 shadow" : ""}`}>Sign in</button></div>{authMode === "signup" && <><label className="block text-sm font-bold">Full name<input required value={fullName} onChange={e => setFullName(e.target.value)} className={input}/></label><label className="block text-sm font-bold">I am a<select value={role} onChange={e => setRole(e.target.value as any)} className={input}><option value="student">Student</option><option value="centre">Coaching centre owner</option></select></label></>}<label className="block text-sm font-bold">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={input}/></label><label className="block text-sm font-bold">Password<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} className={input}/></label><button disabled={busy} className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white">{busy ? "Please wait…" : authMode === "signup" ? "Create account" : "Sign in"}</button></form>}</div></section>}

      {tab === "My Bookings" && <section className="mx-auto max-w-4xl"><p className="text-xs font-black uppercase tracking-widest text-indigo-600">Student dashboard</p><h1 className="mt-2 text-3xl font-black">My bookings</h1>{!session ? <div className="mt-6 rounded-2xl border bg-white p-8 text-center">Sign in to view bookings.<button onClick={() => go("Account")} className="ml-3 font-bold text-indigo-600">Sign in</button></div> : bookings.length === 0 ? <div className="mt-6 rounded-2xl border bg-white p-10 text-center"><CalendarDays className="mx-auto text-indigo-500"/><p className="mt-3 font-bold">No booking requests yet</p></div> : <div className="mt-6 grid gap-3">{bookings.map(b => <div key={b.id} className="rounded-2xl border bg-white p-5"><b>{b.batches?.courses?.title}</b><p className="mt-1 text-sm text-slate-500">{b.batches?.courses?.centres?.name} · {b.batches?.batch_name}</p><p className="mt-3 text-sm font-bold">₹{Number(b.total_amount).toLocaleString("en-IN")} · {b.duration_months} months · {b.status}</p></div>)}</div>}</section>}

      {tab === "For Centres" && <section className="mx-auto max-w-5xl"><h1 className="text-3xl font-black">Centre workspace</h1><p className="mt-2 text-sm text-slate-500">Register multiple coaching centres or branches and add courses to each one.</p><div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border bg-white p-6"><Building2 className="text-indigo-600"/><h2 className="mt-4 text-xl font-black">Register another centre / branch</h2><form onSubmit={register}><label className="mt-5 block text-sm font-bold">Centre / branch name<input required value={centreName} onChange={e => setCentreName(e.target.value)} className={input}/></label><label className="mt-3 block text-sm font-bold">City<input required value={city} onChange={e => setCity(e.target.value)} className={input}/></label><button disabled={busy} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit for verification"}</button></form>
          <div className="mt-6 border-t pt-4"><h3 className="font-bold">Your centres / branches ({centres.length})</h3>{centres.length === 0 ? <p className="mt-2 text-sm text-slate-500">No centres registered yet.</p> : <ul className="mt-3 space-y-2">{centres.map(c => <li key={c.id} className={`rounded-xl border p-3 ${selectedCentreId === c.id ? "border-indigo-300 bg-indigo-50" : "bg-slate-50"}`}><button type="button" onClick={() => setSelectedCentreId(c.id)} className="flex w-full items-center justify-between gap-3 text-left"><span><b>{c.name}</b><span className="block text-sm text-slate-500">{c.city}</span></span><span className="text-right text-xs font-bold text-amber-700">{c.verification_status}{selectedCentreId === c.id ? " · Selected" : ""}</span></button></li>)}</ul>}</div>
        </div>
        <form onSubmit={addCourse} className="rounded-3xl border bg-white p-6"><BookOpen className="text-emerald-600"/><h2 className="mt-4 text-xl font-black">Add a course & batch</h2><label className="mt-5 block text-sm font-bold">Select centre / branch<select value={selectedCentreId} onChange={e => setSelectedCentreId(e.target.value)} className={input} required><option value="">Select a centre</option>{centres.map(c => <option key={c.id} value={c.id}>{c.name} — {c.city} ({c.verification_status})</option>)}</select></label><label className="mt-3 block text-sm font-bold">Course title<input required value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className={input}/></label><label className="mt-3 block text-sm font-bold">Exam category<select value={courseCategory} onChange={e => setCourseCategory(e.target.value)} className={input}>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm font-bold">Monthly fee<input type="number" min="1" value={fee} onChange={e => setFee(e.target.value)} className={input}/></label><label className="text-sm font-bold">Total seats<input type="number" min="1" value={seats} onChange={e => setSeats(e.target.value)} className={input}/></label></div><label className="mt-3 block text-sm font-bold">Batch name<input required value={batchName} onChange={e => setBatchName(e.target.value)} className={input}/></label><button disabled={busy || centres.length === 0} className="mt-5 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save course"}</button></form>
      </div></section>}
    </div>
    <footer className="border-t bg-white px-5 py-8 text-center text-sm text-slate-400">© 2026 ClassOrbit · Learn. Choose. Grow.</footer>
  </main>;
}
