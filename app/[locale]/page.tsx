"use client";

import ThemeProvider from "@/components/theme/ThemeProvider";
import ThemeSwitcher from "@/components/theme/ThemeSwitcher";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LoadingScreen from "@/components/LoadingScreen";
import AnimatedSection from "@/components/AnimatedSection";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useTranslations } from 'next-intl';

const WHATSAPP_LINK = "https://google.com";

function PageContent() {
  const { theme } = useTheme();
  const t = useTranslations();

  // Mapeo de logos según el tema
  const logoMap: Record<string, string> = {
    "golden-sand": "/logos/Recurso 5@5x.png",
    "nocturnal": "/logos/Recurso 6@5x.png",
    "metals": "/logos/Recurso 7@5x.png",
    "earth-modern": "/logos/Recurso 8@5x.png",
  };

  const currentLogo = logoMap[theme] || logoMap["golden-sand"];

  return (
    <>
      <LoadingScreen />
      <div className="fixed right-4 top-4 z-50 flex gap-3">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>

      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-40 backdrop-blur bg-[rgb(var(--bg)/0.95)] border-b border-theme shadow-sm"
      >
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <img 
              src={currentLogo} 
              alt="Thrive Formative" 
              className="h-16 w-auto object-contain"
            />
          </motion.div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {[
              { key: "home", hash: "inicio" },
              { key: "services", hash: "servicios" },
              { key: "plans", hash: "planes" },
              { key: "about", hash: "doctor" },
              { key: "faq", hash: "faq" },
              { key: "contact", hash: "contacto" }
            ].map((item, i) => (
              <motion.a
                key={item.key}
                href={`#${item.hash}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05, color: "rgb(var(--primary))" }}
                className="hover:opacity-80 transition-all"
              >
                {t(`nav.${item.key}`)}
              </motion.a>
            ))}
          </nav>

          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary rounded-xl px-4 py-2 text-sm font-medium shadow-lg hover:shadow-xl transition-shadow"
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
          >
            {t('nav.schedule')}
          </motion.a>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-5">
        {/* HERO */}
        <section id="inicio" className="py-14 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <AnimatedSection direction="left">
            <motion.h1 
              className="font-display text-4xl md:text-5xl leading-tight tracking-wide"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('hero.title')}
            </motion.h1>
            <motion.p 
              className="mt-4 text-muted text-base leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div 
              className="mt-7 flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.a
                whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(var(--primary), 0.3)" }}
                whileTap={{ scale: 0.95 }}
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
                className="btn-primary rounded-xl px-5 py-3 text-sm font-semibold text-center shadow-lg transition-shadow"
              >
                {t('hero.scheduleBtn')}
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="#servicios" 
                className="btn-outline rounded-xl px-5 py-3 text-sm font-semibold text-center hover:bg-[rgb(var(--surface))] transition-colors"
              >
                {t('hero.servicesBtn')}
              </motion.a>
            </motion.div>

            <motion.div 
              className="mt-6 grid grid-cols-3 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Stat label={t('hero.stat1Label')} value={t('hero.stat1Value')} delay={0} />
              <Stat label={t('hero.stat2Label')} value={t('hero.stat2Value')} delay={0.1} />
              <Stat label={t('hero.stat3Label')} value={t('hero.stat3Value')} delay={0.2} />
            </motion.div>
          </AnimatedSection>

          <AnimatedSection direction="right" delay={0.2}>
            <motion.div 
              className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
              whileHover={{ y: -5, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-xs text-muted tracking-[0.22em]">{t('flow.title')}</div>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed">
                <li>{t('flow.newPatient')}</li>
                <li>{t('flow.followUp')}</li>
                <li>{t('flow.policies')}</li>
              </ul>
              <div className="mt-5 p-4 rounded-xl border border-theme bg-[rgb(var(--bg)/0.6)]">
                <div className="text-xs text-muted">{t('flow.script')}</div>
                <p className="text-sm mt-1">
                  &ldquo;{t('flow.scriptText')}&rdquo;
                </p>
              </div>
            </motion.div>
          </AnimatedSection>
        </section>

        {/* QUE HACEMOS */}
        <AnimatedSection>
          <section className="py-12 border-t border-theme">
            <div className="grid md:grid-cols-3 gap-6">
              <Card title={t('approach.title1')} delay={0}>
                {t('approach.desc1')}
              </Card>
              <Card title={t('approach.title2')} delay={0.1}>
                {t('approach.desc2')}
              </Card>
              <Card title={t('approach.title3')} delay={0.2}>
                {t('approach.desc3')}
              </Card>
            </div>
          </section>
        </AnimatedSection>

        {/* SERVICIOS */}
        <AnimatedSection>
          <section id="servicios" className="py-12 border-t border-theme">
            <SectionTitle title={t('services.title')} subtitle={t('services.subtitle')} />
            <div className="mt-6 grid md:grid-cols-2 gap-6">
            <Service name={t('services.service1')} desc={t('services.desc1')} delay={0} />
            <Service name={t('services.service2')} desc={t('services.desc2')} delay={0.1} />
            <Service name={t('services.service3')} desc={t('services.desc3')} delay={0.2} />
            <Service name={t('services.service4')} desc={t('services.desc4')} delay={0.3} />
            <Service name={t('services.service5')} desc={t('services.desc5')} delay={0.4} />
            <Service name={t('services.service6')} desc={t('services.desc6')} delay={0.5} />
          </div>
          </section>
        </AnimatedSection>

        {/* PLANES */}
        <AnimatedSection>
          <section id="planes" className="py-12 border-t border-theme">
            <SectionTitle title={t('plans.title')} subtitle={t('plans.subtitle')} />
            <div className="mt-6 grid md:grid-cols-3 gap-6">
              <Plan name={t('plans.plan1')} items={[t('plans.plan1Item1'), t('plans.plan1Item2'), t('plans.plan1Item3')]} delay={0} />
              <Plan featured name={t('plans.plan2')} items={[t('plans.plan2Item1'), t('plans.plan2Item2'), t('plans.plan2Item3')]} delay={0.1} />
              <Plan name={t('plans.plan3')} items={[t('plans.plan3Item1'), t('plans.plan3Item2'), t('plans.plan3Item3')]} delay={0.2} />
            </div>
          </section>
        </AnimatedSection>

        {/* DOCTOR */}
        <AnimatedSection>
          <section id="doctor" className="py-12 border-t border-theme">
            <SectionTitle title={t('doctor.title')} subtitle={t('doctor.subtitle')} />
            <div className="mt-6 grid md:grid-cols-[1fr_1.4fr] gap-6 items-start">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -5, boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
              className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
            >
              <div className="h-56 rounded-xl bg-[rgb(var(--bg)/0.7)] border border-theme flex items-center justify-center text-muted text-sm overflow-hidden">
                Foto del doctor (placeholder)
              </div>
              <div className="mt-4 text-sm">
                <div className="font-semibold">{t('doctor.name')}</div>
                <div className="text-muted">{t('doctor.specialty')}</div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
              className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
            >
              <h3 className="font-display text-xl tracking-wide">{t('doctor.approach')}</h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">
                {t('doctor.description')}
              </p>
              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                {[
                  t('doctor.value1'),
                  t('doctor.value2'),
                  t('doctor.value3'),
                  t('doctor.value4'),
                  t('doctor.value5'),
                  t('doctor.value6')
                ].map((badge, i) => (
                  <Badge key={badge} delay={i * 0.1}>{badge}</Badge>
                ))}
              </div>
            </motion.div>
          </div>
          </section>
        </AnimatedSection>

        {/* TESTIMONIOS */}
        <AnimatedSection>
          <section className="py-12 border-t border-theme">
            <SectionTitle title={t('testimonials.title')} subtitle={t('testimonials.subtitle')} />
            <div className="mt-6 grid md:grid-cols-3 gap-6">
              <Quote text={t('testimonials.quote1')} delay={0} />
              <Quote text={t('testimonials.quote2')} delay={0.1} />
              <Quote text={t('testimonials.quote3')} delay={0.2} />
            </div>
          </section>
        </AnimatedSection>

        {/* FAQ */}
        <AnimatedSection>
          <section id="faq" className="py-12 border-t border-theme">
            <SectionTitle title={t('faq.title')} subtitle={t('faq.subtitle')} />
            <div className="mt-6 space-y-3">
              <Faq q={t('faq.q1')} a={t('faq.a1')} delay={0} />
              <Faq q={t('faq.q2')} a={t('faq.a2')} delay={0.1} />
              <Faq q={t('faq.q3')} a={t('faq.a3')} delay={0.2} />
              <Faq q={t('faq.q4')} a={t('faq.a4')} delay={0.3} />
            </div>
          </section>
        </AnimatedSection>

        {/* CONTACTO */}
        <AnimatedSection>
          <section id="contacto" className="py-12 border-t border-theme mb-16">
            <SectionTitle title={t('contact.title')} subtitle={t('contact.subtitle')} />
            <div className="mt-6 grid md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -5, boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
              className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
            >
              <div className="text-sm">
                <div className="font-semibold">{t('contact.schedule')}</div>
                <div className="text-muted">{t('contact.scheduleDesc')}</div>
              </div>
              <motion.a
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(var(--primary), 0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 inline-block btn-primary rounded-xl px-5 py-3 text-sm font-semibold shadow-lg"
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noreferrer"
              >
                {t('contact.scheduleBtn')}
              </motion.a>

              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-sm"
              >
                <div className="font-semibold">{t('contact.email')}</div>
                <div className="text-muted">{t('contact.emailPlaceholder')}</div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-4 text-sm"
              >
                <div className="font-semibold">{t('contact.phone')}</div>
                <div className="text-muted">{t('contact.phonePlaceholder')}</div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -5, boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}
              className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
            >
              <div className="text-sm font-semibold">{t('contact.location')}</div>
              <div className="text-muted text-sm mt-1">{t('contact.locationDesc')}</div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="mt-4 h-64 rounded-xl bg-[rgb(var(--bg)/0.7)] border border-theme flex items-center justify-center text-muted text-sm overflow-hidden"
              >
                {t('contact.mapPlaceholder')}
              </motion.div>
            </motion.div>
          </div>
          </section>
        </AnimatedSection>
      </main>

      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-t border-theme py-8"
      >
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="text-xs text-muted tracking-[0.22em] cursor-default"
          >
            {t('footer.brand')}
          </motion.div>
          <div className="text-xs text-muted">
            © {new Date().getFullYear()} Thrive Formative. {t('footer.rights')}
          </div>
        </div>
      </motion.footer>
    </>
  );
}

export default function Page() {
  return (
    <ThemeProvider>
      <PageContent />
    </ThemeProvider>
  );
}

function Stat({ label, value, delay = 0 }: { label: string; value: string; delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}
      className="bg-surface border border-theme rounded-xl p-3 cursor-default"
    >
      <div className="text-xs text-muted">{label}</div>
      <div className="text-sm font-semibold mt-1">{value}</div>
    </motion.div>
  );
}

function Card({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, boxShadow: "0 20px 50px rgba(0,0,0,0.15)" }}
      className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
    >
      <div className="font-display tracking-wide">{title}</div>
      <p className="mt-2 text-sm text-muted leading-relaxed">{children}</p>
    </motion.div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="flex items-end justify-between gap-6"
    >
      <div>
        <h2 className="font-display text-2xl tracking-wide">{title}</h2>
        <p className="text-sm text-muted mt-2">{subtitle}</p>
      </div>
    </motion.div>
  );
}

function Service({ name, desc, delay = 0 }: { name: string; desc: string; delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, boxShadow: "0 15px 40px rgba(0,0,0,0.12)" }}
      className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
    >
      <div className="font-semibold">{name}</div>
      <p className="text-sm text-muted mt-2 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function Plan({ name, items, featured, delay = 0 }: { name: string; items: string[]; featured?: boolean; delay?: number }) {
  const t = useTranslations();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -10, boxShadow: featured ? "0 25px 60px rgba(var(--primary), 0.2)" : "0 20px 50px rgba(0,0,0,0.15)" }}
      className={`bg-surface border rounded-2xl shadow-soft p-6 ${featured ? "border-theme ring-2 ring-theme" : "border-theme"}`}
    >
      <div className="font-display tracking-wide">{name}</div>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {items.map((x) => <li key={x}>• {x}</li>)}
      </ul>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold ${featured ? "btn-primary shadow-lg" : "btn-outline"}`}
      >
        {t('plans.chooseBtn')}
      </motion.button>
    </motion.div>
  );
}

function Badge({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.05, backgroundColor: "rgb(var(--surface))" }}
      className="text-xs px-3 py-2 rounded-xl border border-theme bg-[rgb(var(--bg)/0.6)] cursor-default"
    >
      {children}
    </motion.div>
  );
}

function Quote({ text, delay = 0 }: { text: string; delay?: number }) {
  const t = useTranslations();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, boxShadow: "0 15px 40px rgba(0,0,0,0.12)" }}
      className="bg-surface border border-theme rounded-2xl shadow-soft p-6"
    >
      <p className="text-sm leading-relaxed">&ldquo;{text}&rdquo;</p>
      <div className="text-xs text-muted mt-3">{t('testimonials.author')}</div>
    </motion.div>
  );
}

function Faq({ q, a, delay = 0 }: { q: string; a: string; delay?: number }) {
  return (
    <motion.details 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ x: 5 }}
      className="bg-surface border border-theme rounded-2xl shadow-soft p-5"
    >
      <summary className="cursor-pointer font-semibold">{q}</summary>
      <motion.p 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="mt-2 text-sm text-muted leading-relaxed"
      >
        {a}
      </motion.p>
    </motion.details>
  );
}
