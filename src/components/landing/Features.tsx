import { motion } from "framer-motion";
import { Shield, MapPin, Users, Bell, Lock, Heart } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Area-Based Matching",
    description: "Find donors near you without revealing exact locations. Privacy first.",
  },
  {
    icon: Users,
    title: "My Network",
    description: "See which of your contacts are registered and compatible donors.",
  },
  {
    icon: Bell,
    title: "Instant Notifications",
    description: "Get notified immediately when someone in your area needs blood.",
  },
  {
    icon: Lock,
    title: "Privacy Protected",
    description: "Contact details only shared after mutual consent. You're in control.",
  },
  {
    icon: Shield,
    title: "Verified Profiles",
    description: "All donors go through verification to ensure authenticity.",
  },
  {
    icon: Heart,
    title: "Community Driven",
    description: "100% volunteer-based. No middlemen, just humanity helping humanity.",
  },
];

export const Features = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built for <span className="text-gradient">Trust & Privacy</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We understand the sensitivity of blood donation. That's why we've designed 
            every feature with your privacy and safety in mind.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-8 rounded-3xl bg-card border border-border hover:border-blood/30 hover:shadow-card transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-blood-light flex items-center justify-center mb-6 group-hover:bg-blood group-hover:shadow-glow transition-all duration-300">
                <feature.icon className="w-7 h-7 text-blood group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
