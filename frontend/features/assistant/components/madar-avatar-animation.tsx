"use client";
import { LottieSvg, type LottieHandle } from "lottie-react";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import animationData from "@/public/animations/madar-avatar/Muslim_Woman.json";
export default function MadarAvatarAnimation({
  state,
  playing,
}: {
  playing: boolean;
  state: "idle" | "thinking";
}) {
  const lottie = useRef<LottieHandle>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced !== false || !playing) lottie.current?.stop();
    else lottie.current?.play();
  }, [reduced, state, playing]);
  // One supplied animation: both states intentionally use the same artwork.
  return (
    <LottieSvg
      lottieRef={lottie}
      src={animationData}
      loop={reduced === false}
      autoplay={false}
      subscriptions={{
        ready: () => {
          if (reduced !== false || !playing) lottie.current?.stop();
          else lottie.current?.play();
        },
      }}
      className="size-full"
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
    />
  );
}
