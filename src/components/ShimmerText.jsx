import React from "react";
import { motion } from "framer-motion";

export default function ShimmerText({ text, children, className = "", as = "h2" }) {
  const rawContent = children !== undefined ? children : text;

  // Cleanly handle multi-line formatting without ever displaying raw <br> tags
  let content = rawContent;
  if (typeof rawContent === 'string') {
    // 1. Normalize and strip any HTML <br> tags (case-insensitive: <br>, <br/>, <BR />, etc.)
    let cleaned = rawContent.replace(/<br\s*\/?>/gi, '\n');

    // 2. If "Every frame. Intentional." is on one line, cleanly format across two lines
    if (!cleaned.includes('\n') && /every frame\./i.test(cleaned) && /intentional\./i.test(cleaned)) {
      cleaned = cleaned.replace(/(every frame\.)\s*/i, '$1\n');
    }

    const lines = cleaned.split('\n');
    if (lines.length > 1) {
      content = lines.map((line, i, arr) => (
        <React.Fragment key={i}>
          {line}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      ));
    } else {
      content = cleaned;
    }
  }

  const HeadingTag = as === 'h1' ? motion.h1 : motion.h2;

  return (
    <div className={`shimmer-container ${className}`}>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="shimmer-wrapper"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <HeadingTag
          animate={{
            backgroundPosition: ["200% center", "-200% center"],
          }}
          className="shimmer-text"
          transition={{
            duration: 2.5,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {content}
        </HeadingTag>
      </motion.div>
    </div>
  );
}
