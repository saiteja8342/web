import React from "react";
import { motion } from "framer-motion";

export default function ShimmerText({ text, className = "" }) {
  return (
    <div className={`shimmer-container ${className}`}>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="shimmer-wrapper"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          animate={{
            backgroundPosition: ["200% center", "-200% center"],
          }}
          className="shimmer-text"
          transition={{
            duration: 2.5,
            ease: "linear",
            repeat: Infinity,
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      </motion.div>
    </div>
  );
}
