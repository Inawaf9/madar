import { StoryReveal } from "./story-reveal";
import { OpportunityScene, DecisionScene, NeighborhoodScene } from "./about-scenes";
import {
  HeroSequence,
  ChapterNarration,
  TurningSequence,
  ClosingSequence,
} from "./about-sequences";

import { stories, type AboutCopy } from "./about-copy";

function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index) => (
        <span
          className="block"
          key={index}
        >
          {line}
        </span>
      ))}
    </>
  );
}

function StoryChapter({
  chapter,
  scene,
  reverse = false,
  dark = false,
}: {
  chapter: AboutCopy["chapters"][number];
  scene: React.ReactNode;
  reverse?: boolean;
  dark?: boolean;
}) {
  return (
    <article
      className={
        dark
          ? "bg-brand-photo text-brand-photo-foreground"
          : reverse
            ? "bg-background"
            : "bg-card"
      }
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-32">
        <div className={reverse ? "lg:order-2" : undefined}>
          <ChapterNarration
            chapter={chapter}
            dark={dark}
          />
        </div>
        <div className={reverse ? "lg:order-1" : undefined}>{scene}</div>
      </div>
    </article>
  );
}

export function AboutStory({ locale }: { locale: string }) {
  const copy = locale === "ar" ? stories.ar : stories.en;
  return (
    <>
      <HeroSequence copy={copy} />
      <section
        id="start"
        className="scroll-mt-28 bg-secondary px-5 py-20 text-center sm:px-8 sm:py-28"
      >
        <StoryReveal>
          <p className="text-sm text-accent-ink">{copy.beginning}</p>
          <h2 className="mx-auto mt-5 max-w-5xl font-display text-editorial font-bold leading-[1.55]">
            <Lines text={copy.beginningText} />
          </h2>
        </StoryReveal>
      </section>
      <StoryChapter
        chapter={copy.chapters[0]}
        scene={<OpportunityScene copy={copy} />}
      />
      <StoryChapter
        chapter={copy.chapters[1]}
        scene={<DecisionScene copy={copy} />}
        reverse
        dark
      />
      <StoryChapter
        chapter={copy.chapters[2]}
        scene={<NeighborhoodScene copy={copy} />}
        reverse
      />
      <TurningSequence copy={copy} />
      <ClosingSequence copy={copy} />
    </>
  );
}
