import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";
import { Navbar1 } from "@/components/ui/navbar-1";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <Navbar1 />
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
