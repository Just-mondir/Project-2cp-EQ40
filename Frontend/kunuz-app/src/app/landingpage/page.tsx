import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import AboutMissionVision from "@/components/AboutMissionVision";
import ExploreHeritage from "@/components/ExploreHeritage";
import PopularGroups from "@/components/PopularGroups";
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
        <PopularGroups />
        <MonumentsInDanger />
        <UpcomingEvents />
        <HowDoesItWork />
      </main>
    </div>
  );
}
