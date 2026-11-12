"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase/client";

type Course = {
  id: string; title: string; category: string; description: string | null;
  monthly_fee: number; mode: string; centre_id: string;
  centres?: { name: string; city: string; verification_status: string } | null;
  batches?: { id: string; batch_name: string; available_seats: number; total_seats: number }[];
};

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tab, setTab] = useState("Discover");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [role, setRole] = useState<"student" | "centre">("student");
  const [bookings, setBookings] = useState<any[]>([]);
  const [centreName, setCentreName] = useState("");
  const [city, setCity] = useState("Kolkata");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("NEET");
  const [fee, setFee] = useState("3000");
  const [batchName, setBatchName] = useState("Regular batch");
  const [seats, setSeats] = useState("30");

  async function loadCourses() {
    const { data, error } = await supabase.from("courses")
      .select("id,title,category,description,monthly_fee,mode,centre_id,centres(name,city,verification_status),batches(id,batch_name,available_seats,total_seats)")
      .eq("published", true).order("created_at", { ascending: false });
    if (error) setNotice(error.message);
    else setCourses((data || []) as any);
  }

  async function loadAccount(userId: string) {
    const [{ data: p }, { data: b }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("bookings").select("*,batches(batch_name,courses(title,centres(name,city)))").eq("student_id", userId).order("created_at", { ascending: false })
    ]);
    setProfile(p);
    setBookings(b || []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadAccount(data.session.user.id);
    });
    loadCourses();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) loadAccount(next.user.id);
      else { setProfile(null); setBookings([]); }
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function authenticate(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setNotice("");
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, role } }
        });
        if (error) throw error;
        setNotice("Account created. Check your email to confirm it, then sign in. If email confirmation is disabled, you may already be signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setNotice("Signed in successfully.");
      }
    } catch (e: any) { setNotice(e.message || "Authentication failed."); }
    finally { setBusy(false); }
  }

  async function signOut() {
    await supabase.auth.signOut(); setTab("Discover"); setNotice("Signed out.");
  }

  async function book(batchId: string, monthlyFee: number) {
    if (!session?.user) { setNotice("Please sign in before requesting a seat."); setTab("Account"); return; }
    const personName = profile?.full_name || session.user.user_metadata?.full_name || "Student";
    const personPhone = profile?.phone || phone;
    if (!personPhone) { setNotice("Add your phone number in your profile before booking."); setTab("Account"); return; }
    setBusy(true); setNotice("");
    const { error } = await supabase.from("bookings").insert({
      student_id: session.user.id, batch_id: batchId,
      student_name: personName, student_phone: personPhone, duration_months: 6,
      monthly_fee: monthlyFee, commission_rate: 15
    });
    if (error) setNotice(error.message);
    else { setNotice("Booking request submitted. The centre will review it."); await loadAccount(session.user.id); }
    setBusy(false);
  }

  async function savePhone() {
    if (!session?.user) return;
    const { error } = await supabase.from("profiles").update({ full_name: fullName || profile?.full_name, phone }).eq("id", session.user.id);
    setNotice(error ? error.message : "Profile updated."); if (!error) loadAccount(session.user.id);
  }

  async function registerCentre(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) { setNotice("Sign in first using a Centre account."); setTab("Account"); return; }
    setBusy(true);
    const { error } = await supabase.from("centres").insert({ owner_id: session.user.id, name: centreName, city, verification_status: "pending" });
    setNotice(error ? error.message : "Centre application submitted for admin verification.");
    setBusy(false);
  }

  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user) return;
    const { data: centre } = await supabase.from("centres").select("id").eq("owner_id", session.user.id).maybeSingle();
    if (!centre) { setNotice("Register your centre first."); return; }
    const { data: course, error } = await supabase.from("courses").insert({
      centre_id: centre.id, title: courseTitle, category: courseCategory,
      monthly_fee: Number(fee), minimum_duration_months: 6, mode: "offline", published: false
    }).select().single();
    if (error) { setNotice(error.message); return; }
    const { error: batchError } = await supabase.from("batches").insert({
      course_id: course.id, batch_name: batchName, total_seats: Number(seats), available_seats: Number(seats)
    });
    setNotice(batchError ? batchError.message : "Course and batch saved. They remain unpublished until centre verification and publishing workflow.");
  }

  const filtered = courses.filter(c =>
    (category === "All" || c.category === category) &&
    `${c.title} ${c.centres?.name || ""} ${c.centres?.city || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return <main className="min-h-screen">
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
        <button onClick={() => setTab("Discover")} className="text-2xl font-black tracking-tight text-blue-700">ClassOrbit</button>
        <div className="flex items-center gap-3 text-sm">
          {session ? <><span className="hidden sm:inline text-slate-600">{session.user.email}</span><button onClick={signOut} className="rounded-lg border px-3 py-2">Sign out</button></> : <button onClick={() => setTab("Account")} className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white">Sign in</button>}
        </div>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
        {["Discover","My Bookings","For Centres","Account"].map(x => <button key={x} onClick={() => setTab(x)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${tab===x?"bg-blue-600 text-white":"bg-slate-100 text-slate-700"}`}>{x}</button>)}
      </nav>
    </header>

    <div className="mx-auto max-w-7xl p-4 md:p-8">
      {notice && <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{notice}</div>}

      {tab === "Discover" && <>
        <section className="rounded-3xl bg-slate-950 p-7 text-white md:p-12">
          <p className="mb-3 font-bold tracking-widest text-blue-300">INDIA'S COACHING MARKETPLACE</p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">Find the right coaching. Book your future.</h1>
          <p className="mt-4 max-w-2xl text-slate-300">Discover verified institutes, compare courses and request your seat in one place.</p>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses, exams or institutes..." className="mt-7 w-full rounded-xl p-4 text-slate-900 outline-none" />
        </section>
        <div className="my-7 flex gap-2 overflow-x-auto pb-2">{["All","K-12","NEET","JEE","CAT","CLAT","GATE","MCA","MBA"].map(x=><button key={x} onClick={()=>setCategory(x)} className={`rounded-full px-5 py-2 font-bold ${category===x?"bg-blue-600 text-white":"border bg-white"}`}>{x}</button>)}</div>
        {filtered.length===0 ? <div className="rounded-2xl border bg-white p-8 text-center"><h2 className="text-xl font-bold">No published courses yet</h2><p className="mt-2 text-slate-500">When verified centres publish courses, they will appear here.</p></div> :
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(c=><article key={c.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{c.category}</span>
            <h2 className="mt-4 text-xl font-black">{c.title}</h2><p className="mt-2 text-sm text-slate-500">{c.centres?.name} · {c.centres?.city}</p>
            <p className="mt-4 text-2xl font-black">₹{Number(c.monthly_fee).toLocaleString("en-IN")}<span className="text-sm font-normal text-slate-500"> / month</span></p>
            <p className="mt-1 text-sm text-slate-600">Minimum 6 months · Total ₹{(Number(c.monthly_fee)*6).toLocaleString("en-IN")}</p>
            <div className="mt-4 space-y-2">{(c.batches||[]).map(b=><div key={b.id} className="rounded-xl bg-slate-50 p-3"><div className="flex justify-between gap-2"><b>{b.batch_name}</b><span className="text-sm text-green-700">{b.available_seats} seats</span></div><button disabled={busy||b.available_seats<1} onClick={()=>book(b.id,Number(c.monthly_fee))} className="mt-3 w-full rounded-lg bg-blue-600 p-3 font-bold text-white disabled:opacity-50">Request seat</button></div>)}</div>
          </article>)}</div>}
      </>}

      {tab === "Account" && <section className="mx-auto max-w-xl rounded-2xl border bg-white p-6">
        <h1 className="text-3xl font-black">{session?"Your account":"Welcome to ClassOrbit"}</h1>
        {session ? <div className="mt-5 space-y-3"><p className="text-slate-600">Signed in as {session.user.email}</p><label className="block text-sm font-bold">Full name<input value={fullName} onChange={e=>setFullName(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><label className="block text-sm font-bold">Phone number<input value={phone || profile?.phone || ""} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><button onClick={savePhone} className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">Save profile</button></div> :
          <form onSubmit={authenticate} className="mt-5 space-y-3">
            <div className="flex gap-2"><button type="button" onClick={()=>setAuthMode("signup")} className={`rounded-lg px-4 py-2 ${authMode==="signup"?"bg-blue-600 text-white":"bg-slate-100"}`}>Create account</button><button type="button" onClick={()=>setAuthMode("login")} className={`rounded-lg px-4 py-2 ${authMode==="login"?"bg-blue-600 text-white":"bg-slate-100"}`}>Sign in</button></div>
            {authMode==="signup" && <><label className="block text-sm font-bold">Full name<input required value={fullName} onChange={e=>setFullName(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><label className="block text-sm font-bold">I am a<input type="hidden"/><select value={role} onChange={e=>setRole(e.target.value as any)} className="mt-1 w-full rounded-lg border p-3 font-normal"><option value="student">Student</option><option value="centre">Coaching centre owner</option></select></label></>}
            <label className="block text-sm font-bold">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label>
            <label className="block text-sm font-bold">Password<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label>
            <button disabled={busy} className="w-full rounded-xl bg-blue-600 p-3 font-bold text-white disabled:opacity-50">{busy?"Please wait…":authMode==="signup"?"Create account":"Sign in"}</button>
            <p className="text-xs text-slate-500">Email confirmation settings are controlled in your Supabase Auth dashboard.</p>
          </form>}
      </section>}

      {tab === "My Bookings" && <section><h1 className="text-3xl font-black">My Bookings</h1>{!session?<p className="mt-4">Sign in to view your booking requests.</p>:bookings.length===0?<p className="mt-4 text-slate-500">No booking requests yet.</p>:<div className="mt-5 grid gap-3">{bookings.map(b=><div key={b.id} className="rounded-xl border bg-white p-5"><b>{b.batches?.courses?.title}</b><p className="text-sm text-slate-500">{b.batches?.courses?.centres?.name} · {b.batches?.batch_name}</p><p className="mt-2">₹{Number(b.total_amount).toLocaleString("en-IN")} · {b.duration_months} months</p><p className="mt-1 font-bold text-blue-700">{b.status}</p></div>)}</div>}</section>}

      {tab === "For Centres" && <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={registerCentre} className="rounded-2xl border bg-white p-6"><h1 className="text-2xl font-black">Register your coaching centre</h1><p className="my-2 text-sm text-slate-500">Centre applications are reviewed before listings go live.</p><label className="mt-4 block text-sm font-bold">Centre name<input required value={centreName} onChange={e=>setCentreName(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><label className="mt-3 block text-sm font-bold">City<input required value={city} onChange={e=>setCity(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><button disabled={busy} className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">Submit for verification</button></form>
        <form onSubmit={addCourse} className="rounded-2xl border bg-white p-6"><h2 className="text-2xl font-black">Add a course and batch</h2><label className="mt-4 block text-sm font-bold">Course title<input required value={courseTitle} onChange={e=>setCourseTitle(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><label className="mt-3 block text-sm font-bold">Category<select value={courseCategory} onChange={e=>setCourseCategory(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal">{["K-12","NEET","JEE","CAT","CLAT","GATE","MBA","MCA"].map(x=><option key={x}>{x}</option>)}</select></label><label className="mt-3 block text-sm font-bold">Monthly fee (₹)<input required type="number" min="1" value={fee} onChange={e=>setFee(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><label className="mt-3 block text-sm font-bold">Batch name<input required value={batchName} onChange={e=>setBatchName(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><label className="mt-3 block text-sm font-bold">Total seats<input required type="number" min="1" value={seats} onChange={e=>setSeats(e.target.value)} className="mt-1 w-full rounded-lg border p-3 font-normal"/></label><button className="mt-4 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">Save course</button></form>
      </section>}
    </div>
    <footer className="p-8 text-center text-sm text-slate-400">© 2026 ClassOrbit · Learn. Choose. Grow.</footer>
  </main>;
}
