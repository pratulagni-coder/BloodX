import { motion } from "framer-motion";
import { Heart, Droplets, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import SplitText from "@/components/ui/SplitText";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Transparent overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Floating blood drops decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-16 h-16 rounded-full bg-blood/10 blur-xl"
        />
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-40 right-[15%] w-24 h-24 rounded-full bg-blood/10 blur-xl"
        />
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-32 left-[20%] w-20 h-20 rounded-full bg-blood/10 blur-xl"
        />
      </div>

      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8"
          >
            <Droplets className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-white/90">People-to-People Connection</span>
          </motion.div>

          {/* Main heading with SplitText animation */}
          <div className="mb-6">
            <SplitText
              text="Every Drop of Blood"
              tag="h1"
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight"
              delay={80}
              duration={0.8}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 50, rotateX: -90 }}
              to={{ opacity: 1, y: 0, rotateX: 0 }}
              threshold={0.1}
              rootMargin="0px"
              textAlign="center"
            />
            <SplitText
              text="Saves a Life"
              tag="span"
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-red-400 leading-tight block mt-2"
              delay={60}
              duration={0.8}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 50, scale: 0.5 }}
              to={{ opacity: 1, y: 0, scale: 1 }}
              threshold={0.1}
              rootMargin="0px"
              textAlign="center"
            />
          </div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10"
          >
            Connect directly with donors in your community. No intermediaries, 
            just people helping people when it matters most.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              variant="blood"
              size="xl"
              onClick={() => navigate("/register?role=donor")}
              className="w-full sm:w-auto group"
            >
              <Heart className="w-5 h-5 animate-pulse" />
              I Want to Donate
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="xl"
              onClick={() => navigate("/register?role=patient")}
              className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
            >
              <Droplets className="w-5 h-5" />
              I Need Blood
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-white/70"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">100% Volunteer Based</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">Privacy Focused</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">Verified Donors</span>
            </div>
          </motion.div>
        </div>

        {/* Animated heart icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 hidden lg:block"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <Heart className="w-32 h-32 text-blood/20" fill="currentColor" />
            <Heart className="w-32 h-32 text-blood/40 absolute inset-0 blur-xl" fill="currentColor" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
