// components/remotion-composition.tsx
import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
  interpolate,
  Easing,
  useCurrentFrame,
  Video,
} from "remotion";

interface Caption {
  text: string;
  start: number;
  end: number;
}

interface RemotionCompositionProps {
  captions: Caption[];
  style: "bottom" | "top" | "karaoke";
  videoUrl: string;
}

export const CaptionedVideoComposition: React.FC<RemotionCompositionProps> = ({
  captions = [],
  style = "bottom",
  videoUrl = "",
}) => {
  const { fps, width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Use Remotion's Video component so renderer handles loading/decoding */}
      {videoUrl ? (
        <Video
          src={videoUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : null}

      {captions.map((caption, idx) => {
        const startFrame = Math.max(0, Math.round(caption.start * fps));
        const endFrame = Math.max(startFrame + 1, Math.round(caption.end * fps));
        const duration = Math.max(1, endFrame - startFrame);

        return (
          <Sequence key={idx} from={startFrame} durationInFrames={duration}>
            <CaptionElement
              text={caption.text}
              style={style}
              width={width}
              height={height}
              duration={duration}
              fps={fps}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

interface CaptionElementProps {
  text: string;
  style: "bottom" | "top" | "karaoke";
  width: number;
  height: number;
  duration: number;
  fps: number;
}

const CaptionElement: React.FC<CaptionElementProps> = ({
  text,
  style,
  width,
  height,
  duration,
  fps,
}) => {
  const frame = useCurrentFrame(); // correct hook
  const localFrame = frame % Math.max(1, duration);

  // Fade in/out animation
  const fadeIn = Math.max(0, Math.min(1, fps * 0.3)); // number of frames for fade
  const fadeOutStart = Math.max(0, duration - fadeIn);

  const opacity = interpolate(
    localFrame,
    [0, fadeIn, fadeOutStart, duration],
    [0, 1, 1, 0],
    {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Detect Devanagari script
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const fontFamily = hasDevanagari
    ? '"Noto Sans Devanagari", "Noto Sans", sans-serif'
    : '"Noto Sans", sans-serif';

  const base: React.CSSProperties = {
    fontFamily,
    fontSize: Math.round(Math.max(24, width / 22)),
    fontWeight: 600,
    textAlign: "center",
    width: "90%",
    opacity,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
    position: "absolute",
    maxWidth: "90%",
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
    padding: "12px 24px",
    pointerEvents: "none",
  };

  let styleObj: React.CSSProperties = {
    ...base,
    bottom: height * 0.1,
    left: "5%",
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 4,
  };

  if (style === "top") {
    styleObj = {
      ...base,
      top: height * 0.08,
      left: "5%",
      color: "#fff",
      backgroundColor: "rgba(0, 128, 255, 0.9)",
      borderRadius: 8,
    };
  } else if (style === "karaoke") {
    styleObj = {
      ...base,
      bottom: height * 0.18,
      left: "5%",
      color: "#000",
      backgroundColor: "rgba(255, 200, 0, 0.95)",
      borderRadius: 8,
    };
  }

  return (
    <AbsoluteFill>
      <div style={styleObj}>{text}</div>
    </AbsoluteFill>
  );
};

export default CaptionedVideoComposition;
