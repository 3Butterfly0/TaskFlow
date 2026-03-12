import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const highlights = [
  {
    id: 1,
    title: "Kanban & Backlog",
    description: "Stay organized from the first idea to the final checkmark.",
    icon: "📋",
  },
  {
    id: 2,
    title: "Clear Analytics",
    description: "Human-friendly insights that actually help you ship faster.",
    icon: "📊",
  },
  {
    id: 3,
    title: "Team Workspaces",
    description: "Collaborative spaces built for clarity, not complexity.",
    icon: "👥",
  },
];

const reasons = [
  {
    id: 1,
    title: "Zero Learning Curve",
    description: "Skip the 10-hour certification. If you can drag and drop, you’re an expert.",
    icon: "⚡",
  },
  {
    id: 2,
    title: "Fast by Design",
    description: "No more loading screens. Move from a thought to a ticket in seconds.",
    icon: "🚀",
  },
  {
    id: 3,
    title: "Focused Features",
    description: "We kept the Kanban, the Calendar, and the Team—and cut the clutter you never used anyway.",
    icon: "🎯",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-15 bg-white">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-32">
          <div className="max-w-3xl mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-red-950 mb-6 leading-tight">
              Everything you need, <br className="hidden md:block" />
              <span className="text-red-600">nothing you don't.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {highlights.map((feature, idx) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-red-50/50 p-8 rounded-2xl border border-red-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-900/5 transition-all group"
              >
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-red-100 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-red-950 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-base">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Why TaskFlow Section */}
        <div>
          <div className="max-w-3xl mb-16 text-center mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-red-950 mb-6 leading-tight">
              Why TaskFlow?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {reasons.map((reason, idx) => (
              <motion.div
                key={reason.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-red-200 hover:shadow-xl hover:shadow-red-900/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-400 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:bg-red-100 transition-colors">
                  {reason.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">
                  {reason.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {reason.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
        
      </div>

      <div className="py-20 bg-linear-to-br from-red-600 to-red-800 text-center relative overflow-hidden mt-16 mx-auto rounded-3xl shadow-2xl max-w-5xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-100 bg-red-500/50 rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 drop-shadow-sm">
            Ready to simplify your workflow?
          </h2>

          <p className="text-xl text-red-100 mb-10 max-w-2xl mx-auto font-medium">
            Join the teams moving away from "complex" and toward "completed."
          </p>

          <div className="flex justify-center mb-6">
            <Link
              to="/register"
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-white text-red-700 font-bold shadow-xl shadow-red-900/40 hover:bg-yellow-50 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-red-900/50 transition-all text-lg"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
