"use client";

import { HeroProductionLab } from "@/components/home/HeroProductionLab";
import { StatsBand } from "@/components/home/StatsBand";
import { ThesisSection, HomeCTA } from "@/components/home/ThesisSection";
import { FocusTracks } from "@/components/home/FocusTracks";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { RegionStrip } from "@/components/home/RegionStrip";

export function HomePageSections() {
  return (
    <>
      <HeroProductionLab />
      <StatsBand />
      <ThesisSection />
      <FocusTracks />
      <ServicesPreview />
      <RegionStrip />
      <HomeCTA />
    </>
  );
}
