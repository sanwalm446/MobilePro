import React, { useState } from 'react';
import {
  Sparkles,
  Phone,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Lightbulb,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Quote,
  Layers,
  HeartHandshake,
  Smartphone,
  Eye,
} from 'lucide-react';
import { MobiFlowBrandLogo } from '../common/MobiFlowBrandLogo';
import founderPhoto from '../../assets/images/founder_muhammad_sanwal_1791449991747.jpg';

interface FounderSectionProps {
  onContactClick?: () => void;
}

/**
 * Premium Founder & About Presentation for MobiFlow Software
 * 
 * Features:
 * - Real Founder Photo of Muhammad Sanwal with graceful fallback
 * - Glassmorphism, soft blue gradient, subtle emerald glow
 * - Official Founder Quote & Story: "Why MobiFlow?"
 * - 3 Business Vision Cards: Simple, Smart, Growth
 * - Direct "Contact Founder" (tel:03292920600) & WhatsApp buttons
 * - Respects prefers-reduced-motion
 */
export const FounderSection: React.FC<FounderSectionProps> = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <section id="about" className="relative py-24 bg-white overflow-hidden scroll-mt-20">
      {/* Background Soft Atmospheric Ambient Glows */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-200/35 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 -right-48 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[300px] bg-sky-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* ========================================================= */}
        {/* PART 1: ABOUT MOBIFLOW & OUR MISSION                      */}
        {/* ========================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>ABOUT MOBIFLOW SOFTWARE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Our Mission & Commitment
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            MobiFlow is a professional mobile shop management solution engineered to give mobile shop owners
            peace of mind, complete financial clarity, and intuitive digital tools to run their entire counter
            and inventory effortlessly.
          </p>
        </div>

        {/* ========================================================= */}
        {/* PART 2: MEET THE FOUNDER (PREMIUM CARD & EXACT COPY)     */}
        {/* ========================================================= */}
        <div id="founder" className="scroll-mt-24">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>THE PERSON BEHIND MOBIFLOW</span>
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Meet the Founder
            </h2>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
              Building Smarter Tools for Smarter Businesses
            </h3>
          </div>

          {/* Premium Glassmorphic Founder Card */}
          <div className="relative rounded-3xl bg-gradient-to-br from-white via-blue-50/40 to-emerald-50/20 border border-blue-100 shadow-xl shadow-blue-500/5 backdrop-blur-md p-6 sm:p-10 lg:p-12 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 motion-reduce:transition-none">
            {/* Soft decorative glow inside card */}
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-blue-400/15 to-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-gradient-to-tr from-sky-400/15 to-teal-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Founder Visual (Col 1 - 5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center text-center">
                <div className="relative group/photo">
                  {/* Outer glowing frame */}
                  <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 via-sky-400 to-emerald-500 rounded-3xl blur-md opacity-40 group-hover/photo:opacity-75 transition-opacity duration-500 motion-reduce:transition-none" />

                  {/* Visual container */}
                  <div className="relative w-64 h-80 sm:w-72 sm:h-92 rounded-2xl bg-white p-2 shadow-2xl border border-white/60 overflow-hidden">
                    {!imageError ? (
                      <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900">
                        <img
                          src={founderPhoto}
                          alt="Muhammad Sanwal — Founder & Owner of MobiFlow Software"
                          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover/photo:scale-105 motion-reduce:transition-none"
                          onError={() => setImageError(true)}
                        />
                        {/* Subtle bottom gradient vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-3 left-3 right-3 text-left">
                          <p className="text-white font-bold text-sm drop-shadow-sm">
                            Muhammad Sanwal
                          </p>
                          <p className="text-sky-300 text-xs font-medium drop-shadow-sm">
                            Founder & Owner
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Elegant abstract tech visual fallback */
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-between p-6 text-white relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />

                        <div className="pt-4">
                          <MobiFlowBrandLogo size="lg" theme="dark" showText={false} />
                        </div>

                        <div className="space-y-1 relative z-10 text-center">
                          <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-emerald-400 mx-auto rounded-full mb-3" />
                          <h4 className="text-xl font-extrabold text-white">
                            Muhammad Sanwal
                          </h4>
                          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                            Founder & Owner
                          </p>
                          <p className="text-[11px] text-slate-300">
                            MobiFlow Software
                          </p>
                        </div>

                        <div className="text-[10px] text-sky-200/80 flex items-center gap-1 pb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Official Software Founder</span>
                        </div>
                      </div>
                    )}

                    {/* Verified Owner Badge Pill */}
                    <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/95 text-white text-[11px] font-bold shadow-lg backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>Verified Founder</span>
                    </div>
                  </div>
                </div>

                {/* Identity Badge Below Visual */}
                <div className="mt-5 space-y-1">
                  <h4 className="text-xl font-extrabold text-slate-950">
                    Muhammad Sanwal
                  </h4>
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Founder & Owner, MobiFlow Software
                  </p>
                  <p className="text-xs text-slate-500">
                    Professional Mobile Shop Management Software
                  </p>
                </div>

                {/* Contact Buttons */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 w-full max-w-xs">
                  <a
                    href="tel:03292920600"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/20 transition-all cursor-pointer hover:scale-[1.02] motion-reduce:transition-none"
                  >
                    <Phone className="w-3.5 h-3.5 text-white" />
                    <span>Contact Founder</span>
                  </a>
                  <a
                    href="https://wa.me/923292920600"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-[1.02] motion-reduce:transition-none"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                    <span>WhatsApp</span>
                  </a>
                </div>
                <div className="mt-2 text-center">
                  <a
                    href="tel:03292920600"
                    className="text-xs font-mono font-bold text-slate-700 hover:text-blue-700 transition-colors"
                  >
                    Direct Line: 0329-2920600
                  </a>
                </div>
              </div>

              {/* Founder Description & Identity (Col 2 - 7 cols) */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Section Subhead */}
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-100/70 text-blue-800 text-xs font-bold">
                    <Smartphone className="w-3.5 h-3.5 text-blue-700" />
                    <span>Meet Muhammad Sanwal — Owner of MobiFlow Software</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Dedicated to Modernizing Mobile Retail Operations
                  </h3>
                </div>

                {/* EXACT FOUNDER COPY (Requirement 2 & 15) */}
                <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
                  <p className="font-medium text-slate-900">
                    MobiFlow was created with a simple vision: to make mobile shop management smarter,
                    easier, and more professional.
                  </p>
                  <p>
                    As the founder of MobiFlow Software, Muhammad Sanwal is focused on building practical
                    technology that helps shop owners manage their sales, stock, expenses, profit,
                    customers, suppliers, staff, and daily operations from one powerful platform.
                  </p>
                  <p>
                    His goal is to turn the complexity of running a mobile business into a simple digital
                    experience — helping businesses save time, stay organized, understand their profits,
                    and grow with confidence.
                  </p>
                </div>

                {/* HIGHLIGHTED FOUNDER QUOTE (Requirement 5) */}
                <div className="relative mt-6 p-6 rounded-2xl bg-white border border-blue-100 shadow-sm overflow-hidden">
                  <div className="absolute top-2 right-3 text-blue-100 pointer-events-none">
                    <Quote className="w-16 h-16 stroke-1 opacity-60" />
                  </div>
                  <div className="relative z-10 space-y-3">
                    <p className="text-lg sm:text-xl font-extrabold text-blue-900 italic leading-snug">
                      “Building smarter tools for smarter businesses.”
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">
                          — Muhammad Sanwal
                        </span>
                        <span className="text-slate-500 ml-2">
                          Founder & Owner, MobiFlow Software
                        </span>
                      </div>
                      <div className="font-mono text-emerald-700 font-bold">
                        0329-2920600
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PART 3: FOUNDER STORY — WHY MOBIFLOW? (Requirement 6)     */}
        {/* ========================================================= */}
        <div className="rounded-3xl bg-slate-50 border border-slate-200/80 p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-blue-700" />
              <span>THE INSPIRATION</span>
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight">
              Why MobiFlow?
            </h3>
            {/* EXACT STORY COPY (Requirement 6) */}
            <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
              <p>
                Running a mobile shop involves much more than making sales. Owners need to manage stock,
                purchases, expenses, customers, suppliers, employees and profit every day.
              </p>
              <p className="font-medium text-slate-900">
                MobiFlow was created to bring these important business operations together in one simple
                and powerful platform.
              </p>
              <p>
                The vision is to give mobile shop owners better control over their business, better
                visibility into their numbers, and better tools for growth.
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PART 4: BUSINESS VISION — 3 PREMIUM CARDS (Requirement 7) */}
          {/* ========================================================= */}
          <div className="mt-12 pt-10 border-t border-slate-200/80">
            <div className="text-center mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700">
                OUR THREE CORE PILLARS
              </h4>
              <p className="mt-1 text-xl font-bold text-slate-900">
                Designed for Everyday Mobile Retail Success
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CARD 1: Simple */}
              <div className="group rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col justify-between motion-reduce:transition-none">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h5 className="text-xl font-extrabold text-slate-950">Simple</h5>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Making complex business operations easier to manage.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs text-blue-700 font-bold gap-1 group-hover:translate-x-1 transition-transform motion-reduce:transition-none">
                  <span>Effortless workflow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* CARD 2: Smart */}
              <div className="group rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between motion-reduce:transition-none">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h5 className="text-xl font-extrabold text-slate-950">Smart</h5>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Turning everyday business data into useful insights.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs text-emerald-700 font-bold gap-1 group-hover:translate-x-1 transition-transform motion-reduce:transition-none">
                  <span>Intelligent numbers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* CARD 3: Growth */}
              <div className="group rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-xs hover:shadow-lg hover:border-sky-300 transition-all duration-300 flex flex-col justify-between motion-reduce:transition-none">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold shadow-xs group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Rocket className="w-6 h-6" />
                  </div>
                  <h5 className="text-xl font-extrabold text-slate-950">Growth</h5>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Helping mobile businesses become more organized and ready to grow.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center text-xs text-sky-700 font-bold gap-1 group-hover:translate-x-1 transition-transform motion-reduce:transition-none">
                  <span>Scale with confidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Shorter Founder Teaser Banner for Homepage Integration (Requirement 10)
 * Placed after main product/features sections.
 */
export const FounderHomepageTeaser: React.FC<{ onMeetFounderClick: () => void }> = ({
  onMeetFounderClick,
}) => {
  return (
    <section className="py-12 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden border-y border-blue-900/40">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md bg-slate-800">
                <img
                  src={founderPhoto}
                  alt="Muhammad Sanwal"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase shadow-xs">
                Founder
              </span>
            </div>

            <div className="space-y-1 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-sky-300 text-[11px] font-bold tracking-wide uppercase">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Built With a Vision</span>
              </div>
              <h3 className="text-base sm:text-xl font-extrabold text-white">
                MobiFlow was created by Muhammad Sanwal with one goal:
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                To make mobile shop management simpler, smarter and more professional.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <button
              onClick={onMeetFounderClick}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-lg transition-all cursor-pointer hover:scale-[1.02] motion-reduce:transition-none"
            >
              <span>Meet the Founder</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-700" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
