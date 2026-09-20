import React, { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  FileText, 
  ShieldCheck, 
  Clock, 
  Lock, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Globe, 
  FileCheck
} from 'lucide-react';

import CustomCursor from '../components/CustomCursor';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppWidget from '../components/WhatsAppWidget';
import './about.css';

gsap.registerPlugin(ScrollTrigger);

export default function PrivacyPolicyPage() {
  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Fade up animations for sections
    const fadeElements = gsap.utils.toArray('.privacy-fade-up');
    fadeElements.forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerCallback);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const sections = [
    {
      id: 'section-1',
      num: '01',
      title: 'Introduction',
      content: (
        <>
          <p>
            Welcome to <strong>MotionNodeEdits</strong> (<a href="https://www.motionnodeedits.com" target="_blank" rel="noopener noreferrer" className="privacy-inline-link">www.motionnodeedits.com</a>). We are an AI-powered video production and editing service operating online, based in India. We are committed to protecting the privacy and personal data of our clients, editors, and website visitors.
          </p>
          <p>
            This Privacy Policy explains what personal information we collect, how we use it, who can access it, how long we retain it, and your rights regarding your data.
          </p>
          <div className="privacy-highlight-box">
            <CheckCircle2 size={18} className="privacy-alert-icon" />
            <span>By creating an account or using our services, you agree to the terms described in this Privacy Policy.</span>
          </div>
        </>
      )
    },
    {
      id: 'section-2',
      num: '02',
      title: 'Who This Policy Applies To',
      content: (
        <>
          <p>This policy applies to all individuals and entities interacting with MotionNodeEdits:</p>
          <div className="privacy-grid-3">
            <div className="privacy-subcard">
              <div className="privacy-subcard-tag">Role 01</div>
              <h4 className="privacy-subcard-title">Clients</h4>
              <p className="privacy-subcard-text">
                Clients who register and use the MotionNodeEdits client dashboard to track, manage, and receive their video projects.
              </p>
            </div>
            <div className="privacy-subcard">
              <div className="privacy-subcard-tag">Role 02</div>
              <h4 className="privacy-subcard-title">Editors</h4>
              <p className="privacy-subcard-text">
                Editors who are assigned to client projects through our internal workflow management platform.
              </p>
            </div>
            <div className="privacy-subcard">
              <div className="privacy-subcard-tag">Role 03</div>
              <h4 className="privacy-subcard-title">Website Visitors</h4>
              <p className="privacy-subcard-text">
                Website visitors who browse <a href="https://www.motionnodeedits.com" target="_blank" rel="noopener noreferrer" className="privacy-inline-link">www.motionnodeedits.com</a> and view our portfolio, demos, and offerings.
              </p>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-3',
      num: '03',
      title: 'Information We Collect',
      content: (
        <>
          <div className="privacy-subsection">
            <h3 className="privacy-subheading">3.1 During Account Registration (Login Page)</h3>
            <p>When you create an account on MotionNodeEdits, we collect:</p>
            <ul className="privacy-list">
              <li><strong>Full Name</strong> — Required, for identifying your account and assigning your user role.</li>
              <li><strong>Email Address</strong> — Required, for account creation, login, and communication.</li>
            </ul>
          </div>

          <div className="privacy-subsection">
            <h3 className="privacy-subheading">3.2 Inside the Client Dashboard (Optional)</h3>
            <p>After logging in, clients may optionally provide:</p>
            <ul className="privacy-list">
              <li><strong>Company Name</strong> — Optional, for project and business identification.</li>
              <li><strong>Mobile Number</strong> — Optional, provided only if the client chooses to share it for project coordination.</li>
              <li><strong>Physical/Billing Address</strong> — Optional, provided if required for project or invoicing purposes.</li>
            </ul>
          </div>

          <div className="privacy-subsection">
            <h3 className="privacy-subheading">3.3 Project-Related Information</h3>
            <ul className="privacy-list">
              <li>
                <strong>Google Drive Links</strong> — When clients submit raw video footage for editing, we collect only the Google Drive shared link. <strong>We do not download or host your raw footage on our servers.</strong>
              </li>
            </ul>
          </div>

          <div className="privacy-subsection">
            <h3 className="privacy-subheading">3.4 Website Analytics</h3>
            <p>
              We use <strong>Google Analytics</strong> to collect anonymous, aggregated data about website visitors — such as page views, session duration, and general traffic counts. This data does not personally identify any individual visitor.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'section-4',
      num: '04',
      title: 'Information We Do NOT Collect',
      isImportant: true,
      content: (
        <>
          <p>We believe in absolute transparency about what data we deliberately do <strong>not</strong> collect:</p>
          <div className="privacy-callout-card">
            <strong>Clear Protections Regarding Financial & Private Data:</strong>
          </div>
          <ul className="privacy-list privacy-negative-list">
            <li>
              <strong>No Payment Card or Financial Data:</strong> We do <strong>not</strong> collect payment card details, bank account information, or any financial data. No payments are processed through our platform directly.
            </li>
            <li>
              <strong>No Plain-Text Passwords:</strong> We do <strong>not</strong> collect passwords in plain text. Passwords are encrypted with salted hashes and stored securely via industry-standard protocols.
            </li>
            <li>
              <strong>No Minors:</strong> We do <strong>not</strong> collect information from individuals under the age of 18.
            </li>
            <li>
              <strong>No Dormant Data (Zero-Order Accounts):</strong> We do <strong>not</strong> collect or retain data from users who create an account but have never placed an order. Such accounts are permanently deleted from our database without retaining any information.
            </li>
          </ul>
        </>
      )
    },
    {
      id: 'section-5',
      num: '05',
      title: 'How We Use Your Information',
      content: (
        <>
          <p>We use the information we collect strictly for legitimate business and service operations:</p>
          <div className="privacy-features-grid">
            <div className="privacy-feature-item">
              <div className="privacy-feature-title">Account Identification</div>
              <div className="privacy-feature-desc">Your name and email are used to identify your account and assign your role (client or editor) within our platform.</div>
            </div>
            <div className="privacy-feature-item">
              <div className="privacy-feature-title">Email Confirmation</div>
              <div className="privacy-feature-desc">When you sign up for the first time, a one-time confirmation email is sent to verify your email address.</div>
            </div>
            <div className="privacy-feature-item">
              <div className="privacy-feature-title">Order Confirmation</div>
              <div className="privacy-feature-desc">When a client places a project order, an automated confirmation email is sent to their registered email address.</div>
            </div>
            <div className="privacy-feature-item">
              <div className="privacy-feature-title">Project Management</div>
              <div className="privacy-feature-desc">Client information is used to manage, track, and deliver video editing projects smoothly through the client dashboard.</div>
            </div>
            <div className="privacy-feature-item">
              <div className="privacy-feature-title">Service Communication</div>
              <div className="privacy-feature-desc">For personal support and project-related queries, we may contact clients via direct phone calls or WhatsApp messages using provided details.</div>
            </div>
            <div className="privacy-feature-item">
              <div className="privacy-feature-title">Website Improvement</div>
              <div className="privacy-feature-desc">Google Analytics data is used to analyze aggregate visitor metrics and continually optimize our platform performance and UX.</div>
            </div>
            <div className="privacy-feature-item" style={{ gridColumn: '1 / -1' }}>
              <div className="privacy-feature-title">AI Video Generation</div>
              <div className="privacy-feature-desc">We use the latest AI video generation models available in the market to create AI-generated video content as per client project requirements. Client project briefs and requirements may be used as input for these AI tools to fulfill the requested service.</div>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-6',
      num: '06',
      title: 'Google Drive and Raw Footage',
      content: (
        <>
          <p>We handle all creative media assets with utmost discretion and zero persistent internal storage:</p>
          <ul className="privacy-list">
            <li>Clients share their raw video footage via <strong>Google Drive links</strong>.</li>
            <li>We access these links solely for the purpose of completing the editing project.</li>
            <li>
              <strong>Raw footage Google Drive links are retained for a maximum of 15 days</strong> after project completion, only in case the client raises an issue or requests a revision within that period.
            </li>
            <li><strong>After 15 days</strong>, the Google Drive links are permanently deleted from our records.</li>
            <li>We do not share client Google Drive links with any third party other than the assigned editor working on the project.</li>
          </ul>
          <div className="privacy-highlight-box">
            <Lock size={18} className="privacy-alert-icon" />
            <span>Your footage remains hosted on your own Google Drive. MotionNodeEdits never downloads or stores client raw footage archives on its servers.</span>
          </div>
        </>
      )
    },
    {
      id: 'section-7',
      num: '07',
      title: 'Data Access and Account Security',
      content: (
        <>
          <p>
            We take strict architectural and operational measures to ensure that personal data is protected and accessible only to verified, authorized individuals:
          </p>
          <div className="privacy-security-cards">
            <div className="privacy-security-card">
              <div className="privacy-security-badge">Client Isolation</div>
              <strong>Clients</strong> have exclusive access to their own accounts and dashboards. No other party — including editors or other clients — can view or access a client's account or project feed.
            </div>
            <div className="privacy-security-card">
              <div className="privacy-security-badge">Zero Editor Exposure</div>
              <strong>Editors</strong> do not have access to any client personal information. Editors are only assigned project work without exposure to client email, phone, or account details.
            </div>
            <div className="privacy-security-card">
              <div className="privacy-security-badge">Restricted Admin Role</div>
              <strong>Admin</strong> can access only the client's <strong>name and email address</strong> strictly for account management and customer support purposes. Admins cannot access passwords, project files, or any other personal details.
            </div>
            <div className="privacy-security-card">
              <div className="privacy-security-badge">Channel Firewalls</div>
              There is <strong>no direct communication channel</strong> between clients and editors within the platform. All project coordination is managed internally by our production lead team.
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-8',
      num: '08',
      title: 'Cookies and Tracking Technologies',
      content: (
        <>
          <ul className="privacy-list">
            <li>Our website uses <strong>Google Analytics</strong>, which may use cookies to collect anonymous traffic and usage data.</li>
            <li>These cookies do not collect personally identifiable information.</li>
            <li>You may disable cookies in your browser settings at any time. However, this may affect your user experience on the website.</li>
            <li>We do <strong>not</strong> use any other tracking tools such as Meta Pixel, Hotjar, session recorders, or third-party advertising cookies.</li>
          </ul>
        </>
      )
    },
    {
      id: 'section-9',
      num: '09',
      title: 'Data Sharing with Third Parties',
      content: (
        <>
          <p>
            <strong>We do not sell, rent, or trade your personal data to any third parties.</strong> We may share limited information only in the following clearly defined cases:
          </p>
          <ul className="privacy-list">
            <li>
              <strong>Google Analytics</strong> — Anonymous, aggregated website usage data is shared with Google for traffic and performance analytics.
            </li>
            <li>
              <strong>Google Drive</strong> — Project-related Google Drive links are shared internally only with assigned editors for project completion.
            </li>
            <li>
              <strong>AI Video Generation Tools</strong> — Client project requirements and briefs may be processed by third-party AI video generation models to create the requested content. We select the latest and most appropriate AI models based on project requirements.
            </li>
            <li>
              <strong>Legal Compliance</strong> — If required by Indian law, a court of law, or a competent legal authority, we may disclose information as strictly mandated.
            </li>
          </ul>
        </>
      )
    },
    {
      id: 'section-10',
      num: '10',
      title: 'Data Retention',
      content: (
        <>
          <p>We retain your data only for as long as strictly necessary to fulfill our service commitments:</p>
          <div className="privacy-table-wrapper">
            <table className="privacy-table">
              <thead>
                <tr>
                  <th scope="col">Data Type</th>
                  <th scope="col">Retention Period</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Account Information</strong> (Name, Email)</td>
                  <td>Until account is deleted</td>
                </tr>
                <tr>
                  <td><strong>Optional Information</strong> (Company Name, Mobile, Address)</td>
                  <td>Until account is deleted</td>
                </tr>
                <tr>
                  <td><strong>Google Drive Links</strong> (Raw Footage)</td>
                  <td><span className="privacy-tag-warn">15 days</span> after project completion, then permanently deleted</td>
                </tr>
                <tr>
                  <td><strong>New Users with No Orders Placed</strong></td>
                  <td><span className="privacy-tag-red">Permanently deleted immediately</span> from database</td>
                </tr>
                <tr>
                  <td><strong>Google Analytics Data</strong></td>
                  <td>As per Google's retention policy (anonymized)</td>
                </tr>
                <tr>
                  <td><strong>Confirmation & Order Emails</strong></td>
                  <td>Retained for record-keeping until account deletion</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )
    },
    {
      id: 'section-11',
      num: '11',
      title: 'Account Deletion and Your Rights',
      content: (
        <>
          <div className="privacy-subsection">
            <h3 className="privacy-subheading">How to Delete Your Account</h3>
            <p>
              Clients who wish to delete their account must contact MotionNodeEdits through our official helpline or support channel (<a href="mailto:support@motionnodeedits.com" className="privacy-inline-link">support@motionnodeedits.com</a>).
            </p>
            
            <div className="privacy-deletion-rules">
              <div className="privacy-del-box">
                <div className="privacy-del-title">For New Users / No Orders Placed:</div>
                <p>If you have created an account but never placed an order, your account and all associated data will be permanently deleted from our database. No information is retained.</p>
              </div>

              <div className="privacy-del-box">
                <div className="privacy-del-title">For Existing Clients:</div>
                <ul className="privacy-list">
                  <li>If you have no active or running projects, your account will be permanently deleted upon request.</li>
                  <li>If you have an active project in progress, you must complete the associated project and any due payments before the deletion request is processed.</li>
                  <li><strong>Irreversible Action:</strong> Once deleted, your account and all data are permanently removed from our database. This action is irreversible. You will lose access to your account, project history, and all associated data permanently.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="privacy-subsection" style={{ marginTop: '20px' }}>
            <h3 className="privacy-subheading">Your Rights Under Indian Privacy Law (DPDP Act 2023)</h3>
            <p>
              Under the <strong>Digital Personal Data Protection Act, 2023 (India)</strong>, you have the following guaranteed legal rights:
            </p>
            <div className="privacy-rights-grid">
              <div className="privacy-right-pill">
                <CheckCircle2 size={14} className="privacy-pill-icon" />
                <div>
                  <strong>Right to Access:</strong> Request confirmation and access to the personal data we hold about you.
                </div>
              </div>
              <div className="privacy-right-pill">
                <CheckCircle2 size={14} className="privacy-pill-icon" />
                <div>
                  <strong>Right to Correction:</strong> Correct inaccurate or outdated personal data in our systems.
                </div>
              </div>
              <div className="privacy-right-pill">
                <CheckCircle2 size={14} className="privacy-pill-icon" />
                <div>
                  <strong>Right to Erasure:</strong> Request deletion of your personal data (subject to active project conditions).
                </div>
              </div>
              <div className="privacy-right-pill">
                <CheckCircle2 size={14} className="privacy-pill-icon" />
                <div>
                  <strong>Right to Withdraw Consent:</strong> Withdraw consent at any time for data processing where consent was the basis.
                </div>
              </div>
              <div className="privacy-right-pill" style={{ gridColumn: '1 / -1' }}>
                <CheckCircle2 size={14} className="privacy-pill-icon" />
                <div>
                  <strong>Right of Nomination:</strong> Nominate an authorized individual to exercise your privacy rights on your behalf in case of incapacity or death.
                </div>
              </div>
            </div>
            <p style={{ marginTop: '12px', fontSize: '13px' }}>
              To exercise any of these rights, please contact our Data Grievance channel as outlined in Section 14.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'section-12',
      num: '12',
      title: 'AI-Generated Content and Data',
      content: (
        <>
          <p>
            MotionNodeEdits uses advanced AI video generation models to create AI-powered video content as part of our service offering. Please note:
          </p>
          <ul className="privacy-list">
            <li>Client project requirements, scripts, briefs, and creative inputs may be shared with AI models to generate the requested video content.</li>
            <li>We use only reputable and up-to-date AI models available in the market, selected based on the client's project requirements.</li>
            <li>Clients are responsible for ensuring that any content, references, or materials they provide do not violate copyright, intellectual property laws, or any applicable regulations.</li>
            <li>AI-generated output delivered to clients is intended for the client's specified use as agreed during the project.</li>
          </ul>
        </>
      )
    },
    {
      id: 'section-13',
      num: '13',
      title: "Children's Privacy",
      content: (
        <>
          <p>
            MotionNodeEdits does not knowingly collect personal data from individuals under the age of <strong>18 years</strong>. Our platform and services are intended exclusively for adults, creators, and businesses.
          </p>
          <p>
            If we become aware that a minor has created an account or submitted personal information, we will immediately and permanently delete the account and all associated data.
          </p>
        </>
      )
    },
    {
      id: 'section-14',
      num: '14',
      title: 'Contact Us',
      content: (
        <>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
          </p>
          <div className="privacy-contact-card saas-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <img 
                src="/image/mne_logo.png" 
                alt="MotionNodeEdits Logo" 
                style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.18)' }} 
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                  MotionNodeEdits Studio
                </div>
                <div style={{ fontSize: '11px', color: 'var(--about-text-tertiary)' }}>
                  AI Video & Creative Production • India
                </div>
              </div>
            </div>

            <div className="privacy-contact-grid">
              <div className="privacy-contact-item">
                <Globe size={16} className="privacy-c-icon" />
                <div>
                  <span className="privacy-c-label">Official Website</span>
                  <a href="https://www.motionnodeedits.com" target="_blank" rel="noopener noreferrer" className="privacy-c-link">
                    www.motionnodeedits.com
                  </a>
                </div>
              </div>

              <div className="privacy-contact-item">
                <Mail size={16} className="privacy-c-icon" />
                <div>
                  <span className="privacy-c-label">Privacy & Support Email</span>
                  <a href="mailto:support@motionnodeedits.com" className="privacy-c-link">
                    support@motionnodeedits.com
                  </a>
                </div>
              </div>

              <div className="privacy-contact-item">
                <Phone size={16} className="privacy-c-icon" />
                <div>
                  <span className="privacy-c-label">Official Helpline & WhatsApp</span>
                  <a href="tel:+918985351756" className="privacy-c-link">
                    +91 89853 51756
                  </a>
                </div>
              </div>
            </div>

            <div className="privacy-contact-notice">
              <FileCheck size={14} style={{ color: '#FFFFFF', flexShrink: 0, marginTop: '2px' }} />
              <span>For account deletion requests, please reach out to us through the above contact details with your registered email address.</span>
            </div>
          </div>
        </>
      )
    },
    {
      id: 'section-15',
      num: '15',
      title: 'Changes to This Privacy Policy',
      content: (
        <>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our services, data practices, or applicable laws. When we make changes, we will update the <strong>"Last Updated"</strong> date at the top of this page.
          </p>
          <p>
            We encourage you to review this page periodically. Continued use of our services after any changes constitutes your acceptance of the updated Privacy Policy.
          </p>
          <div className="privacy-gov-box">
            <em>This Privacy Policy is governed by the laws of India, including the Digital Personal Data Protection Act, 2023 (DPDP Act).</em>
          </div>
        </>
      )
    }
  ];

  return (
    <>
      <CustomCursor />
      <Navbar />

      <main className="privacy-page-wrapper">
        <div className="about-container privacy-container">
          
          {/* HEADER HERO */}
          <div className="privacy-hero privacy-fade-up">
            <div className="chrome-badge" style={{ marginBottom: '20px' }}>
              LEGAL & PRIVACY
            </div>
            
            <h1 className="privacy-main-title">
              Privacy <span className="chrome-text">Policy</span>
            </h1>

            <div className="privacy-dates-row">
              <div className="privacy-date-badge">
                <Clock size={13} />
                <span>Effective Date: September 20, 2026</span>
              </div>
              <div className="privacy-date-badge">
                <Clock size={13} />
                <span>Last Updated: September 20, 2026</span>
              </div>
            </div>

            <p className="privacy-intro-lead">
              At <strong>MotionNodeEdits</strong>, we value your privacy and are committed to safeguarding personal data across our video production platform, client portal, and editing workflows.
            </p>

            <div className="privacy-acknowledgement-box">
              <ShieldCheck size={20} className="privacy-shield-icon" />
              <div>
                <strong>Binding Privacy Framework:</strong> By creating an account, browsing our website, or using our video editing and AI services, you agree to the terms described in this Privacy Policy.
              </div>
            </div>
          </div>

          {/* TABLE OF CONTENTS QUICK NAV */}
          <div className="privacy-toc-card saas-card privacy-fade-up">
            <div className="privacy-toc-header">
              <FileText size={16} />
              <span>Table of Contents</span>
            </div>
            <div className="privacy-toc-pills">
              {sections.map((sec) => (
                <a key={sec.id} href={`#${sec.id}`} className="privacy-toc-pill">
                  <span className="privacy-toc-num">{sec.num}</span>
                  <span className="privacy-toc-name">{sec.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* PRIVACY SECTIONS LIST */}
          <div className="privacy-sections-stack">
            {sections.map((sec) => (
              <section 
                key={sec.id} 
                id={sec.id} 
                className={`privacy-section-card saas-card privacy-fade-up ${sec.isImportant ? 'privacy-card-important' : ''}`}
              >
                <div className="privacy-section-header">
                  <span className="privacy-section-num">{sec.num}</span>
                  <h2 className="privacy-section-heading">{sec.title}</h2>
                </div>
                <div className="privacy-section-body">
                  {sec.content}
                </div>
              </section>
            ))}
          </div>

          {/* LEGAL NOTICE DISCLAIMER */}
          <div className="privacy-disclaimer-box privacy-fade-up">
            <p>
              <strong>Indian Privacy Law Compliance:</strong> MotionNodeEdits is an Indian enterprise. This Privacy Policy is constructed in strict alignment with the <em>Digital Personal Data Protection Act, 2023 (DPDP Act)</em> and relevant digital service statutes.
            </p>
          </div>

        </div>
      </main>

      <WhatsAppWidget />
      <Footer />

      {/* STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .privacy-page-wrapper {
          background-color: var(--about-bg-primary, #050507);
          color: var(--about-text-primary, #FFFFFF);
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          min-height: 100vh;
          padding: 140px 0 80px;
          position: relative;
        }

        .privacy-container {
          max-width: 960px !important;
          margin: 0 auto;
          padding: 0 24px;
        }

        .privacy-hero {
          text-align: center;
          margin-bottom: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .privacy-main-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(42px, 5.5vw, 76px);
          font-weight: 300;
          line-height: 1.05;
          text-transform: uppercase;
          letter-spacing: -0.03em;
          margin: 0 0 16px 0;
          color: #FFFFFF;
        }

        .privacy-dates-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-bottom: 24px;
        }

        .privacy-date-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          font-size: 12px;
          color: #A1A1AA;
        }

        .privacy-intro-lead {
          font-size: 16px;
          line-height: 1.7;
          color: var(--about-text-secondary, #8E8F94);
          max-width: 720px;
          margin: 0 auto 28px;
          font-weight: 300;
        }

        .privacy-acknowledgement-box {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 18px 22px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          text-align: left;
          font-size: 13.5px;
          line-height: 1.65;
          color: #D1D1D6;
          max-width: 760px;
        }

        .privacy-shield-icon {
          color: #FFFFFF;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* TOC */
        .privacy-toc-card {
          padding: 24px;
          margin-bottom: 48px;
          border-radius: 18px;
        }

        .privacy-toc-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #FFFFFF;
          margin-bottom: 16px;
        }

        .privacy-toc-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .privacy-toc-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          text-decoration: none;
          color: #A1A1AA;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .privacy-toc-pill:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
          transform: translateY(-1px);
        }

        .privacy-toc-num {
          font-weight: 600;
          color: #FFFFFF;
        }

        /* Section Cards */
        .privacy-sections-stack {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .privacy-section-card {
          padding: 32px 36px;
          border-radius: 18px;
          background: rgba(12, 12, 18, 0.7);
        }

        .privacy-card-important {
          border-color: rgba(255, 255, 255, 0.22);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1);
        }

        .privacy-section-header {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .privacy-section-num {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: 28px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.35);
          line-height: 1;
        }

        .privacy-section-heading {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(22px, 2.8vw, 30px);
          font-weight: 300;
          color: #FFFFFF;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          margin: 0;
        }

        .privacy-section-body {
          font-size: 14.5px;
          line-height: 1.8;
          color: var(--about-text-secondary, #8E8F94);
          font-weight: 300;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .privacy-section-body strong {
          color: #FFFFFF;
          font-weight: 500;
        }

        .privacy-inline-link {
          color: #FFFFFF;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s;
        }

        .privacy-inline-link:hover {
          color: #E2E2EA;
        }

        .privacy-list {
          margin: 4px 0 12px 20px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .privacy-list li {
          color: #C5C5CE;
        }

        .privacy-negative-list li::marker {
          color: #EF4444;
        }

        .privacy-highlight-box {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          color: #FFFFFF;
          font-size: 13.5px;
        }

        .privacy-alert-icon {
          color: #FFFFFF;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .privacy-callout-card {
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.04);
          border-left: 3px solid #FFFFFF;
          border-radius: 6px;
          font-size: 14.5px;
          color: #FFFFFF;
        }

        /* 3-Col Grid for section 2 */
        .privacy-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin: 10px 0;
        }

        .privacy-subcard {
          padding: 18px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
        }

        .privacy-subcard-tag {
          font-size: 10.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #71717A;
          margin-bottom: 6px;
          font-weight: 600;
        }

        .privacy-subcard-title {
          font-size: 16px;
          color: #FFFFFF;
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          margin-bottom: 6px;
        }

        .privacy-subcard-text {
          font-size: 13px;
          line-height: 1.6;
          color: #A1A1AA;
        }

        /* Subsection styling */
        .privacy-subsection {
          padding-bottom: 12px;
        }

        .privacy-subheading {
          font-size: 15px;
          font-weight: 600;
          color: #FFFFFF;
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          margin: 0 0 8px 0;
          letter-spacing: 0.02em;
        }

        /* Features grid (section 5) */
        .privacy-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
          margin-top: 8px;
        }

        .privacy-feature-item {
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }

        .privacy-feature-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #FFFFFF;
          margin-bottom: 4px;
        }

        .privacy-feature-desc {
          font-size: 12.5px;
          line-height: 1.6;
          color: #A1A1AA;
        }

        /* Security Cards (section 7) */
        .privacy-security-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-top: 10px;
        }

        .privacy-security-card {
          padding: 16px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.6;
          color: #D1D1D6;
        }

        .privacy-security-badge {
          font-size: 10.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #71717A;
          margin-bottom: 6px;
          font-weight: 600;
        }

        /* Table (section 10) */
        .privacy-table-wrapper {
          overflow-x: auto;
          margin: 12px 0;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .privacy-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13.5px;
        }

        .privacy-table th {
          background: rgba(255, 255, 255, 0.05);
          color: #FFFFFF;
          font-weight: 600;
          padding: 14px 18px;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.1em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .privacy-table td {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #C5C5CE;
        }

        .privacy-table tbody tr:last-child td {
          border-bottom: none;
        }

        .privacy-table tbody tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }

        .privacy-tag-warn {
          display: inline-block;
          padding: 2px 8px;
          background: rgba(250, 204, 21, 0.12);
          border: 1px solid rgba(250, 204, 21, 0.3);
          color: #FDE047;
          border-radius: 4px;
          font-weight: 600;
        }

        .privacy-tag-red {
          display: inline-block;
          padding: 2px 8px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #FCA5A5;
          border-radius: 4px;
          font-weight: 600;
        }

        /* Section 11 Account Deletion & Rights */
        .privacy-deletion-rules {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 10px;
        }

        .privacy-del-box {
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          font-size: 13px;
        }

        .privacy-del-title {
          font-weight: 600;
          color: #FFFFFF;
          margin-bottom: 8px;
          font-size: 13.5px;
        }

        .privacy-rights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .privacy-right-pill {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          font-size: 12.5px;
          color: #D1D1D6;
        }

        .privacy-pill-icon {
          color: #FFFFFF;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Contact Card */
        .privacy-contact-card {
          padding: 24px;
          border-radius: 16px;
          margin-top: 12px;
        }

        .privacy-contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .privacy-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .privacy-c-icon {
          color: #FFFFFF;
          margin-top: 3px;
          flex-shrink: 0;
        }

        .privacy-c-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #71717A;
          margin-bottom: 2px;
        }

        .privacy-c-link {
          color: #FFFFFF;
          text-decoration: none;
          font-size: 13.5px;
          transition: color 0.2s;
        }

        .privacy-c-link:hover {
          color: #D1D1D6;
          text-decoration: underline;
        }

        .privacy-contact-notice {
          margin-top: 18px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 12.5px;
          color: #A1A1AA;
        }

        .privacy-gov-box {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          border-left: 2px solid rgba(255, 255, 255, 0.3);
          font-size: 13px;
          color: #A1A1AA;
        }

        .privacy-disclaimer-box {
          margin-top: 48px;
          padding: 20px 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          font-size: 12.5px;
          line-height: 1.7;
          color: #71717A;
          text-align: center;
        }

        @media (max-width: 768px) {
          .privacy-page-wrapper {
            padding: 100px 0 60px;
          }
          .privacy-section-card {
            padding: 22px 20px;
          }
          .privacy-main-title {
            font-size: 38px;
          }
          .privacy-deletion-rules {
            grid-template-columns: 1fr;
          }
          .privacy-grid-3 {
            grid-template-columns: 1fr;
          }
          .privacy-features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </>
  );
}
