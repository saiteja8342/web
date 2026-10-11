import React from 'react';
import { MessageSquare, Mail, Send } from 'lucide-react';

// Parses markdown-style inline backticks (`tag`) into sleek badge tags
export const renderFaqTextWithTags = (text) => {
  if (!text || typeof text !== 'string') return text;
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <span key={index} className="cp-faq-code-tag">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
};

export const CLIENT_FAQS = [
  {
    q: 'How do I request video edits or new projects?',
    a: 'You can request video production and creative edits directly through your workspace:',
    points: [
      'Open the `Current Projects` section or message your dedicated producer from the sidebar.',
      'Choose the service category (`AI Commercials`, `Talking Avatars`, `3D Showcase`, or `Social Retainers`) and paste your footage or asset link.',
      'Submit the brief and track real-time milestone rendering and progress updates directly from the dashboard.'
    ]
  },
  {
    q: 'How will I receive my video deliverables?',
    a: 'Finished deliverables are rendered and provided in full 4K master resolution through your preferred channel:',
    points: [
      '`Dashboard`: Direct high-speed 4K master downloads available immediately inside your Project History and Current Projects tabs.',
      '`Cloud Folder`: Full uncompressed project deliverables synced directly to your dedicated Google Drive or Frame.io project folder.',
      '`WhatsApp & Email`: Instant rendering completion alerts and direct preview links delivered straight to your inbox and phone.'
    ]
  },
  {
    q: 'What should I include in a video brief or revision ticket?',
    a: 'Add the exact footage or asset link, target platform (`Meta Ads`, `TikTok`, `YouTube 4K`, `LinkedIn`), aspect ratio (`9:16` or `16:9`), and any extra timestamped instructions that help our editors deliver the correct cut without back-and-forth.'
  },
  {
    q: 'Which package is best for me?',
    a: 'We offer flexible production tiers customized for your specific brand objectives — including High-Converting AI Commercial Ads, AI Talking Avatar Videos, 3D Product Showcases, and Ongoing Monthly Social Media Retainers. If you are unsure, reach out for a consultation and we will tailor the optimal workflow for your goals.'
  },
  {
    q: 'Why should we choose your service?',
    a: 'MotionNodeEdits bridges state-of-the-art generative AI technologies with high-end cinema-grade post-production, sound engineering, color grading, and editorial direction. You receive studio-quality commercial video assets delivered 10x faster and at a fraction of traditional production budgets.'
  },
  {
    q: 'How long does the video process take?',
    a: 'Standard AI commercial ads, short-form reels, and talking avatar videos are typically delivered within 48 to 72 hours. Comprehensive campaigns, custom 3D animations, and cinematic brand films take 5 to 7 business days. Rush delivery is always available upon request.'
  },
  {
    q: 'How can I send big files and footage to you?',
    a: 'You can easily share your brand assets, logo vectors, product guidelines, and footage through Google Drive, Dropbox, WeTransfer, or Frame.io. Upon project initiation, we set up a dedicated cloud folder for seamless asset management.'
  },
  {
    q: "What if I don't like my video and how do revisions work?",
    a: 'Every project includes dedicated revision rounds with zero friction. You can leave precise timestamped notes right on your project preview card, and our creative team will refine the visuals, pacing, audio, color grading, and animations until the video perfectly aligns with your creative vision.'
  },
  {
    q: 'Can you create videos completely from just an idea?',
    a: 'Yes! You only need to share your vision, product link, or campaign goal. We manage the entire end-to-end creative workflow: scriptwriting, storyboard generation, generative AI asset creation, voice synthesis, sound design, and final 4K master delivery.'
  },
  {
    q: 'Can I cancel at any time?',
    a: 'Yes, absolutely. For our monthly retainer workflows, there are no lock-in contracts or long-term obligations—you can pause or cancel anytime with zero friction. For one-off custom projects, payments are transparently structured on milestone deliverables.'
  },
  {
    q: "I have a big project and it's a bit complex.",
    a: 'We specialize in complex, high-scale productions. Whether you need multi-lingual AI localization in 30+ languages, custom digital twin avatars, full 3D environment generation, or 50+ ad variations per month, we build a dedicated workflow and assign specialized editors to your brand.'
  },
  {
    q: 'Need more help?',
    a: 'If the dashboard does not cover your issue, our dedicated client success team is available 24/7 to assist with active projects, revisions, or emergency delivery requests:',
    points: [
      '`Email`: hello@motionnodeedits.com (Average response time under 2 hours)',
      '`WhatsApp`: +91 89853 51756 for direct producer messaging and urgent delivery requests',
      '`Feedback Portal`: Submit client suggestions, feature requests, or report issues directly'
    ],
    actions: [
      {
        label: 'WhatsApp Support',
        href: 'https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I%20have%20a%20support%20question%20regarding%20my%20dashboard%20project',
        external: true,
        primary: true,
        type: 'whatsapp'
      },
      {
        label: 'Email Support',
        href: 'mailto:hello@motionnodeedits.com?subject=Client%20Support%20Request%20-%20MotionNodeEdits',
        external: false,
        primary: false,
        type: 'email'
      },
      {
        label: 'Feedback Channel',
        href: '/feedback',
        external: false,
        primary: false,
        type: 'feedback'
      }
    ]
  }
];

export default function ClientFAQ({ faqs = CLIENT_FAQS }) {
  return (
    <div className="cp-faq-view">
      <div className="cp-faq-header">
        <span className="cp-faq-category">HELP</span>
        <h1 className="cp-faq-title">Frequently Asked Questions</h1>
        <p className="cp-faq-subtitle">
          Quick answers for video requests, support flow, and delivery expectations.
        </p>
      </div>

      <div className="cp-faq-list">
        {faqs.map((faq, idx) => (
          <div key={idx} className="cp-faq-card">
            <h3 className="cp-faq-card-title">{faq.q}</h3>
            {faq.a && (
              <p className="cp-faq-card-body">
                {renderFaqTextWithTags(faq.a)}
              </p>
            )}
            {faq.points && faq.points.length > 0 && (
              <ul className="cp-faq-bullet-list">
                {faq.points.map((pt, pIdx) => (
                  <li key={pIdx} className="cp-faq-bullet-item">
                    <span className="cp-faq-bullet-dot" />
                    <div>{renderFaqTextWithTags(pt)}</div>
                  </li>
                ))}
              </ul>
            )}
            {faq.actions && faq.actions.length > 0 && (
              <div className="cp-faq-actions-row">
                {faq.actions.map((act, aIdx) => (
                  <a
                    key={aIdx}
                    href={act.href}
                    target={act.external ? '_blank' : '_self'}
                    rel={act.external ? 'noopener noreferrer' : undefined}
                    className={`cp-faq-action-btn ${act.primary ? 'primary' : ''}`}
                  >
                    {act.type === 'whatsapp' && <MessageSquare className="h-3.5 w-3.5" />}
                    {act.type === 'email' && <Mail className="h-3.5 w-3.5" />}
                    {act.type === 'feedback' && <Send className="h-3.5 w-3.5" />}
                    <span>{act.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Centered Brand Copyright Footer */}
      <div className="cp-profile-footer">
        MotionNodeEdits 2026
      </div>
    </div>
  );
}
