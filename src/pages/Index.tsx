import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { BloodCellsBackground } from "@/components/three/BloodCellsBackground";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <BloodCellsBackground />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
