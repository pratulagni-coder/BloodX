import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const CallToAction = forwardRef<HTMLElement>((props, ref) => {
  const navigate = useNavigate();

  return (
    <section ref={ref} className="py-20 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 blood-gradient opacity-95" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -right-32 w-96 h-96 border border-primary-foreground/10 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-24 -left-24 w-72 h-72 border border-primary-foreground/10 rounded-full"
        />
      </div>

      <div className="container relative z-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Heart className="w-16 h-16 text-primary-foreground/80 mx-auto mb-8 animate-heartbeat" />
            
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
              Be Someone's Hero Today
            </h2>
            
            <p className="text-lg text-primary-foreground/80 mb-10 max-w-xl mx-auto">
              Join thousands of compassionate donors who have already saved lives. 
              Your blood donation could be the difference between life and death.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="hero-outline"
                size="xl"
                onClick={() => navigate("/register")}
                className="group"
              >
                Join BloodConnect
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
});

CallToAction.displayName = "CallToAction";
