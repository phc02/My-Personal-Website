"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);
ScrollTrigger.config({ignoreMobileResize:true});

type ContainerScrollProps = {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
  background?: React.ReactNode;
};

export function ContainerScroll({
  titleComponent,
  children,
  background,
}: ContainerScrollProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();

      media.add(
        {
          all: "all",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { reduceMotion } = context.conditions ?? {};
          const section = sectionRef.current;
          const header = headerRef.current;
          const card = cardRef.current;

          if (!section || !header || !card) return;

          if (reduceMotion) {
            gsap.set(header, { y: 0 });
            gsap.set(card, { rotationX: 0, scale: 1, y: 36 });
            return;
          }

          gsap.set(header, { y: 0 });
          gsap.set(card, {
            rotationX: 18,
            scale: 0.9,
            y: 0,
            transformOrigin: "50% 0%",
          });

          let timeline: gsap.core.Timeline | undefined;
          timeline = gsap.timeline({
            defaults: { duration: 1, ease: "none" },
            scrollTrigger: {
              id: "hero-device-scroll",
              trigger: section,
              start: "top top",
              end: () => `+=${Math.max(window.innerHeight * 2, 1800) * (timeline?.duration() || 1)}`,
              pin: true,
              pinSpacing: true,
              scrub: .2,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              // Finish the feather before the pinned scene leaves the viewport.
              onUpdate: self => {
                if (self.progress >= 1) {
                  self.getTween()?.progress(1);
                  self.animation?.progress(1);
                }
              },
            },
          });

          timeline
            .to(card, { rotationX: 0, scale: 1, y: 36 }, 0);
        },
      );

      return () => media.revert();
    },
    { scope: sectionRef },
  );

  const [fit, setFit] = React.useState(1);
  const [backgroundFit,setBackgroundFit]=React.useState(1);
  React.useLayoutEffect(() => {
    const resize = () => {const fit=Math.min(window.innerWidth / 1920, window.innerHeight / 1040);setFit(fit);setBackgroundFit(Math.max(window.innerWidth / 1920, window.innerHeight / 1040));};
    resize(); window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  return <div className="case-scroll-track"><section ref={sectionRef} id="demo" className="case-section">
    <div className="case-visuals">
    <div className="case-background-fill" aria-hidden="true" style={{transform:`translate(-50%, -50%) scale(${backgroundFit})`}}>{background}</div>
    <div className="case-canvas" style={{transform:`translate(-50%, -50%) scale(${fit})`}}>
      <header className="case-meta">
        <span className="case-category">/ “铸融”全域<span>无人化</span></span>
        <span>/ UX Design</span>
        <div className="case-brand"><div className="case-mi"><img src="./assets/figma/70a7a.png" alt="小米"/></div><strong>小米超级大压铸</strong></div>
        <span>/ To B</span><span>/ 用户体验优化</span>
      </header>
      <div className="case-device-stage" style={{perspective:'1400px'}}>
        <Header ref={headerRef}>{titleComponent}</Header>
        <Card ref={cardRef}>{children}</Card>
      </div>
      <p className="case-caption">将 AI 从单向信息推送，升级为可提问、可验证、可持续追问的工业协作助手。</p>
      <button className="case-scroll" aria-label="向下滚动，展开平板" onClick={()=>window.scrollBy({top:Math.min(innerHeight,900),behavior:'smooth'})}><img src="./assets/figma/b08d9.svg" alt=""/></button>
    </div>
  </div></section></div>;
}

const Header = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  function Header({ children }, ref) {
    return (
      <div
        ref={ref}
        className="case-heading"
      >
        {children}
      </div>
    );
  },
);

const Card = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  function Card({ children }, ref) {
    return (
      <div
        ref={ref}
        data-testid="hero-device"
        style={{
          transformOrigin: "50% 0%",
          willChange: "transform",
          boxShadow:
            "0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.08)",
        }}
        className="hero-device-card case-device"
      >
        <div className="case-camera" />
        <div className="case-display">
          {children}
        </div>
      </div>
    );
  },
);
