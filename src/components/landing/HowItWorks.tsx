import { motion } from "framer-motion";
import { UserPlus, Search, MessageCircle, Building2 } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Register",
    description: "Sign up as a donor or patient. Select your approximate area for privacy.",
  },
  {
    icon: Search,
    title: "Find Match",
    description: "Search donors by area or browse your network for compatible blood types.",
  },
  {
    icon: MessageCircle,
    title: "Connect",
    description: "Send a request. Once accepted, exchange contact details to coordinate.",
  },
  {
    icon: Building2,
    title: "Donate Safely",
    description: "Meet at a registered blood bank for proper screening and donation.",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-20 md:py-32 bg-warm-cream">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How BloodConnect Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A simple, transparent process to connect donors with those in need
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blood/30 to-blood/10" />
              )}
              
              <div className="bg-card rounded-3xl p-8 shadow-card hover:shadow-elevated transition-shadow duration-300 relative">
                <div className="w-16 h-16 rounded-2xl blood-gradient flex items-center justify-center mb-6 shadow-glow">
                  <step.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <span className="absolute top-6 right-6 text-6xl font-bold text-blood/10">
                  {index + 1}
                </span>
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
