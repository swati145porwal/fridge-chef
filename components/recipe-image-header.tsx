"use client";

import { useState } from "react";
import {
  getRecipeImageFallbackUrl,
  getRecipeImageUrl,
  type RecipeImageSource,
} from "@/lib/recipe-images";

interface RecipeImageHeaderProps {
  recipe: RecipeImageSource;
  height: number;
  emoji: string;
  gradient: { g1: string; g2: string; dot: string };
  children?: React.ReactNode;
  borderRadius?: number;
  marginBottom?: number;
  boxShadow?: string;
}

export function RecipeImageHeader({
  recipe,
  height,
  emoji,
  gradient,
  children,
  borderRadius = 0,
  marginBottom = 0,
  boxShadow,
}: RecipeImageHeaderProps) {
  const [src, setSrc] = useState(() => getRecipeImageUrl(recipe));
  const [failed, setFailed] = useState(false);

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
        height,
        borderRadius,
        overflow: "hidden",
        marginBottom,
        position: "relative",
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
          onError={handleImageError}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
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
              fontSize: height > 100 ? 72 : 38,
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
            "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.08) 100%)",
        }}
      />
      {children}
    </div>
  );
}
