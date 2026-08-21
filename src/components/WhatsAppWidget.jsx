import React, { useState, useEffect, useRef } from 'react';

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [subtitle, setSubtitle] = useState('Chat directly with MotionNodeEdits.');

  const popupRef = useRef(null);

  const services = [
    'Video Editing',
    'Motion Graphics',
    'YouTube Videos',
    'Short Form Reels',
    'Social Media Content',
    'Brand Films',
    'Creative Strategy',
    'Pricing Questions'
  ];

  useEffect(() => {
    // Show bubble notification after 5 seconds if popup is not open
    const bubbleTimer = setTimeout(() => {
      if (!isOpen) {
        setShowBubble(true);
      }
    }, 5000);

    return () => clearTimeout(bubbleTimer);
  }, [isOpen]);

  // Click outside to close popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen && 
        popupRef.current && 
        !popupRef.current.contains(e.target) &&
        !e.target.closest('#waBtn')
      ) {
        closePopup();
      }
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closePopup();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleBtnClick = (e) => {
    e.stopPropagation();
    setShowBubble(false);
    
    if (isOpen) {
      closePopup();
    } else {
      setIsOpen(true);
      
      // Typewriter animation for subtitle
      let currentText = '';
      const text = 'How can we help today?';
      let idx = 0;
      
      const typeWriter = setInterval(() => {
        if (idx < text.length) {
          currentText += text.charAt(idx);
          setSubtitle(currentText);
          idx++;
        } else {
          clearInterval(typeWriter);
        }
      }, 50);
    }
  };

  const closePopup = () => {
    setIsOpen(false);
    setTimeout(() => {
      setSubtitle('Chat directly with MotionNodeEdits.');
    }, 300); // Wait for transition
  };

  const startChat = () => {
    let message = "Hi MotionNodeEdits,\n\nI'd like to try an AI Video Demo and discuss my project requirements.";

    if (selectedService) {
      if (selectedService === 'Pricing Questions') {
        message = 'Hi MotionNodeEdits,\n\nI have some questions regarding pricing.\n\nCan we discuss my requirements?';
      } else {
        message = `Hi MotionNodeEdits,\n\nI am interested in ${selectedService}.\n\nCan we discuss my project?`;
      }
    }

    // Track conversion event in Google Analytics
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'whatsapp_chat_click', {
        event_category: 'Engagement',
        event_label: selectedService || 'General AI Demo',
        value: 1
      });
    }

    const encodedText = encodeURIComponent(message);
    window.open(`https://wa.me/918985351756?text=${encodedText}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="wa-widget-container" id="waWidget">
      {/* Notification Bubble */}
      <div className={`wa-bubble ${showBubble ? 'show' : ''}`} id="waBubble">
        Try an AI demo
      </div>
      
      {/* Floating Button */}
      <button 
        className="wa-btn" 
        id="waBtn" 
        onClick={handleBtnClick} 
        aria-label="WhatsApp Support"
        data-hover-type="link"
      >
        <div className="wa-tooltip">Try an AI demo</div>
        <svg className="wa-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </button>

      {/* Popup Support Window */}
      <div 
        ref={popupRef}
        className={`wa-popup ${isOpen ? 'active' : ''}`} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="waPopupTitle"
      >
        <button 
          className="wa-popup-close" 
          id="waCloseBtn" 
          onClick={closePopup} 
          aria-label="Close Support Window"
          data-hover-type="link"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="wa-popup-header">
          <div className="wa-popup-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div className="wa-popup-title-wrap">
            <h3 id="waPopupTitle">Try an AI Demo</h3>
            <p className="wa-popup-subtitle" id="waPopupSubtitle">{subtitle}</p>
          </div>
        </div>
        
        <div className="wa-popup-content">
          <div className="wa-response-badge">
            <span className="wa-online-dot"></span>
            <div className="wa-badge-text">
              <span className="wa-badge-title">Online Now</span>
              <span className="wa-badge-sub">Usually replies within 1 hour</span>
            </div>
          </div>
          
          <div className="wa-services">
            <p style={{ fontSize: '0.8rem', color: '#FFFFFF', marginBottom: '8px', fontWeight: 500 }}>Select what you need help with:</p>
            <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {services.map((service, idx) => (
                <li 
                  key={idx}
                  onClick={() => setSelectedService(selectedService === service ? null : service)}
                  className={`interactive ${selectedService === service ? 'selected' : ''}`}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedService === service ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: selectedService === service ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(255,255,255,0.06)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    color: selectedService === service ? '#22c55e' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  data-hover-type="link"
                >
                  <span>{service}</span>
                  {selectedService === service && (
                    <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="wa-popup-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary wa-btn-primary" onClick={startChat} data-hover-type="link" style={{ flex: 1, padding: '10px 14px', fontSize: '0.82rem' }}>
              Start WhatsApp Chat
            </button>
            <button className="btn btn-outline wa-btn-secondary" onClick={closePopup} data-hover-type="link" style={{ padding: '10px 14px', fontSize: '0.82rem' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
