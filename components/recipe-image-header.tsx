"use client";

import { useState } from "react";
import {
  getRecipeImageFallbackUrl,
  getRecipeImageUrl,
  type RecipeImageSource,
} from "@/lib/recipe-images";

type ImageVariant = "card" | "hero" | "thumb";

const VARIANT_STYLE: Record<
  ImageVariant,
  { aspectRatio: string; minHeight: number; objectPosition: string }
> = {
  card: { aspectRatio: "16 / 9", minHeight: 128, objectPosition: "center 42%" },
  hero: { aspectRatio: "4 / 3", minHeight: 200, objectPosition: "center 40%" },
  thumb: { aspectRatio: "16 / 9", minHeight: 84, objectPosition: "center 42%" },
};

interface RecipeImageHeaderProps {
  recipe: RecipeImageSource;
  variant?: ImageVariant;
  emoji: string;
  gradient: { g1: string; g2: string; dot: string };
  children?: React.ReactNode;
  borderRadius?: number;
  marginBottom?: number;
  boxShadow?: string;
}

export function RecipeImageHeader({
  recipe,
  variant = "card",
  emoji,
  gradient,
  children,
  borderRadius = 0,
  marginBottom = 0,
  boxShadow,
}: RecipeImageHeaderProps) {
  const [src, setSrc] = useState(() => getRecipeImageUrl(recipe));
  const [failed, setFailed] = useState(false);
  const v = VARIANT_STYLE[variant];

  function handleImageError() {
    const fallback = getRecipeImageFallbackUrl(recipe);
    if (fallback && src !== fallback) {
      setSrc(fallback);
      return;
    }
    setFailed(true);
  }

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: v.aspectRatio,
        minHeight: v.minHeight,
        borderRadius,
        overflow: "hidden",
        marginBottom,
        position: "relative",
        display: "block",
        flexShrink: 0,
        background: failed
          ? `linear-gradient(145deg, ${gradient.g1}, ${gradient.g2})`
          : "#1c1917",
        boxShadow,
      }}
    >
      {!failed && (
        <img
          src={src}
          alt={recipe.name}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "cover",
            objectPosition: v.objectPosition,
          }}
        />
      )}
      {failed && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(circle, ${gradient.dot}18 1px, transparent 1px)`,
              backgroundSize: "12px 12px",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: variant === "hero" ? 72 : 38,
              userSelect: "none",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
            }}
          >
            {emoji}
          </span>
        </>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%)",
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
}

/** Compact image for YouTube-style tiles */
export function RecipeImageThumb({
  recipe,
  label,
}: {
  recipe: RecipeImageSource;
  label: string;
}) {
  const [src, setSrc] = useState(() => getRecipeImageUrl(recipe));
  const v = VARIANT_STYLE.thumb;

  function handleImageError() {
    const fallback = getRecipeImageFallbackUrl(recipe);
    if (fallback && src !== fallback) setSrc(fallback);
  }

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: v.aspectRatio,
        minHeight: v.minHeight,
        position: "relative",
        overflow: "hidden",
        background: "#1c1917",
      }}
    >
      <img
        src={src}
        alt={label}
        loading="lazy"
        decoding="async"
        onError={handleImageError}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: v.objectPosition,
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
    </div>
  );
}
