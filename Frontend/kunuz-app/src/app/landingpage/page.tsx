import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import AboutMissionVision from "@/components/AboutMissionVision";
import ExploreHeritage from "@/components/ExploreHeritage";
import PopularGuilds from "@/components/PopularGuilds";
import MonumentsInDanger from "@/components/MonumentsInDanger";
import UpcomingEvents from "@/components/UpcomingEvents";
import HowDoesItWork from "@/components/HowDoesItWork";

export default function Page() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#FFF8E2" }}>
      <Header />
      <main>
        <Hero />
        <AboutSection />
        <AboutMissionVision />
        <ExploreHeritage />
        <PopularGuilds />
        <MonumentsInDanger />
        <UpcomingEvents />
        <HowDoesItWork />
      </main>
    </div>
  );
}
