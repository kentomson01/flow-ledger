import { motion } from "framer-motion";
import { forwardRef, ReactNode, useEffect } from "react";

const variants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
};

export const PageTransition = forwardRef<HTMLDivElement, { children: ReactNode }>(
  ({ children }, ref) => {
    useEffect(() => {
      const main = document.getElementById("main-content");
      if (main) {
        main.setAttribute("tabIndex", "-1");
        main.focus({ preventScroll: true });
      }
    }, []);

    return (
      <motion.div
        ref={ref}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    );
  }
);

PageTransition.displayName = "PageTransition";
