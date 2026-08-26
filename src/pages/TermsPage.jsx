import React, { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  CreditCard, 
  Sparkles, 
  Scale, 
  Lock, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Globe, 
  ArrowUpRight 
} from 'lucide-react';

import CustomCursor from '../components/CustomCursor';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppWidget from '../components/WhatsAppWidget';
import './about.css';

gsap.registerPlugin(ScrollTrigger);

export default function TermsPage() {
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
    const fadeElements = gsap.utils.toArray('.terms-fade-up');
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
      title: 'Our Services',
      content: (
        <>
          <p>
            MotionNodeEdits provides video editing, AI video production, advertising, and related creative services, which may include:
          </p>
          <div className="terms-services-grid">
            {[
              'Long-form video editing', 'YouTube video editing', 'Short-form video editing', 'Reels and Shorts',
              'Podcast video editing', 'Social media video editing', 'Motion graphics', 'Visual effects',
              'Color correction and color grading', 'Audio editing and cleanup', 'Subtitles and captions', 'Video advertisements',
              'Social media advertisements', 'AI-generated videos', 'AI-generated advertisements', 'AI-assisted video production',
              'AI avatars and virtual presenters', 'AI voiceovers and voice generation', 'AI-generated images and graphics', 'AI animation',
              'AI-enhanced video content', 'Creative development and other related services'
            ].map((srv, idx) => (
              <div key={idx} className="terms-service-pill">
                <CheckCircle2 size={13} className="terms-pill-icon" />
                <span>{srv}</span>
              </div>
            ))}
          </div>
          <p className="terms-footnote">
            The exact services, deliverables, timeline, revisions, and price will depend on the project agreement or quotation provided to the client.
          </p>
        </>
      )
    },
    {
      id: 'section-2',
      num: '02',
      title: 'Project Scope',
      content: (
        <>
          <p>Before work begins, the client may be required to provide:</p>
          <ul className="terms-list">
            <li>Raw video footage</li>
            <li>Audio files</li>
            <li>Images & photography</li>
            <li>Logos & brand guidelines</li>
            <li>Scripts & references</li>
            <li>Product information & AI-generation instructions</li>
            <li>Examples of preferred visual styles and other materials required for the project</li>
          </ul>
          <p>The client is responsible for providing accurate and complete information.</p>
          <div className="terms-highlight-box">
            <AlertCircle size={18} className="terms-alert-icon" />
            <span>Any request that substantially changes the original project scope may require additional charges and/or a revised delivery timeline.</span>
          </div>
        </>
      )
    },
    {
      id: 'section-3',
      num: '03',
      title: 'Orders and Advance Payments',
      content: (
        <>
          <p>A project may require an advance payment before MotionNodeEdits begins production.</p>
          <p>The amount of the advance payment will be communicated to the client before the project begins.</p>
          <p>Payment of the required advance confirms the client's intention to proceed with the project and allows MotionNodeEdits to allocate production resources, time, personnel, software, and other resources to the project.</p>
          <p>MotionNodeEdits may begin production only after the required payment and necessary project information have been received.</p>
        </>
      )
    },
    {
      id: 'section-4',
      num: '04',
      title: 'Advance Payment and Cancellation',
      isImportant: true,
      content: (
        <>
          <div className="terms-callout-card">
            <strong>Advance payments are generally non-refundable once the project has been confirmed and production has started.</strong>
          </div>
          <p>
            If the client cancels a project after paying an advance payment, the advance payment will <strong>not be refunded</strong>, except where a refund is required by applicable law or where MotionNodeEdits agrees otherwise in writing.
          </p>
          <p>
            This policy exists because MotionNodeEdits may allocate editors, designers, AI production resources, software resources, production time, and other business resources to the project after receiving the advance.
          </p>
          <p>
            If additional work has already been completed beyond the amount covered by the advance, MotionNodeEdits may require payment for the applicable completed work before releasing the completed deliverables.
          </p>
          <p>
            If a client requests cancellation before production has started, MotionNodeEdits may review the circumstances and determine whether any refund is applicable, after deducting any applicable administrative, processing, preparation, or third-party costs.
          </p>
          <p className="terms-highlight-text">
            <strong>Unless otherwise agreed in writing, payment of an advance does not create a right to cancel the project and receive the advance back.</strong>
          </p>
        </>
      )
    },
    {
      id: 'section-5',
      num: '05',
      title: 'Refund Policy',
      content: (
        <>
          <p>
            Payments for completed work, work already in production, allocated production resources, or applicable third-party costs are generally non-refundable.
          </p>
          <p>In particular, an advance payment will generally not be refunded when:</p>
          <ul className="terms-list">
            <li>The client cancels the project after production has started.</li>
            <li>The client changes their mind after approving the project.</li>
            <li>The client no longer requires the content.</li>
            <li>The client changes their marketing strategy after production has started.</li>
            <li>The client delays the project for an extended period.</li>
            <li>The client requests a completely different creative direction after production has started.</li>
            <li>The client has already received or approved the applicable deliverables.</li>
          </ul>
          <p>Any refund that may be legally required will be handled according to applicable law.</p>
        </>
      )
    },
    {
      id: 'section-6',
      num: '06',
      title: 'Delivery Times',
      content: (
        <>
          <p>Estimated delivery times depend on:</p>
          <ul className="terms-list">
            <li>Project complexity & number of deliverables</li>
            <li>Client requirements & availability of required files</li>
            <li>Feedback and approval times</li>
            <li>AI generation and processing requirements</li>
            <li>Third-party services & revisions</li>
          </ul>
          <p>
            Delivery dates may change if the client provides files late, requests additional work, delays feedback, changes requirements, or if circumstances outside MotionNodeEdits' reasonable control affect production.
          </p>
        </>
      )
    },
    {
      id: 'section-7',
      num: '07',
      title: 'Revisions and Feedback',
      content: (
        <>
          <p>
            The number of revisions included in a project depends on the applicable package, quotation, or project agreement.
          </p>
          <p>
            A revision means a reasonable modification to the existing agreed creative direction.
          </p>
          <p>
            A completely new concept, substantial restructuring, new script, new footage, new advertisement concept, or significant change in requirements may be treated as additional work.
          </p>
          <p>
            Clients should provide clear and consolidated feedback to avoid unnecessary delays.
          </p>
        </>
      )
    },
    {
      id: 'section-8',
      num: '08',
      title: 'Client Approval',
      content: (
        <>
          <p>
            The client is responsible for reviewing delivered work and communicating required changes within the agreed review period.
          </p>
          <p>
            Once a client approves a project or deliverable, additional changes may be treated as new work and may involve additional charges.
          </p>
          <p>
            If the client does not provide feedback within the agreed review period, MotionNodeEdits may consider the applicable version approved and proceed with the project.
          </p>
        </>
      )
    },
    {
      id: 'section-9',
      num: '09',
      title: 'AI Video and AI Advertising Services',
      content: (
        <>
          <p>
            MotionNodeEdits may use artificial intelligence and third-party AI technologies to create or assist with video content, advertisements, images, voices, animations, scripts, visual effects, avatars, and other creative materials.
          </p>
          <p>
            AI-generated results can vary depending on the technology, prompt, source material, model limitations, and third-party platform.
          </p>
          <p>
            MotionNodeEdits does not guarantee that every AI-generated result will be perfectly consistent, realistic, accurate, or free from visual or audio imperfections.
          </p>
          <p>
            AI-generated content may require multiple generations, modifications, editing, or manual post-production to achieve the agreed result. Additional AI generations or substantial changes outside the agreed project scope may require additional charges.
          </p>
        </>
      )
    },
    {
      id: 'section-10',
      num: '10',
      title: 'AI-Generated Faces, Voices, and Likeness',
      isImportant: true,
      content: (
        <>
          <p>
            Where a project involves generating or modifying a person's face, appearance, voice, or likeness, the client must have the appropriate rights, permissions, and consent required for the intended use.
          </p>
          <p>
            The client is responsible for obtaining any necessary permission from individuals whose likeness, voice, identity, or personal material is provided for AI production.
          </p>
          <p>
            MotionNodeEdits will not knowingly use another person's identity, voice, likeness, or copyrighted material without appropriate authorization.
          </p>
          <p>
            <strong>Clients must not request AI-generated content intended to impersonate, deceive, defraud, or unlawfully misrepresent another person.</strong>
          </p>
        </>
      )
    },
    {
      id: 'section-11',
      num: '11',
      title: 'AI Tools and Third-Party Platforms',
      content: (
        <>
          <p>
            MotionNodeEdits may use third-party AI platforms, software, APIs, stock libraries, cloud services, plugins, and other technologies during production. Third-party services may have their own terms, licenses, usage restrictions, and privacy policies.
          </p>
          <p>
            MotionNodeEdits cannot guarantee uninterrupted availability or permanent access to any third-party AI platform. If a third-party platform changes its pricing, availability, functionality, licensing, or usage restrictions, this may affect the project. Where such changes materially affect a project, MotionNodeEdits may discuss alternative solutions with the client.
          </p>
        </>
      )
    },
    {
      id: 'section-12',
      num: '12',
      title: 'AI Output Accuracy and Client Responsibility',
      content: (
        <>
          <p>
            AI-generated content may contain inaccuracies, unintended visual elements, incorrect information, pronunciation errors, inconsistencies, or other imperfections. The client is responsible for reviewing final content before publishing, advertising, or distributing it.
          </p>
          <p>
            For advertisements, the client is responsible for confirming that claims about their products, services, prices, results, testimonials, or business are accurate and legally permitted.
          </p>
          <p>
            MotionNodeEdits does not guarantee that AI-generated advertising content will comply with every advertising platform's policies unless a separate compliance review service has been agreed upon.
          </p>
        </>
      )
    },
    {
      id: 'section-13',
      num: '13',
      title: 'Client-Provided Materials',
      content: (
        <>
          <p>
            The client represents that they have the necessary rights, permissions, and licenses for all materials provided to MotionNodeEdits (including video footage, images, music, voice recordings, logos, brand assets, scripts, product materials, and third-party content).
          </p>
          <p>
            The client is responsible for ensuring that supplied materials do not infringe another person's or organization's rights.
          </p>
        </>
      )
    },
    {
      id: 'section-14',
      num: '14',
      title: 'Third-Party Assets',
      content: (
        <>
          <p>
            Projects may include third-party materials such as stock footage, stock images, music, fonts, AI-generated assets, plugins, templates, software, and other licensed resources.
          </p>
          <p>
            Third-party materials remain subject to their respective licenses and terms. Where a separate commercial license is required, the client may be responsible for purchasing or maintaining that license unless otherwise agreed.
          </p>
        </>
      )
    },
    {
      id: 'section-15',
      num: '15',
      title: 'Intellectual Property and Ownership',
      content: (
        <>
          <p>
            After the client has made <strong>full payment</strong> for the applicable project, the client will generally receive ownership of the final custom work specifically created for the client, subject to the project agreement and applicable third-party licenses.
          </p>
          <p>Ownership does not automatically include:</p>
          <ul className="terms-list">
            <li>MotionNodeEdits' pre-existing materials and internal workflows</li>
            <li>Editing techniques, templates, and proprietary tools</li>
            <li>Third-party stock assets, music, fonts, AI assets, or software that MotionNodeEdits does not legally own</li>
          </ul>
        </>
      )
    },
    {
      id: 'section-16',
      num: '16',
      title: 'Source Files and Project Files',
      content: (
        <>
          <p>
            Unless specifically included in the project agreement, editable source files, project files, working files, raw project assets, AI generation files, prompts, internal production files, and editing timelines are not automatically included with the final deliverables.
          </p>
          <p>
            If source files are requested, MotionNodeEdits may charge an additional fee.
          </p>
        </>
      )
    },
    {
      id: 'section-17',
      num: '17',
      title: 'Portfolio and Promotional Use',
      content: (
        <>
          <p>
            Unless otherwise agreed in writing, MotionNodeEdits may display completed work in its website, portfolio, social media, presentations, marketing materials, and case studies.
          </p>
          <p>
            If the client requires the project to remain confidential or does not want the work displayed publicly, the client should inform MotionNodeEdits before production or enter into an appropriate confidentiality agreement.
          </p>
        </>
      )
    },
    {
      id: 'section-18',
      num: '18',
      title: 'Confidentiality',
      content: (
        <>
          <p>
            MotionNodeEdits will take reasonable measures to protect confidential information provided by clients.
          </p>
          <p>
            Confidential information does not include information that is publicly available, becomes publicly available without breach, was already lawfully known, is independently developed, or must be disclosed by law. A separate NDA may be entered into where stronger confidentiality protection is required.
          </p>
        </>
      )
    },
    {
      id: 'section-19',
      num: '19',
      title: 'Client Responsibilities',
      content: (
        <>
          <p>The client agrees to:</p>
          <ul className="terms-list">
            <li>Provide accurate project information and required files in a usable format.</li>
            <li>Provide timely feedback and make payments when due.</li>
            <li>Maintain backups of important files.</li>
            <li>Ensure they have appropriate rights to supplied materials.</li>
            <li>Communicate respectfully with MotionNodeEdits personnel and contractors.</li>
          </ul>
          <p>Delays caused by missing information, late feedback, or late payments may affect delivery timelines.</p>
        </>
      )
    },
    {
      id: 'section-20',
      num: '20',
      title: 'Communication',
      content: (
        <>
          <p>
            Project instructions, feedback, approvals, and changes should be communicated through the official communication or project-management channels designated by MotionNodeEdits.
          </p>
          <p>
            MotionNodeEdits may not be responsible for instructions sent through unofficial channels or instructions that are unclear, incomplete, or contradictory.
          </p>
        </>
      )
    },
    {
      id: 'section-21',
      num: '21',
      title: 'Prohibited Use',
      content: (
        <>
          <p>
            Clients may not use MotionNodeEdits services for unlawful purposes or knowingly provide materials that are fraudulent, defamatory, infringing, unauthorized, or otherwise unlawful.
          </p>
          <p>
            MotionNodeEdits may refuse or discontinue work where continuing a project could reasonably create legal, ethical, or safety concerns.
          </p>
        </>
      )
    },
    {
      id: 'section-22',
      num: '22',
      title: 'Service Interruptions',
      content: (
        <>
          <p>
            MotionNodeEdits may experience delays caused by circumstances outside its reasonable control, including internet or infrastructure failures, software failures, AI platform outages, third-party service interruptions, technical failures, force majeure events, or other circumstances beyond reasonable control.
          </p>
          <p>
            MotionNodeEdits will make reasonable efforts to minimize the effect of such interruptions.
          </p>
        </>
      )
    },
    {
      id: 'section-23',
      num: '23',
      title: 'Limitation of Liability',
      content: (
        <>
          <p>
            To the maximum extent permitted by applicable law, MotionNodeEdits will not be responsible for indirect, incidental, consequential, or special losses arising from the use of its services.
          </p>
          <p>
            Where legally applicable, MotionNodeEdits' liability will be limited to the amount paid by the client for the specific service giving rise to the claim, unless applicable law requires otherwise.
          </p>
        </>
      )
    },
    {
      id: 'section-24',
      num: '24',
      title: 'Indemnification',
      content: (
        <>
          <p>
            To the extent permitted by applicable law, the client agrees to protect and indemnify MotionNodeEdits from claims, losses, damages, or expenses arising from:
          </p>
          <ul className="terms-list">
            <li>Materials supplied by the client.</li>
            <li>Unauthorized use of third-party content.</li>
            <li>Intellectual property violations caused by client-provided materials.</li>
            <li>The client's unlawful use of the services.</li>
            <li>The client's breach of these Terms.</li>
          </ul>
        </>
      )
    },
    {
      id: 'section-25',
      num: '25',
      title: 'Suspension or Termination',
      content: (
        <>
          <p>
            MotionNodeEdits may suspend or terminate services where a client fails to make required payments, repeatedly violates these Terms, provides unlawful or infringing materials, engages in abusive conduct, or seriously breaches the project agreement.
          </p>
          <p>
            Any payment obligations, intellectual property provisions, confidentiality obligations, and other provisions intended to survive termination will remain effective after termination.
          </p>
        </>
      )
    },
    {
      id: 'section-26',
      num: '26',
      title: 'Changes to These Terms',
      content: (
        <>
          <p>
            MotionNodeEdits may update these Terms from time to time. The updated version will be published on this page with a revised "Last Updated" date.
          </p>
          <p>
            For existing projects, the terms agreed upon when the project was purchased will generally apply unless otherwise agreed or required by applicable law.
          </p>
        </>
      )
    },
    {
      id: 'section-27',
      num: '27',
      title: 'Governing Law',
      content: (
        <>
          <p>
            These Terms will be governed by the applicable laws of India. Any dispute will be subject to the jurisdiction of the legally appropriate courts or forum applicable to MotionNodeEdits, subject to applicable law.
          </p>
        </>
      )
    },
    {
      id: 'section-28',
      num: '28',
      title: 'Entire Agreement',
      content: (
        <>
          <p>
            These Terms, together with any quotation, invoice, proposal, project agreement, subscription agreement, or other written agreement between MotionNodeEdits and the client, constitute the agreement governing the applicable services.
          </p>
          <p>
            If a specific written project agreement conflicts with these Terms, the specific project agreement will control for that project to the extent of the conflict.
          </p>
        </>
      )
    },
    {
      id: 'section-29',
      num: '29',
      title: 'Contact',
      content: (
        <>
          <p>For questions regarding these Terms of Service, please contact MotionNodeEdits through our official contact details:</p>
          <div className="terms-contact-card saas-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img 
                src="/image/mne_logo.png" 
                alt="MotionNodeEdits Logo" 
                style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)' }} 
              />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '0.04em' }}>
                  MotionNodeEdits Studio
                </div>
                <div style={{ fontSize: '11px', color: 'var(--about-text-tertiary)' }}>
                  AI Video & Creative Production
                </div>
              </div>
            </div>

            <div className="terms-contact-grid">
              <div className="terms-contact-item">
                <Globe size={15} className="terms-c-icon" />
                <div>
                  <span className="terms-c-label">Website</span>
                  <a href="https://motionnodeedits.com" target="_blank" rel="noopener noreferrer" className="terms-c-link">
                    motionnodeedits.com
                  </a>
                </div>
              </div>

              <div className="terms-contact-item">
                <Mail size={15} className="terms-c-icon" />
                <div>
                  <span className="terms-c-label">Email</span>
                  <a href="mailto:motionnodeedits@gmail.com" className="terms-c-link">
                    motionnodeedits@gmail.com
                  </a>
                </div>
              </div>

              <div className="terms-contact-item">
                <Phone size={15} className="terms-c-icon" />
                <div>
                  <span className="terms-c-label">Phone & WhatsApp</span>
                  <a href="tel:+918985351756" className="terms-c-link">
                    +91 89853 51756
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )
    }
  ];

  return (
    <>
      <CustomCursor />
      <Navbar />

      <main className="terms-page-wrapper">
        <div className="about-container terms-container">
          
          {/* HEADER HERO */}
          <div className="terms-hero terms-fade-up">
            <div className="chrome-badge" style={{ marginBottom: '20px' }}>
              LEGAL & COMPLIANCE
            </div>
            
            <h1 className="terms-main-title">
              Terms of <span className="chrome-text">Service</span>
            </h1>

            <div className="terms-date-badge">
              <Clock size={14} />
              <span>Last Updated: August 26, 2026</span>
            </div>

            <p className="terms-intro-lead">
              Welcome to <strong>MotionNodeEdits</strong>. These Terms of Service ("Terms") govern your use of our website and your purchase or use of our video editing, AI video production, advertising, and related creative services.
            </p>

            <div className="terms-acknowledgement-box">
              <ShieldCheck size={20} className="terms-shield-icon" />
              <div>
                <strong>Binding Agreement:</strong> By submitting an order, paying an advance, purchasing a service, requesting work, or otherwise engaging MotionNodeEdits, you acknowledge that you have read, understood, and agreed to these Terms. If you do not agree, please do not use our services.
              </div>
            </div>
          </div>

          {/* TABLE OF CONTENTS QUICK NAV */}
          <div className="terms-toc-card saas-card terms-fade-up">
            <div className="terms-toc-header">
              <FileText size={16} />
              <span>Table of Contents</span>
            </div>
            <div className="terms-toc-pills">
              {sections.map((sec) => (
                <a key={sec.id} href={`#${sec.id}`} className="terms-toc-pill">
                  <span className="terms-toc-num">{sec.num}</span>
                  <span className="terms-toc-name">{sec.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* TERMS SECTIONS LIST */}
          <div className="terms-sections-stack">
            {sections.map((sec) => (
              <section 
                key={sec.id} 
                id={sec.id} 
                className={`terms-section-card saas-card terms-fade-up ${sec.isImportant ? 'terms-card-important' : ''}`}
              >
                <div className="terms-section-header">
                  <span className="terms-section-num">{sec.num}</span>
                  <h2 className="terms-section-heading">{sec.title}</h2>
                </div>
                <div className="terms-section-body">
                  {sec.content}
                </div>
              </section>
            ))}
          </div>

          {/* LEGAL NOTICE DISCLAIMER */}
          <div className="terms-disclaimer-box terms-fade-up">
            <p>
              <strong>Important Legal Notice:</strong> This document represents the official service terms for MotionNodeEdits. In particular, the advance-payment and cancellation provisions apply to all confirmed client production workflows under Indian law.
            </p>
          </div>

        </div>
      </main>

      <WhatsAppWidget />
      <Footer />

      {/* COMPONENT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .terms-page-wrapper {
          background-color: var(--about-bg-primary, #050507);
          color: var(--about-text-primary, #FFFFFF);
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          min-height: 100vh;
          padding: 140px 0 80px;
          position: relative;
        }

        .terms-container {
          max-width: 960px !important;
          margin: 0 auto;
          padding: 0 24px;
        }

        .terms-hero {
          text-align: center;
          margin-bottom: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .terms-main-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(42px, 5.5vw, 76px);
          font-weight: 300;
          line-height: 1.05;
          text-transform: uppercase;
          letter-spacing: -0.03em;
          margin: 0 0 16px 0;
          color: #FFFFFF;
        }

        .terms-date-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 100px;
          font-size: 12px;
          color: #A1A1AA;
          margin-bottom: 24px;
        }

        .terms-intro-lead {
          font-size: 16px;
          line-height: 1.7;
          color: var(--about-text-secondary, #8E8F94);
          max-width: 720px;
          margin: 0 auto 28px;
          font-weight: 300;
        }

        .terms-acknowledgement-box {
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

        .terms-shield-icon {
          color: #FFFFFF;
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* TOC */
        .terms-toc-card {
          padding: 24px;
          margin-bottom: 48px;
          border-radius: 18px;
        }

        .terms-toc-header {
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

        .terms-toc-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .terms-toc-pill {
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

        .terms-toc-pill:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
          transform: translateY(-1px);
        }

        .terms-toc-num {
          font-weight: 600;
          color: #FFFFFF;
        }

        /* Section Cards */
        .terms-sections-stack {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .terms-section-card {
          padding: 32px 36px;
          border-radius: 18px;
          background: rgba(12, 12, 18, 0.7);
        }

        .terms-card-important {
          border-color: rgba(255, 255, 255, 0.22);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1);
        }

        .terms-section-header {
          display: flex;
          align-items: baseline;
          gap: 16px;
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .terms-section-num {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: 28px;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.35);
          line-height: 1;
        }

        .terms-section-heading {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(22px, 2.8vw, 30px);
          font-weight: 300;
          color: #FFFFFF;
          letter-spacing: -0.01em;
          text-transform: uppercase;
          margin: 0;
        }

        .terms-section-body {
          font-size: 14.5px;
          line-height: 1.8;
          color: var(--about-text-secondary, #8E8F94);
          font-weight: 300;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .terms-section-body strong {
          color: #FFFFFF;
          font-weight: 500;
        }

        .terms-list {
          margin: 4px 0 12px 20px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .terms-list li {
          color: #C5C5CE;
        }

        .terms-services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 10px;
          margin: 12px 0;
        }

        .terms-service-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          font-size: 12.5px;
          color: #E2E2EA;
        }

        .terms-pill-icon {
          color: #FFFFFF;
          flex-shrink: 0;
        }

        .terms-footnote {
          font-size: 13.5px;
          font-style: italic;
          color: #A1A1AA;
          margin-top: 4px;
        }

        .terms-highlight-box {
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

        .terms-alert-icon {
          color: #FFFFFF;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .terms-callout-card {
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-left: 3px solid #FFFFFF;
          border-radius: 6px;
          font-size: 15px;
          color: #FFFFFF;
        }

        .terms-highlight-text {
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
        }

        /* Contact Card */
        .terms-contact-card {
          padding: 24px;
          border-radius: 16px;
          margin-top: 12px;
        }

        .terms-contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .terms-contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .terms-c-icon {
          color: #FFFFFF;
          margin-top: 3px;
          flex-shrink: 0;
        }

        .terms-c-label {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #71717A;
          margin-bottom: 2px;
        }

        .terms-c-link {
          color: #FFFFFF;
          text-decoration: none;
          font-size: 13.5px;
          transition: color 0.2s;
        }

        .terms-c-link:hover {
          color: #D1D1D6;
          text-decoration: underline;
        }

        .terms-disclaimer-box {
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
          .terms-page-wrapper {
            padding: 100px 0 60px;
          }
          .terms-section-card {
            padding: 22px 20px;
          }
          .terms-main-title {
            font-size: 38px;
          }
          .terms-services-grid {
            grid-template-columns: 1fr;
          }
        }
      `}} />
    </>
  );
}
