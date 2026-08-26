import{n as e}from"./rolldown-runtime-CbXtAM7H.js";import{i as t,n,r,t as i}from"./Footer-Wy2J2AUt.js";import{c as a,l as o,o as s,s as c}from"./vendor-animation-wt3IwUga.js";import{t as l}from"./vendor-core-Df_DmVTs.js";import{t as u}from"./vendor-scroll-C9A3lpHu.js";import{A as d,T as f,f as p,h as m,u as h,v as g}from"./vendor-icons-CtUKgVYZ.js";/* empty css              */var _=l(),v=e(o(),1),y=s();function b(){let e=(0,v.useRef)(null),t=(0,v.useRef)(null),n=(0,v.useRef)(null),r=(0,v.useRef)(null);return(0,v.useEffect)(()=>{a.timeline({defaults:{ease:`power3.out`}}).fromTo(t.current,{opacity:0,y:40},{opacity:1,y:0,duration:1,delay:.2}).fromTo(n.current,{opacity:0,y:24},{opacity:1,y:0,duration:.8},`-=0.6`).fromTo(r.current,{opacity:0,y:20},{opacity:1,y:0,duration:.8},`-=0.4`)},[]),(0,y.jsxs)(`section`,{ref:e,className:`about-cinematic-hero`,children:[(0,y.jsx)(`div`,{className:`about-hero-bg-layer`}),(0,y.jsx)(`div`,{className:`about-hero-gradient-overlay`}),(0,y.jsxs)(`div`,{className:`about-container about-hero-content-wrapper`,children:[(0,y.jsxs)(`div`,{className:`about-hero-left-col`,children:[(0,y.jsx)(`h1`,{ref:t,className:`about-hero-main-title`,children:`About Us`}),(0,y.jsx)(`p`,{ref:n,className:`about-hero-subtitle`,children:`Crafting compelling stories one frame at a time`})]}),(0,y.jsxs)(`div`,{ref:r,className:`about-hero-scroll-indicator`,children:[(0,y.jsx)(`span`,{className:`about-hero-scroll-text`,children:`scroll`}),(0,y.jsx)(`div`,{className:`about-hero-scroll-line-track`,children:(0,y.jsx)(`div`,{className:`about-hero-scroll-line-thumb`})})]})]}),(0,y.jsx)(`style`,{dangerouslySetInnerHTML:{__html:`
        .about-cinematic-hero {
          position: relative;
          width: 100%;
          min-height: 92vh;
          display: flex;
          align-items: center;
          background-color: #000000;
          overflow: hidden;
          box-sizing: border-box;
          padding-top: 100px;
          padding-bottom: 80px;
        }

        /* Studio Background Image */
        .about-hero-bg-layer {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          background-image: url('/image/about_hero_bg.jpg');
          background-size: cover;
          background-position: center right;
          background-repeat: no-repeat;
          z-index: 1;
          opacity: 0.92;
        }

        /* Seamless Gradient Fade to Black on the Left and Bottom */
        .about-hero-gradient-overlay {
          position: absolute;
          inset: 0;
          background: 
            linear-gradient(90deg, #000000 0%, #000000 28%, rgba(0, 0, 0, 0.85) 48%, rgba(0, 0, 0, 0.35) 75%, rgba(0, 0, 0, 0.05) 100%),
            linear-gradient(to top, #050507 0%, rgba(5, 5, 7, 0.6) 15%, transparent 40%),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, transparent 20%);
          z-index: 2;
          pointer-events: none;
        }

        .about-hero-content-wrapper {
          position: relative;
          z-index: 3;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 60vh;
          padding: 0 40px;
          box-sizing: border-box;
        }

        .about-hero-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 680px;
          margin-top: 40px;
        }

        .about-hero-main-title {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: clamp(52px, 7vw, 92px) !important;
          font-weight: 700 !important;
          color: #FFFFFF !important;
          line-height: 1.02;
          letter-spacing: -0.035em;
          margin: 0 0 16px 0;
          text-shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
        }

        .about-hero-subtitle {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: clamp(17px, 1.6vw, 22px) !important;
          font-weight: 400 !important;
          color: rgba(255, 255, 255, 0.82) !important;
          line-height: 1.4;
          letter-spacing: -0.01em;
          margin: 0;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
        }

        /* Lower Left Vertical Scroll Indicator */
        .about-hero-scroll-indicator {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
          margin-top: 80px;
        }

        .about-hero-scroll-text {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 13px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: 0.05em;
          text-transform: lowercase;
        }

        .about-hero-scroll-line-track {
          width: 2px;
          height: 54px;
          background-color: rgba(255, 255, 255, 0.15);
          position: relative;
          overflow: hidden;
          border-radius: 2px;
        }

        .about-hero-scroll-line-thumb {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 24px;
          background: #FFFFFF;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
          animation: scrollLineMove 2.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        @keyframes scrollLineMove {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(220%);
            opacity: 0;
          }
        }

        @media (max-width: 960px) {
          .about-cinematic-hero {
            min-height: 85vh;
            padding-top: 90px;
          }

          .about-hero-bg-layer {
            background-position: 70% center;
            opacity: 0.65;
          }

          .about-hero-gradient-overlay {
            background: linear-gradient(to top, #050507 0%, rgba(0, 0, 0, 0.85) 50%, rgba(0, 0, 0, 0.65) 100%);
          }

          .about-hero-content-wrapper {
            padding: 0 24px;
            min-height: 50vh;
          }

          .about-hero-main-title {
            font-size: 48px !important;
          }

          .about-hero-subtitle {
            font-size: 16px !important;
          }

          .about-hero-scroll-indicator {
            margin-top: 48px;
          }
        }
      `}})]})}function x(){return(0,y.jsx)(`section`,{className:`about-section`,children:(0,y.jsxs)(`div`,{className:`about-container`,style:{display:`flex`,flexWrap:`wrap`,gap:`48px`,alignItems:`center`},children:[(0,y.jsxs)(`div`,{className:`about-fade-up`,style:{flex:`1 1 50%`,minWidth:`300px`},children:[(0,y.jsx)(`div`,{className:`chrome-badge`,style:{marginBottom:`20px`},children:`WHO WE ARE`}),(0,y.jsxs)(`h2`,{style:{fontSize:`clamp(36px, 5vw, 64px)`,fontWeight:300,lineHeight:1.05,color:`var(--about-text-primary)`,textTransform:`uppercase`,letterSpacing:`-0.03em`},children:[`Built For The`,(0,y.jsx)(`br`,{}),`Next Generation`,(0,y.jsx)(`br`,{}),`Of Video.`]})]}),(0,y.jsxs)(`div`,{className:`about-fade-up`,style:{flex:`1 1 45%`,minWidth:`300px`,display:`flex`,flexDirection:`column`,gap:`20px`},children:[(0,y.jsxs)(`div`,{style:{fontSize:`15px`,color:`var(--about-text-secondary)`,lineHeight:1.8,display:`flex`,flexDirection:`column`,gap:`16px`,fontWeight:300},children:[(0,y.jsx)(`p`,{children:`MotionNodeEdits was created to help brands produce high-quality videos with less effort, faster workflows, and the possibilities of modern AI technology.`}),(0,y.jsx)(`p`,{children:`Businesses need powerful video content for marketing, advertising, branding, and communication — but traditional production can require significant time, resources, and effort.`}),(0,y.jsx)(`p`,{children:`MotionNodeEdits brings AI-powered production into the process to help brands create better video content, faster.`})]}),(0,y.jsx)(`div`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.2em`,color:`var(--about-silver-bright)`,marginTop:`8px`,fontWeight:600},children:`EST. 2024 · HYDERABAD, INDIA · GLOBAL CLIENTS`}),(0,y.jsxs)(`div`,{className:`saas-card`,style:{height:`180px`,borderRadius:`16px`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,padding:`24px 32px`,position:`relative`,marginTop:`12px`},children:[(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`div`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.15em`,color:`var(--about-text-tertiary)`,marginBottom:`6px`},children:`STUDIO PRODUCTION`}),(0,y.jsx)(`div`,{style:{fontFamily:`var(--about-font-heading)`,fontSize:`24px`,color:`#FFFFFF`,fontWeight:300},children:`High-Fidelity AI Workflows`})]}),(0,y.jsx)(`img`,{src:`/image/mne_logo.png`,alt:`Logo`,style:{width:`48px`,height:`48px`,borderRadius:`50%`,border:`1px solid rgba(255,255,255,0.2)`,opacity:.8}})]})]})]})})}a.registerPlugin(c);function S(){let e=(0,v.useRef)(null),t=(0,v.useRef)(null),n=(0,v.useRef)([]);return(0,v.useEffect)(()=>{let t=e.current,r=n.current.filter(Boolean);if(!t||r.length===0)return;let i=a.matchMedia();i.add(`(min-width: 961px) and (prefers-reduced-motion: no-preference)`,()=>{a.set(r[0],{y:0,opacity:1,scale:1,zIndex:4});for(let e=1;e<r.length;e++)a.set(r[e],{y:140,opacity:0,scale:.94,zIndex:4-e});let e=a.timeline({scrollTrigger:{trigger:t,pin:!0,start:`top top`,end:`+=2400`,scrub:.8,invalidateOnRefresh:!0,anticipatePin:1}});return e.to({},{duration:.3}),e.to(r[0],{y:-140,opacity:0,scale:.94,duration:.8,ease:`power2.inOut`},`step1`),e.to(r[1],{y:0,opacity:1,scale:1,duration:.8,ease:`power2.inOut`},`step1`),e.to({},{duration:.4}),e.to(r[1],{y:-140,opacity:0,scale:.94,duration:.8,ease:`power2.inOut`},`step2`),e.to(r[2],{y:0,opacity:1,scale:1,duration:.8,ease:`power2.inOut`},`step2`),e.to({},{duration:.4}),e.to(r[2],{y:-140,opacity:0,scale:.94,duration:.8,ease:`power2.inOut`},`step3`),e.to(r[3],{y:0,opacity:1,scale:1,duration:.8,ease:`power2.inOut`},`step3`),e.to({},{duration:.4}),()=>{e.kill()}}),i.add(`(max-width: 960px), (prefers-reduced-motion: reduce)`,()=>{r.forEach(e=>{a.set(e,{y:0,opacity:1,scale:1,position:`relative`})})});let o=setTimeout(()=>{c.refresh()},200);return()=>{clearTimeout(o),i.revert()}},[]),(0,y.jsxs)(`section`,{ref:e,className:`why-us-stacked-section`,id:`why-us`,children:[(0,y.jsxs)(`div`,{className:`about-container why-us-stacked-container`,children:[(0,y.jsxs)(`div`,{className:`why-us-fixed-left-col`,children:[(0,y.jsx)(`div`,{className:`chrome-badge`,style:{marginBottom:`20px`},children:`WHY WORK WITH US`}),(0,y.jsxs)(`h2`,{className:`why-us-main-heading`,children:[`Why`,(0,y.jsx)(`br`,{}),`MotionNodeEdits?`]}),(0,y.jsx)(`p`,{className:`why-us-left-sub`,children:`Built on creative direction, uncompromised quality standards, and modern generative AI technology.`})]}),(0,y.jsx)(`div`,{ref:t,className:`why-us-card-viewport`,children:[{num:`01`,title:`CREATIVITY`,text:`Ideas come first. Every video starts with a clear concept and creative direction before any AI tool is used.`},{num:`02`,title:`QUALITY`,text:`Every frame matters. We review, refine, and edit until the final video meets our quality standard.`},{num:`03`,title:`SPEED`,text:`Move faster without losing the creative vision. AI lets us compress timelines without compressing quality.`},{num:`04`,title:`TECHNOLOGY`,text:`We continuously explore what is next in AI video — using the latest models, tools, and techniques for every project.`}].map((e,t)=>(0,y.jsxs)(`div`,{ref:e=>n.current[t]=e,className:`why-us-card-item`,children:[(0,y.jsx)(`div`,{className:`why-us-card-top-row`,children:(0,y.jsx)(`span`,{className:`why-us-highlight-num`,children:e.num})}),(0,y.jsx)(`h3`,{className:`why-us-card-title`,children:e.title}),(0,y.jsx)(`p`,{className:`why-us-card-desc`,children:e.text})]},t))})]}),(0,y.jsx)(`style`,{dangerouslySetInnerHTML:{__html:`
        .why-us-stacked-section {
          background-color: var(--about-bg-primary, #050507);
          color: var(--about-text-primary, #FFFFFF);
          position: relative;
          width: 100%;
          min-height: 100vh;
          height: 100vh;
          display: flex;
          align-items: center;
          border-top: 1px solid var(--about-border, rgba(255, 255, 255, 0.07));
          overflow: hidden;
          box-sizing: border-box;
          z-index: 10;
        }

        .why-us-stacked-container {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 64px;
          align-items: center;
          width: 100%;
          padding: 0 40px;
          box-sizing: border-box;
          position: relative;
        }

        /* Left Stationary Column */
        .why-us-fixed-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          z-index: 2;
          max-width: 440px;
        }

        .why-us-main-heading {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: clamp(32px, 3.8vw, 48px) !important;
          font-weight: 300;
          line-height: 1.08;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          margin: 0 0 16px 0;
        }

        .why-us-left-sub {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 14.5px;
          line-height: 1.7;
          color: var(--about-text-secondary, #8E8F94);
          font-weight: 300;
          margin: 0;
        }

        /* Right Viewport: Holds cards in the exact same focal center */
        .why-us-card-viewport {
          position: relative;
          height: 320px;
          width: 100%;
          max-width: 580px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Card Items: Overlaid in the center, animating vertically */
        .why-us-card-item {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          padding: 38px 42px;
          box-sizing: border-box;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.75);
          background-color: rgba(22, 22, 34, 0.96);
          box-shadow: 
            0 0 45px rgba(255, 255, 255, 0.25),
            0 20px 48px rgba(0, 0, 0, 0.8),
            inset 0 1px 2px rgba(255, 255, 255, 0.5);
          display: flex;
          flex-direction: column;
          justify-content: center;
          will-change: transform, opacity;
        }

        .why-us-card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        /* Standout Numbers */
        .why-us-highlight-num {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif);
          font-size: 58px;
          font-weight: 400;
          line-height: 1;
          color: #FFFFFF;
          letter-spacing: -0.02em;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
        }

        .why-us-card-title {
          font-family: var(--about-font-heading, 'Cormorant Garamond', serif) !important;
          font-size: 26px;
          font-weight: 300;
          color: #FFFFFF;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: -0.01em;
        }

        .why-us-card-desc {
          font-family: var(--about-font-sans, 'Plus Jakarta Sans', sans-serif);
          font-size: 14.5px;
          color: #E2E8F0;
          line-height: 1.7;
          margin: 0;
          font-weight: 300;
        }

        /* Mobile Responsive */
        @media (max-width: 960px) {
          .why-us-stacked-section {
            min-height: auto;
            height: auto;
            padding: 70px 0;
          }

          .why-us-stacked-container {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 0 20px;
          }

          .why-us-card-viewport {
            height: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .why-us-card-item {
            position: relative;
            top: auto;
            left: auto;
            height: auto;
            min-height: auto;
            opacity: 1 !important;
            transform: none !important;
            padding: 28px 24px;
          }

          .why-us-main-heading {
            font-size: 32px !important;
          }

          .why-us-highlight-num {
            font-size: 44px;
          }
        }
      `}})]})}function C(){return(0,y.jsx)(`section`,{style:{padding:`130px 0`},children:(0,y.jsxs)(`div`,{className:`about-container`,style:{display:`flex`,flexWrap:`wrap`,gap:`60px`,alignItems:`center`},children:[(0,y.jsxs)(`div`,{className:`about-fade-up`,style:{flex:`1 1 40%`,minWidth:`300px`},children:[(0,y.jsx)(`div`,{className:`chrome-badge`,style:{marginBottom:`20px`},children:`OUR BENCHMARK`}),(0,y.jsxs)(`h2`,{style:{fontSize:`clamp(32px, 4.5vw, 56px)`,fontWeight:300,color:`var(--about-text-primary)`,maxWidth:`480px`,margin:0,lineHeight:1.1,textTransform:`uppercase`,letterSpacing:`-0.02em`},children:[`AI Is The Technology.`,(0,y.jsx)(`br`,{}),`Quality Is The Standard.`]})]}),(0,y.jsx)(`div`,{className:`about-fade-up`,style:{flex:`1 1 50%`,minWidth:`300px`,display:`flex`,flexDirection:`column`},children:[{title:`VISUAL QUALITY`,desc:`High-resolution AI-generated visuals, rendered with intentional composition and aesthetic direction.`},{title:`STORYTELLING`,desc:`Every video needs a clear purpose and message. We ensure the narrative is structured before production begins.`},{title:`EDITING`,desc:`Professional pacing, composition, sound design, transitions, and refinement — applied after AI generation.`},{title:`BRAND CONSISTENCY`,desc:`The final video should feel aligned with the client's brand, tone, and visual identity.`}].map((e,t)=>(0,y.jsxs)(`div`,{style:{padding:`28px 0`,borderTop:`1px solid var(--about-border)`,display:`flex`,flexDirection:`column`,gap:`8px`},children:[(0,y.jsx)(`h3`,{style:{fontFamily:`var(--about-font-heading)`,fontSize:`20px`,fontWeight:300,color:`var(--about-text-primary)`,margin:0,textTransform:`uppercase`,letterSpacing:`0.02em`},children:e.title}),(0,y.jsx)(`p`,{style:{fontSize:`13px`,color:`var(--about-text-secondary)`,lineHeight:1.7,margin:0,fontWeight:300},children:e.desc})]},t))})]})})}function w(){return(0,y.jsx)(`section`,{style:{padding:`130px 0`},children:(0,y.jsxs)(`div`,{className:`about-container`,children:[(0,y.jsxs)(`div`,{className:`about-fade-up`,style:{marginBottom:`64px`},children:[(0,y.jsx)(`div`,{className:`chrome-badge`,style:{marginBottom:`16px`},children:`LEADERSHIP`}),(0,y.jsx)(`h2`,{style:{fontSize:`clamp(32px, 4.5vw, 56px)`,fontWeight:300,color:`var(--about-text-primary)`,textTransform:`uppercase`,letterSpacing:`-0.02em`},children:`Behind MotionNodeEdits.`})]}),(0,y.jsxs)(`div`,{style:{display:`flex`,flexWrap:`wrap`,gap:`64px`,alignItems:`center`},children:[(0,y.jsx)(`div`,{className:`about-fade-up`,style:{flex:`1 1 38%`,minWidth:`280px`},children:(0,y.jsxs)(`div`,{className:`saas-card`,style:{width:`100%`,aspectRatio:`3/4`,borderRadius:`20px`,display:`flex`,flexDirection:`column`,alignItems:`center`,justifyContent:`center`,position:`relative`,padding:`32px`},children:[(0,y.jsx)(`div`,{style:{width:`100px`,height:`100px`,borderRadius:`50%`,background:`radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)`,border:`1px solid rgba(255,255,255,0.15)`,display:`flex`,alignItems:`center`,justifyContent:`center`,marginBottom:`20px`,boxShadow:`0 0 30px rgba(255,255,255,0.15)`},children:(0,y.jsx)(`img`,{src:`/image/mne_logo.png`,alt:`MotionNodeEdits Emblem`,style:{width:`70px`,height:`70px`,borderRadius:`50%`}})}),(0,y.jsx)(`span`,{style:{color:`var(--about-silver-bright)`,fontSize:`11px`,letterSpacing:`0.18em`,textTransform:`uppercase`,fontWeight:600},children:`FOUNDER & CREATIVE LEAD`})]})}),(0,y.jsxs)(`div`,{className:`about-fade-up`,style:{flex:`1 1 52%`,minWidth:`300px`},children:[(0,y.jsx)(`h3`,{style:{fontFamily:`var(--about-font-heading)`,fontSize:`36px`,fontWeight:300,color:`#FFFFFF`,marginBottom:`4px`,letterSpacing:`-0.01em`},children:`Vutukuri Sai Teja`}),(0,y.jsx)(`div`,{style:{fontSize:`12px`,textTransform:`uppercase`,letterSpacing:`0.18em`,color:`var(--about-silver-dark)`,fontWeight:600,marginBottom:`28px`},children:`FOUNDER / CREATIVE DIRECTOR`}),(0,y.jsxs)(`div`,{style:{fontSize:`15px`,color:`var(--about-text-secondary)`,lineHeight:1.8,display:`flex`,flexDirection:`column`,gap:`18px`,marginBottom:`36px`,fontWeight:300},children:[(0,y.jsx)(`p`,{children:`MotionNodeEdits was born from a clear conviction: the tools to craft cinematic, high-converting visual stories are evolving at lightning speed, and modern brands deserve an agile partner that masterfully harnesses this new era.`}),(0,y.jsx)(`p`,{children:`With expertise spanning post-production editing, AI generative workflows, and creative direction, we build bespoke video experiences that elevate brand authority globally.`})]}),(0,y.jsx)(`div`,{style:{position:`relative`,paddingLeft:`24px`,borderLeft:`2px solid #FFFFFF`},children:(0,y.jsx)(`p`,{style:{fontFamily:`var(--about-font-heading)`,fontSize:`22px`,fontStyle:`italic`,color:`#FFFFFF`,margin:0,lineHeight:1.5,fontWeight:300},children:`"Technology is the engine. Emotion, storytelling, and meticulous craft are what make it extraordinary."`})})]})]})]})})}function T(){return(0,y.jsxs)(`section`,{style:{height:`520px`,backgroundColor:`var(--about-bg-primary)`,position:`relative`,display:`flex`,alignItems:`center`,justifyContent:`center`,overflow:`hidden`,borderTop:`1px solid var(--about-border)`,borderBottom:`1px solid var(--about-border)`},children:[(0,y.jsx)(`div`,{style:{position:`absolute`,inset:0,zIndex:0,display:`flex`,alignItems:`center`,justifyContent:`center`,opacity:.4},children:(0,y.jsxs)(`div`,{style:{position:`relative`,width:`80%`,height:`80%`,maxWidth:`1000px`},children:[(0,y.jsx)(`div`,{className:`about-globe-dot`,style:{top:`40%`,left:`20%`}}),(0,y.jsx)(`div`,{className:`about-globe-dot`,style:{top:`30%`,left:`45%`}}),(0,y.jsx)(`div`,{className:`about-globe-dot`,style:{top:`25%`,left:`50%`}}),(0,y.jsx)(`div`,{className:`about-globe-dot`,style:{top:`45%`,left:`60%`}}),(0,y.jsx)(`div`,{className:`about-globe-dot`,style:{top:`55%`,left:`70%`,background:`#FFFFFF`,boxShadow:`0 0 16px #FFFFFF`}}),` `,(0,y.jsx)(`div`,{className:`about-globe-dot`,style:{top:`65%`,left:`80%`}}),(0,y.jsx)(`div`,{className:`about-globe-dot`,style:{top:`75%`,left:`85%`}}),(0,y.jsxs)(`svg`,{style:{position:`absolute`,inset:0,width:`100%`,height:`100%`},pointerEvents:`none`,children:[(0,y.jsx)(`path`,{d:`M 20% 40% Q 45% 20% 70% 55%`,fill:`transparent`,stroke:`rgba(255,255,255,0.15)`,strokeWidth:`1`,strokeDasharray:`4 4`}),(0,y.jsx)(`path`,{d:`M 45% 30% Q 55% 40% 70% 55%`,fill:`transparent`,stroke:`rgba(255,255,255,0.15)`,strokeWidth:`1`,strokeDasharray:`4 4`}),(0,y.jsx)(`path`,{d:`M 85% 75% Q 75% 60% 70% 55%`,fill:`transparent`,stroke:`rgba(255,255,255,0.15)`,strokeWidth:`1`,strokeDasharray:`4 4`})]})]})}),(0,y.jsxs)(`div`,{className:`about-container`,style:{position:`relative`,zIndex:1,textAlign:`center`},children:[(0,y.jsx)(`div`,{className:`about-fade-up`,style:{marginBottom:`16px`},children:(0,y.jsx)(`span`,{className:`chrome-badge`,children:`WORLDWIDE REACH`})}),(0,y.jsx)(`h2`,{className:`about-fade-up`,style:{fontSize:`clamp(32px, 4.5vw, 60px)`,fontWeight:300,color:`var(--about-text-primary)`,marginBottom:`20px`,textTransform:`uppercase`,letterSpacing:`-0.02em`},children:`From India To The World.`}),(0,y.jsx)(`p`,{className:`about-fade-up`,style:{fontSize:`16px`,color:`var(--about-text-secondary)`,maxWidth:`560px`,margin:`0 auto`,lineHeight:1.8,fontWeight:300},children:`MotionNodeEdits works with visionary clients globally, delivering AI-powered video solutions across industries and creative needs.`})]}),(0,y.jsx)(`style`,{dangerouslySetInnerHTML:{__html:`
        .about-globe-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          background-color: rgba(255,255,255,0.6);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: pulseGlobe 2s infinite alternate;
        }
        @keyframes pulseGlobe {
          0% { box-shadow: 0 0 0px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 14px rgba(255,255,255,0.9); }
        }
        @media (max-width: 768px) {
          section[style*="height: 520px"] {
             height: auto !important;
             padding: 100px 0;
          }
        }
      `}})]})}function E(){return(0,y.jsx)(`section`,{style:{padding:`160px 0`,position:`relative`,display:`flex`,alignItems:`center`,justifyContent:`center`,textAlign:`center`,backgroundColor:`#050507`,backgroundImage:`radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 70%)`},children:(0,y.jsxs)(`div`,{className:`about-container`,style:{position:`relative`,zIndex:1},children:[(0,y.jsx)(`div`,{className:`about-fade-up`,style:{marginBottom:`20px`},children:(0,y.jsx)(`span`,{className:`chrome-badge`,children:`START YOUR PROJECT`})}),(0,y.jsxs)(`h2`,{className:`about-fade-up`,style:{fontSize:`clamp(36px, 6vw, 76px)`,fontWeight:300,color:`#FFFFFF`,lineHeight:1.05,margin:`0 0 28px 0`,textTransform:`uppercase`,letterSpacing:`-0.03em`},children:[`Have An Idea?`,(0,y.jsx)(`br`,{}),`Let's Turn It Into Video.`]}),(0,y.jsx)(`p`,{className:`about-fade-up`,style:{fontSize:`16px`,color:`var(--about-text-secondary)`,maxWidth:`520px`,margin:`0 auto 40px auto`,lineHeight:1.7,fontWeight:300},children:`Tell us what you're imagining. We'll help turn your concept into a high-impact, cinematic AI video.`}),(0,y.jsxs)(`div`,{className:`about-fade-up`,style:{display:`flex`,gap:`16px`,justifyContent:`center`,flexWrap:`wrap`},children:[(0,y.jsx)(`a`,{href:`/#contact`,className:`about-btn-primary`,children:`START A PROJECT`}),(0,y.jsx)(`a`,{href:`/work.html`,className:`about-btn-secondary`,children:`VIEW OUR WORK`})]})]})})}function D(){let e=[{q:`Which package is best for me?`,a:`We offer flexible production tiers customized for your specific brand objectives — including High-Converting AI Commercial Ads, AI Talking Avatar Videos, 3D Product Showcases, and Ongoing Monthly Social Media Retainers. If you are unsure, reach out for a consultation and we will tailor the optimal workflow for your goals.`},{q:`Why should we choose your service?`,a:`MotionNodeEdits bridges state-of-the-art generative AI technologies with high-end cinema-grade post-production, sound engineering, color grading, and editorial direction. You receive studio-quality commercial video assets delivered 10x faster and at a fraction of traditional production budgets.`},{q:`Can I cancel at any time?`,a:`Yes, absolutely. For our monthly retainer workflows, there are no lock-in contracts or long-term obligations—you can pause or cancel anytime with zero friction. For one-off custom projects, payments are transparently structured on milestone deliverables.`},{q:`How long does the video process take?`,a:`Standard AI commercial ads, short-form reels, and talking avatar videos are typically delivered within 48 to 72 hours. Comprehensive campaigns, custom 3D animations, and cinematic brand films take 5 to 7 business days. Rush delivery is always available upon request.`},{q:`How can I send big files to you?`,a:`You can easily share your brand assets, logo vectors, product guidelines, and footage through Google Drive, Dropbox, WeTransfer, or Frame.io. Upon project initiation, we set up a dedicated cloud folder for seamless asset management.`},{q:`I have a big project and it's a bit complex.`,a:`We specialize in complex, high-scale productions. Whether you need multi-lingual AI localization in 30+ languages, custom digital twin avatars, full 3D environment generation, or 50+ ad variations per month, we build a dedicated workflow and assign specialized editors to your brand.`},{q:`What if I don't like my video and how do revisions work?`,a:`Every project includes dedicated revision rounds. You can leave precise timestamped notes, and our creative team will refine the visuals, pacing, audio, color grading, and animations until the video perfectly aligns with your creative vision.`},{q:`Can you create videos completely from just an idea?`,a:`Yes! You only need to share your vision, product link, or campaign goal. We manage the entire end-to-end creative workflow: scriptwriting, storyboard generation, generative AI asset creation, voice synthesis, sound design, and final 4K master delivery.`}],[t,n]=(0,v.useState)(0),r=e=>{n(t===e?null:e)};return(0,y.jsxs)(`section`,{className:`about-section`,id:`faq`,style:{borderTop:`1px solid var(--about-border)`,position:`relative`},children:[(0,y.jsxs)(`div`,{className:`about-container`,children:[(0,y.jsx)(`div`,{className:`about-fade-up`,style:{display:`flex`,justifyContent:`flex-end`,marginBottom:`36px`},children:(0,y.jsx)(`span`,{style:{fontFamily:`var(--about-font-heading)`,fontSize:`clamp(26px, 3.2vw, 42px)`,fontWeight:300,color:`var(--about-text-primary)`,letterSpacing:`-0.02em`,textTransform:`uppercase`,textAlign:`right`},children:`You have questions. We have answers.`})}),(0,y.jsxs)(`div`,{className:`faq-website-theme-grid`,children:[(0,y.jsxs)(`div`,{className:`about-fade-up faq-theme-left-col`,children:[(0,y.jsx)(`div`,{className:`chrome-badge`,style:{marginBottom:`20px`},children:`FREQUENTLY ASKED QUESTIONS`}),(0,y.jsxs)(`h2`,{style:{fontFamily:`var(--about-font-heading)`,fontSize:`clamp(38px, 4.5vw, 62px)`,fontWeight:300,lineHeight:1.05,color:`var(--about-text-primary)`,textTransform:`uppercase`,letterSpacing:`-0.03em`,margin:`0 0 20px 0`},children:[`Frequently`,(0,y.jsx)(`br`,{}),`asked `,(0,y.jsx)(`span`,{className:`chrome-text`,style:{fontWeight:400},children:`questions`})]}),(0,y.jsx)(`p`,{style:{fontFamily:`var(--about-font-sans)`,fontSize:`14.5px`,lineHeight:1.75,color:`var(--about-text-secondary)`,fontWeight:300,margin:`0 0 32px 0`,maxWidth:`480px`},children:`(Find answers to frequently asked questions about MotionNodeEdits, our range of AI video production services, how we operate, and insights on maximizing the benefits of our agency services.)`}),(0,y.jsxs)(`div`,{className:`saas-card faq-theme-info-card`,children:[(0,y.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,justifyContent:`space-between`,marginBottom:`20px`,paddingBottom:`16px`,borderBottom:`1px solid var(--about-border)`},children:[(0,y.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`12px`},children:[(0,y.jsx)(`img`,{src:`/image/mne_logo.png`,alt:`MotionNodeEdits Logo`,style:{width:`40px`,height:`40px`,borderRadius:`50%`,border:`1px solid rgba(255, 255, 255, 0.2)`,boxShadow:`0 2px 10px rgba(0,0,0,0.5)`}}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`div`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.16em`,color:`var(--about-silver-bright)`,fontWeight:600},children:`MOTIONNODEEDITS`}),(0,y.jsx)(`div`,{style:{fontSize:`11px`,color:`var(--about-text-tertiary)`,letterSpacing:`0.08em`},children:`AI VIDEO PRODUCTION`})]})]}),(0,y.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`6px`,fontSize:`10px`,textTransform:`uppercase`,letterSpacing:`0.12em`,color:`#FFFFFF`,background:`rgba(255, 255, 255, 0.06)`,padding:`4px 10px`,borderRadius:`100px`,border:`1px solid rgba(255, 255, 255, 0.12)`},children:[(0,y.jsx)(`span`,{style:{width:`5px`,height:`5px`,borderRadius:`50%`,background:`#FFFFFF`,boxShadow:`0 0 6px #FFFFFF`}}),`ACTIVE`]})]}),(0,y.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`,marginBottom:`22px`},children:[(0,y.jsxs)(`div`,{style:{display:`flex`,alignItems:`flex-start`,gap:`12px`},children:[(0,y.jsx)(g,{size:16,style:{color:`var(--about-silver-mid)`,marginTop:`2px`,flexShrink:0}}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`div`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.12em`,color:`var(--about-text-tertiary)`,marginBottom:`2px`},children:`EMAIL`}),(0,y.jsx)(`a`,{href:`mailto:motionnodeedits@gmail.com`,style:{fontFamily:`var(--about-font-sans)`,fontSize:`13.5px`,color:`var(--about-silver-bright)`,textDecoration:`none`,transition:`color 0.2s`},onMouseEnter:e=>e.currentTarget.style.color=`#FFFFFF`,onMouseLeave:e=>e.currentTarget.style.color=`var(--about-silver-bright)`,children:`motionnodeedits@gmail.com`})]})]}),(0,y.jsxs)(`div`,{style:{display:`flex`,alignItems:`flex-start`,gap:`12px`},children:[(0,y.jsx)(p,{size:16,style:{color:`var(--about-silver-mid)`,marginTop:`2px`,flexShrink:0}}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`div`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.12em`,color:`var(--about-text-tertiary)`,marginBottom:`2px`},children:`PHONE & WHATSAPP`}),(0,y.jsx)(`a`,{href:`tel:+918985351756`,style:{fontFamily:`var(--about-font-sans)`,fontSize:`13.5px`,color:`var(--about-silver-bright)`,textDecoration:`none`,transition:`color 0.2s`},onMouseEnter:e=>e.currentTarget.style.color=`#FFFFFF`,onMouseLeave:e=>e.currentTarget.style.color=`var(--about-silver-bright)`,children:`+91 89853 51756`})]})]}),(0,y.jsxs)(`div`,{style:{display:`flex`,alignItems:`flex-start`,gap:`12px`},children:[(0,y.jsx)(f,{size:16,style:{color:`var(--about-silver-mid)`,marginTop:`2px`,flexShrink:0}}),(0,y.jsxs)(`div`,{children:[(0,y.jsx)(`div`,{style:{fontSize:`11px`,textTransform:`uppercase`,letterSpacing:`0.12em`,color:`var(--about-text-tertiary)`,marginBottom:`2px`},children:`BUSINESS HOURS`}),(0,y.jsx)(`div`,{style:{fontFamily:`var(--about-font-sans)`,fontSize:`13px`,color:`var(--about-text-secondary)`,fontWeight:300},children:`Monday – Saturday : 9:00 AM – 7:00 PM IST`})]})]})]}),(0,y.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`10px`,paddingTop:`16px`,borderTop:`1px solid var(--about-border)`},children:[(0,y.jsxs)(`a`,{href:`https://wa.me/918985351756?text=Hi%20MotionNodeEdits,%20I%20have%20a%20question%20about%20your%20services`,target:`_blank`,rel:`noopener noreferrer`,className:`about-btn-primary`,style:{height:`42px`,fontSize:`11px`,padding:`0 16px`,gap:`6px`},children:[(0,y.jsx)(m,{size:13}),(0,y.jsx)(`span`,{children:`WhatsApp`})]}),(0,y.jsxs)(`a`,{href:`mailto:motionnodeedits@gmail.com?subject=Project%20Inquiry%20-%20MotionNodeEdits`,className:`about-btn-secondary`,style:{height:`42px`,fontSize:`11px`,padding:`0 16px`,gap:`6px`},children:[(0,y.jsx)(h,{size:13}),(0,y.jsx)(`span`,{children:`Email Us`})]})]})]})]}),(0,y.jsx)(`div`,{className:`about-fade-up faq-theme-right-col`,children:(0,y.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`14px`},children:e.map((e,n)=>{let i=t===n;return(0,y.jsxs)(`div`,{className:`faq-theme-pill-card ${i?`is-open`:``}`,style:{background:i?`rgba(255, 255, 255, 0.05)`:`rgba(255, 255, 255, 0.025)`,border:i?`1px solid rgba(255, 255, 255, 0.35)`:`1px solid var(--about-border)`,borderRadius:`16px`,overflow:`hidden`,transition:`all 0.35s cubic-bezier(0.16, 1, 0.3, 1)`,boxShadow:i?`0 12px 30px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15)`:`0 4px 16px rgba(0, 0, 0, 0.3)`},children:[(0,y.jsxs)(`button`,{onClick:()=>r(n),style:{width:`100%`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,padding:`22px 26px`,background:`none`,border:`none`,cursor:`pointer`,textAlign:`left`,fontFamily:`var(--about-font-sans)`,gap:`16px`},className:`faq-theme-btn`,"aria-expanded":i,children:[(0,y.jsx)(`span`,{style:{fontSize:`15.5px`,fontWeight:500,color:i?`#FFFFFF`:`var(--about-silver-bright)`,letterSpacing:`-0.01em`,transition:`color 0.2s ease`,lineHeight:1.4},children:e.q}),(0,y.jsx)(`div`,{style:{color:i?`#FFFFFF`:`var(--about-silver-dark)`,flexShrink:0,display:`flex`,alignItems:`center`,justifyContent:`center`,transform:i?`rotate(180deg)`:`rotate(0deg)`,transition:`transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s`},children:(0,y.jsx)(d,{size:18})})]}),(0,y.jsx)(`div`,{style:{maxHeight:i?`360px`:`0px`,opacity:+!!i,transition:`max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease`,overflow:`hidden`},children:(0,y.jsx)(`div`,{style:{padding:`0 26px 22px 26px`,borderTop:`1px solid rgba(255, 255, 255, 0.05)`,paddingTop:`14px`},children:(0,y.jsx)(`p`,{style:{fontFamily:`var(--about-font-sans)`,fontSize:`14px`,lineHeight:1.8,color:`var(--about-text-secondary)`,margin:0,fontWeight:300},children:e.a})})})]},n)})})})]})]}),(0,y.jsx)(`style`,{dangerouslySetInnerHTML:{__html:`
        .faq-website-theme-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 56px;
          align-items: start;
        }

        .faq-theme-left-col {
          position: sticky;
          top: 100px;
        }

        .faq-theme-info-card {
          padding: 24px 26px;
        }

        .faq-theme-pill-card:hover {
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(255, 255, 255, 0.25) !important;
          transform: translateY(-2px);
        }

        .faq-theme-btn:hover span {
          color: #FFFFFF !important;
        }

        @media (max-width: 960px) {
          .faq-website-theme-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .faq-theme-left-col {
            position: static;
          }
        }

        @media (max-width: 600px) {
          .faq-theme-pill-card button {
            padding: 16px 18px !important;
          }

          .faq-theme-pill-card div[style*="padding: 0 26px"] {
            padding: 0 18px 18px 18px !important;
          }

          .faq-theme-info-card {
            padding: 20px 18px !important;
          }
        }
      `}})]})}a.registerPlugin(c);function O(){return(0,v.useEffect)(()=>{let e=new u({duration:1.2,easing:e=>Math.min(1,1.001-2**(-10*e)),orientation:`vertical`,gestureOrientation:`vertical`,smoothWheel:!0,wheelMultiplier:1,smoothTouch:!1,touchMultiplier:2,infinite:!1});e.on(`scroll`,c.update);let t=t=>{e.raf(t*1e3)};return a.ticker.add(t),a.ticker.lagSmoothing(0),a.utils.toArray(`.about-fade-up`).forEach(e=>{a.fromTo(e,{opacity:0,y:28},{opacity:1,y:0,duration:.7,ease:`power3.out`,scrollTrigger:{trigger:e,start:`top 88%`,toggleActions:`play none none none`}})}),()=>{e.destroy(),a.ticker.remove(t),c.getAll().forEach(e=>e.kill())}},[]),(0,y.jsxs)(y.Fragment,{children:[(0,y.jsx)(t,{}),(0,y.jsx)(r,{}),(0,y.jsxs)(`main`,{className:`about-page-wrapper`,children:[(0,y.jsx)(b,{}),(0,y.jsx)(x,{}),(0,y.jsx)(S,{}),(0,y.jsx)(C,{}),(0,y.jsx)(w,{}),(0,y.jsx)(T,{}),(0,y.jsx)(E,{}),(0,y.jsx)(D,{})]}),(0,y.jsx)(n,{}),(0,y.jsx)(i,{})]})}(0,_.createRoot)(document.getElementById(`root`)).render((0,y.jsx)(v.StrictMode,{children:(0,y.jsx)(O,{})}));