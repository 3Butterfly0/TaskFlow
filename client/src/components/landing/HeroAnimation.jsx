import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STAGGER = 0.08;
const LETTER_DURATION = 0.5;
const TF_DURATION = 0.6;
const REVEAL_AFTER = 850;
const SMOOTH = [0.22, 1, 0.36, 1];

const HeroAnimation = ({ onHeaderReveal, onContentReveal, onComplete }) => {
  const [revealLetters, setRevealLetters] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [done, setDone] = useState(false);

  // Phase 1 → 2: Reveal hidden letters after T and F have appeared
  useEffect(() => {
    const t = setTimeout(() => setRevealLetters(true), REVEAL_AFTER);
    return () => clearTimeout(t);
  }, []);

  // Phase 2 → 3: Show "Welcome To" after letters finish expanding
  useEffect(() => {
    if (!revealLetters) return;
    const wait = (2 * STAGGER + LETTER_DURATION) * 1000 + 300;
    const t = setTimeout(() => setShowGreeting(true), wait);
    return () => clearTimeout(t);
  }, [revealLetters]);

  // Phase 3 → 4: Reveal header, content, then fade overlay out
  useEffect(() => {
    if (!showGreeting) return;
    const t = setTimeout(() => {
      onHeaderReveal?.();
      setTimeout(() => {
        onContentReveal?.();
        setDone(true);
      }, 500);
    }, 700);
    return () => clearTimeout(t);
  }, [showGreeting, onHeaderReveal, onContentReveal]);

  const letterProps = (i) => ({
    initial: { width: 0, opacity: 0 },
    animate: revealLetters
      ? { width: "auto", opacity: 1 }
      : { width: 0, opacity: 0 },
    transition: {
      width: { duration: LETTER_DURATION, ease: SMOOTH, delay: i * STAGGER },
      opacity: { duration: LETTER_DURATION * 0.6, ease: "easeOut", delay: i * STAGGER },
    },
  });

  return (
    <AnimatePresence onExitComplete={() => onComplete?.()}>
      {!done && (
        <motion.div
          key="hero-overlay"
          className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-yellow-50"
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: SMOOTH }}
        >
          <div className="flex flex-col items-center">
            {/* "Welcome To" — fades in after TaskFlow is fully revealed */}
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={showGreeting ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.7, ease: SMOOTH }}
              className="text-2xl md:text-3xl font-medium text-red-900 mb-2 font-serif italic"
            >
              Welcome To
            </motion.h2>

            {/* TaskFlow — T and F appear first, then remaining letters expand outward */}
            <h1 className="flex items-baseline text-6xl md:text-8xl font-bold tracking-tight text-red-600 drop-shadow-sm select-none">
              {/* T */}
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: TF_DURATION, ease: SMOOTH }}
                className="inline-block"
              >
                T
              </motion.span>

              {/* a, s, k — expand between T and F */}
              {["a", "s", "k"].map((ch, i) => (
                <motion.span
                  key={ch}
                  className="inline-block overflow-hidden whitespace-nowrap"
                  {...letterProps(i)}
                >
                  <span className="inline-block pr-[0.02em]">{ch}</span>
                </motion.span>
              ))}

              {/* F */}
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: TF_DURATION, ease: SMOOTH, delay: 0.1 }}
                className="inline-block"
              >
                F
              </motion.span>

              {/* l, o, w — expand after F */}
              {["l", "o", "w"].map((ch, i) => (
                <motion.span
                  key={ch}
                  className="inline-block overflow-hidden whitespace-nowrap"
                  {...letterProps(i)}
                >
                  <span className="inline-block pr-[0.05em]">{ch}</span>
                </motion.span>
              ))}
            </h1>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HeroAnimation;
