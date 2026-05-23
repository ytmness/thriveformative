"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import CustomCursor from "@/components/CustomCursor";
import ScrollProgress from "@/components/ScrollProgress";
import WaveDivider from "@/components/WaveDivider";
import HomePageSections from "@/components/home/HomePageSections";
import { CmsProvider } from "@/components/cms/CmsProvider";

export default function Page() {
  return (
    <ThemeProvider>
      <CmsProvider>
        <PageContent />
      </CmsProvider>
    </ThemeProvider>
  );
}

function PageContent() {
  return (
    <>
      <CustomCursor />
      <ScrollProgress />
      <LoadingScreen />
      <ThemeSwitcher />
      <Header />
      <HomePageSections />
      <div className="scroll-snap-section">
        <WaveDivider variant="primary" flip className="wave-divider--inside-section" />
        <Footer />
      </div>
    </>
  );
}
