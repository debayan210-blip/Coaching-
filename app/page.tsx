 "use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

const input = "mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm";
const types = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const valid = (f: File) => types.includes(f.type) && f.size <= 5 * 1024 * 1024;

export default function Verification() {
  const db = useMemo(() => createClient(), []);
  const [user,setUser] = useState<any>(null), [centres,setCentres] = useState<any[]>([]);
  const [centre,setCentre] = useState(""), [kind,setKind] = useState("trade_license");
  const [businessFile,setBusinessFile] = useState<File|null>(null), [studentFile,setStudentFile] = useState<File|null>(null);
  const [legalName,setLegalName] = useState(""), [dob,setDob] = useState(""), [doc,setDoc] = useState("masked_aadhaar");
  const [guardian,setGuardian] = useState(""), [guardianPhone,setGuardianPhone] = useState(""), [consent,setConsent] = useState(false);
  const [message,setMessage] = useState(""), [rows,setRows] = useState<any[]>([]), [busy,setBusy] = useState(false);

  async function refresh(uid:string) {
    const [c,d,s] = await Promise.all([
      db.from("centres").select("id,name,city,verification_status").eq("owner_id",uid),
      db.from("centre_documents").select("id,document_type,status,review_notes,created_at").eq("owner_id",uid).order("created_at",{ascending:false}),
      db.from("student_kyc").select("id,legal_name,document_type,status,review_notes,created_at").eq("student_id",uid).order("created_at",{ascending:false})
    ]);
    setCentres(c.data||[]); if(c.data?.length) setCentre(v=>v||c.data![0].id);
    setRows([...(d.data||[]).map(x=>({...x,kind:"Centre"})),...(s.data||[]).map(x=>({...x,kind:"Student"}))]);
  }
  useEffect(()=>{db.auth.getUser().then(({data})=>{setUser(data.user);if(data.user)refresh(data.user.id);});},[db]);

  async function sendCentre(e:React.FormEvent) {
    e.preventDefault(); if(!user||!centre||!businessFile)return;
    if(!valid(businessFile)){setMessage("PDF/JPG/PNG/WEBP up to 5 MB only.");return;}
    setBusy(true);setMessage("");
    const path=user.id+"/"+centre+"/"+crypto.randomUUID()+"-"+businessFile.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const up=await db.storage.from("classorbit-centre-docs").upload(path,businessFile,{contentType:businessFile.type});
    if(up.error){setMessage(up.error.message);setBusy(false);return;}
    const ins=await db.from("centre_documents").insert({centre_id:centre,owner_id:user.id,document_type:kind,document_path:path,status:"pending"});
    setMessage(ins.error?ins.error.message:"Centre document submitted for verification.");
    if(!ins.error)await refresh(user.id);setBusy(false);
  }
  async function sendStudent(e:React.FormEvent) {
    e.preventDefault();if(!user||!studentFile||!legalName.trim()||!dob)return;
    if(!valid(studentFile)){setMessage("PDF/JPG/PNG/WEBP up to 5 MB only.");return;}
    const age=(Date.now()-new Date(dob).getTime())/31557600000;
    if(age<18&&(!guardian.trim()||!guardianPhone.trim()||!consent)){setMessage("Guardian name, phone and consent are required for under-18 students.");return;}
    setBusy(true);setMessage("");
    const path=user.id+"/"+crypto.randomUUID()+"-"+studentFile.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const up=await db.storage.from("classorbit-kyc").upload(path,studentFile,{contentType:studentFile.type});
    if(up.error){setMessage(up.error.message);setBusy(false);return;}
    const ins=await db.from("student_kyc").insert({student_id:user.id,legal_name:legalName.trim(),date_of_birth:dob,document_type:doc,document_path:path,guardian_name:age<18?guardian:null,guardian_phone:age<18?guardianPhone:null,guardian_consent:age<18?consent:false,status:"pending"});
    setMessage(ins.error?ins.error.message:"Student KYC submitted securely.");
    if(!ins.error)await refresh(user.id);setBusy(false);
  }
  if(user===null)return <main className="p-8">Loading…</main>;
  if(!user)return <main className="p-8">Please <Link href="/" className="text-indigo-600 underline">sign in</Link> first.</main>;
  return <main className="min-h-screen bg-slate-50 p-4 text-slate-900"><div className="mx-auto max-w-5xl">
    <Link href="/" className="text-indigo-700">← Back to ClassOrbit</Link>
    <header className="mt-4 rounded-3xl bg-[#111936] p-7 text-white"><h1 className="text-3xl font-black">ClassOrbit Verification</h1><p className="mt-2 text-slate-300">Private document submission. Files are visible only to you and authorised reviewers.</p></header>
    {message&&<p className="mt-4 rounded-xl bg-indigo-50 p-3 text-sm">{message}</p>}
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <form onSubmit={sendCentre} className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Coaching centre KYC</h2>
        <label className="mt-4 block text-sm font-semibold">Centre<select required className={input} value={centre} onChange={e=>setCentre(e.target.value)}><option value="">Select centre</option>{centres.map(c=><option key={c.id} value={c.id}>{c.name} — {c.city}</option>)}</select></label>
        <label className="mt-3 block text-sm font-semibold">Document<select className={input} value={kind} onChange={e=>setKind(e.target.value)}><option value="trade_license">Trade Licence</option><option value="gst_certificate">GST Certificate (if applicable)</option></select></label>
        <label className="mt-3 block text-sm font-semibold">File<input required type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className={input} onChange={e=>setBusinessFile(e.target.files?.[0]||null)}/></label>
        <p className="mt-2 text-xs text-slate-500">PDF/JPG/PNG/WEBP · Maximum 5 MB.</p>
        <button disabled={busy||!centres.length} className="mt-4 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white disabled:opacity-50">{busy?"Submitting…":"Submit centre document"}</button>
      </form>
      <form onSubmit={sendStudent} className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Student identity verification</h2>
        <label className="mt-4 block text-sm font-semibold">Legal name<input required className={input} value={legalName} onChange={e=>setLegalName(e.target.value)}/></label>
        <label className="mt-3 block text-sm font-semibold">Date of birth<input required type="date" className={input} value={dob} onChange={e=>setDob(e.target.value)}/></label>
        <label className="mt-3 block text-sm font-semibold">Identity document<select className={input} value={doc} onChange={e=>setDoc(e.target.value)}><option value="masked_aadhaar">Masked Aadhaar (optional)</option><option value="passport">Passport</option><option value="voter_id">Voter ID</option><option value="driving_licence">Driving Licence</option><option value="school_id">School ID</option><option value="other_government_id">Other government ID</option></select></label>
        <label className="mt-3 block text-sm font-semibold">Document file<input required type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className={input} onChange={e=>setStudentFile(e.target.files?.[0]||null)}/></label>
        <p className="mt-2 text-xs text-slate-500">Aadhaar is not mandatory. If used, upload masked Aadhaar only. Never provide OTP or biometrics.</p>
        <div className="mt-4 rounded-xl bg-slate-50 p-3"><b className="text-sm">For students under 18</b><input placeholder="Guardian name" className={input} value={guardian} onChange={e=>setGuardian(e.target.value)}/><input placeholder="Guardian phone" className={input} value={guardianPhone} onChange={e=>setGuardianPhone(e.target.value)}/><label className="mt-2 flex gap-2 text-xs"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Guardian consent confirmed</label></div>
        <button disabled={busy} className="mt-4 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white">{busy?"Submitting…":"Submit student KYC"}</button>
      </form>
    </div>
    <section className="mt-6 rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">My submissions</h2>{rows.length===0?<p className="mt-3 text-sm text-slate-500">No submissions yet.</p>:rows.map(r=><div key={r.kind+r.id} className="mt-3 flex justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"><span>{r.kind}: {r.document_type||r.legal_name}{r.review_notes&&<small className="block text-rose-700">{r.review_notes}</small>}</span><b>{r.status}</b></div>)}</section>
  </div></main>;
}
