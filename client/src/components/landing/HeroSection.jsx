import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const HeroSection = ({ visible = false }) => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-yellow-50">
      <motion.div
        className="container mx-auto px-6 max-w-7xl relative z-10 text-center"
        initial="hidden"
        animate={visible ? "visible" : "hidden"}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.13 } },
        }}
      >
        {/* Badge */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold tracking-wide uppercase mb-8 border border-red-200"
        >
          <span className="text-red-500">✦</span> SIMPLE. COLLABORATIVE. FAST.
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-red-950 mb-6 drop-shadow-sm"
        >
          Project Management, <br className="hidden md:block" />
          <span className="text-red-600">Simply Done.</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-red-900/80 mb-10 leading-relaxed font-medium"
        >
          Stop fighting your tools and start finishing your work. TaskFlow is the lightweight workspace for teams who want to build without the bloat of mainstream apps.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-red-600 text-white font-semibold shadow-lg shadow-red-600/20 hover:bg-red-700 hover:-translate-y-0.5 transition-all outline-none focus:ring-4 focus:ring-red-600/30"
          >
            Get Started Free
          </Link>
          <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-red-900 border border-red-200 font-semibold shadow-sm hover:bg-red-50 hover:border-red-300 transition-all">
            See How It Works
          </button>
        </motion.div>

        {/* Browser Mockup */}
        <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="relative mx-auto max-w-5xl">
          <div className="relative rounded-xl md:rounded-4xl bg-white border border-red-100 shadow-2xl p-2 md:p-4 overflow-hidden transform hover:-translate-y-2 transition-transform duration-500">
            <div className="absolute top-0 left-0 right-0 h-6 md:h-8 bg-red-50 border-b border-red-100 flex items-center px-4 gap-1.5 rounded-t-xl md:rounded-t-[1.75rem]">
              <div className="size-2.5 rounded-full bg-red-400/50"></div>
              <div className="size-2.5 rounded-full bg-yellow-400/50"></div>
              <div className="size-2.5 rounded-full bg-green-400/50"></div>
            </div>
            {/* Minimal Board Mockup inside */}
            <div className="pt-6 md:pt-8 bg-slate-50 rounded-lg md:rounded-2xl border border-slate-100 min-h-[300px] md:min-h-[500px] overflow-hidden flex shadow-inner">
              <div className="w-64 border-r border-slate-200 bg-white p-4 hidden md:block text-left">
                <div className="h-6 w-32 bg-slate-200 rounded mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-slate-100 rounded"></div>
                  <div className="h-4 w-4/5 bg-slate-100 rounded"></div>
                  <div className="h-4 w-5/6 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="flex-1 p-6 md:p-8 bg-slate-50/50">
                <div className="flex gap-4">
                  {/* Column 1 */}
                  <div className="flex-1 min-w-[250px] text-left">
                    <div className="h-6 w-24 bg-red-100 rounded mb-4"></div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-3">
                      <div className="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
                      <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="h-4 w-full bg-slate-200 rounded mb-2"></div>
                      <div className="h-3 w-1/3 bg-slate-100 rounded mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-6 w-16 bg-red-50 rounded-full"></div>
                        <div className="h-6 w-6 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  {/* Column 2 */}
                  <div className="flex-1 min-w-[250px] hidden sm:block text-left">
                    <div className="h-6 w-24 bg-yellow-100 rounded mb-4"></div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="h-4 w-5/6 bg-slate-200 rounded mb-2"></div>
                      <div className="h-3 w-2/3 bg-slate-100 rounded mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-6 w-6 bg-slate-200 rounded-full"></div>
                        <div className="h-6 w-6 bg-slate-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white/50 pointer-events-none"></div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
