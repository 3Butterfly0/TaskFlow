import { useState } from "react";
import { motion } from "framer-motion";
import HeroAnimation from "../components/landing/HeroAnimation";
import LandingHeader from "../components/landing/LandingHeader";
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";

const LandingPage = () => {
  const [headerVisible, setHeaderVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);

  return (
    <div className="min-h-screen bg-yellow-50 selection:bg-red-500 selection:text-white">
      {/* Intro Full-Screen Animation Layer */}
      {!animationDone && (
        <HeroAnimation 
          onHeaderReveal={() => setHeaderVisible(true)}
          onContentReveal={() => setContentVisible(true)}
          onComplete={() => setAnimationDone(true)} 
        />
      )}

      {/* Header operates independently */}
      <LandingHeader visible={headerVisible} />

      {/* Main Page Content */}
      <main>
        <HeroSection visible={contentVisible} />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={contentVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <FeaturesSection />
        </motion.div>
      </main>
    </div>
  );
};

export default LandingPage;
