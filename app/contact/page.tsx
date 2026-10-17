import { contactAction } from "@/app/actions";
import { getSiteConfig } from "@/lib/site-editor";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export default async function Contact({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const [config, f] = await Promise.all([getSiteConfig(), searchParams]);
  const brandName = config.brand.name || "PlayUp";
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 880 }}>
        <div className="page-head">
          <h1>{config.staticPages.contactHeadline || `Contact ${brandName}`}</h1>
          <p>{config.staticPages.contactSub || "Send a message to our team."}</p>
        </div>
        {f.sent && <div className="alert alert-success">Your message was received! Our team will get back to you shortly.</div>}
        {f.error && <div className="alert alert-error">{f.error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          <form className="card" style={{ padding: 24 }} action={contactAction}>
            <div className="form-field"><label htmlFor="name">Full Name</label><input className="input" id="name" name="name" required /></div>
            <div className="form-field"><label htmlFor="email">Email Address</label><input className="input" id="email" name="email" type="email" required /></div>
            <div className="form-field"><label htmlFor="body">Message</label><textarea className="input" id="body" name="body" rows={4} minLength={10} required /></div>
            <button className="btn btn-primary btn-block">Send Message</button>
          </form>
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ margin: 0 }}>Direct Contact</h3>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>Reach out directly via phone or WhatsApp for instant match assistance.</p>
            {config.brand.contactPhone && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
                <Phone size={16} style={{ color: config.brand.accentColor }} />
                <span>{config.brand.contactPhone}</span>
              </div>
            )}
            {config.brand.whatsappNumber && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
                <MessageCircle size={16} style={{ color: config.brand.accentColor }} />
                <a className="inline-link" href={`https://wa.me/${config.brand.whatsappNumber.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">
                  WhatsApp: {config.brand.whatsappNumber}
                </a>
              </div>
            )}
            {config.brand.supportEmail && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13 }}>
                <Mail size={16} style={{ color: config.brand.accentColor }} />
                <span>{config.brand.supportEmail}</span>
              </div>
            )}
            {config.brand.officeAddress && (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13 }}>
                <MapPin size={16} style={{ color: config.brand.accentColor, marginTop: 2 }} />
                <span>{config.brand.officeAddress}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
