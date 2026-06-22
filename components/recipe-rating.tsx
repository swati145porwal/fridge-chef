"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/profiles";
import { getDeviceId } from "@/hooks/use-device-id";

const T = {
  bg:       "var(--fc-bg)",
  surface:  "var(--fc-surface)",
  card:     "var(--fc-card)",
  card2:    "var(--fc-card2)",
  border:   "var(--fc-border)",
  border2:  "var(--fc-border2)",
  text:     "var(--fc-text)",
  textSub:  "var(--fc-text-sub)",
  textMut:  "var(--fc-text-mut)",
  accent:   "var(--fc-accent)",
  gold:     "var(--fc-gold)",
};

interface RecipeRatingProps {
  recipeId: number;
  recipeName: string;
}

interface RatingData {
  id: string;
  rating: number;
  review: string | null;
  device_id: string;
  created_at: string;
}

export function RecipeRating({ recipeId, recipeName }: RecipeRatingProps) {
  const supabaseReady = isSupabaseConfigured();
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>("");
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [allReviews, setAllReviews] = useState<RatingData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [hoverRating, setHoverRating] = useState<number>(0);

  useEffect(() => {
    if (!supabaseReady) return;
    loadRatings();
  }, [recipeId, supabaseReady]);

  async function loadRatings() {
    if (!supabaseReady) return;
    try {
      const deviceId = getDeviceId();
      const supabase = createClient();
      const { data: ratings, error } = await supabase
        .from("recipe_ratings")
        .select("*")
        .eq("recipe_id", recipeId)
        .order("created_at", { ascending: false });

      if (error) return;

      if (ratings && ratings.length > 0) {
        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        setAvgRating(sum / ratings.length);
        setTotalRatings(ratings.length);
        setAllReviews(ratings.filter((r) => r.review));

        const userRatingData = ratings.find((r) => r.device_id === deviceId);
        if (userRatingData) {
          setUserRating(userRatingData.rating);
          setUserReview(userRatingData.review || "");
          setHasRated(true);
        }
      }
    } catch {
      // Ratings are optional — never break recipe detail
    }
  }

  async function submitRating() {
    if (!supabaseReady) return;
    const deviceId = getDeviceId();
    if (!deviceId || userRating === 0) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      await supabase.from("recipe_ratings").upsert(
        {
          recipe_id: recipeId,
          device_id: deviceId,
          rating: userRating,
          review: userReview.trim() || null,
        },
        { onConflict: "recipe_id,device_id" },
      );

      setHasRated(true);
      setShowReviewForm(false);
      loadRatings();
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!supabaseReady) {
    return null;
  }

  const StarIcon = ({ filled, half }: { filled: boolean; half?: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {half ? (
        <>
          <defs>
            <linearGradient id={`half-${recipeId}`}>
              <stop offset="50%" stopColor={T.gold} />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill={`url(#half-${recipeId})`}
            stroke={T.gold}
            strokeWidth="1.5"
          />
        </>
      ) : (
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={filled ? T.gold : "transparent"}
          stroke={filled ? T.gold : T.textMut}
          strokeWidth="1.5"
        />
      )}
    </svg>
  );

  const renderStars = (rating: number, interactive: boolean = false) => {
    const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;
    
    return (
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={interactive ? () => setUserRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            disabled={!interactive}
            style={{
              background: "none",
              border: "none",
              cursor: interactive ? "pointer" : "default",
              padding: 2,
              display: "flex",
              transition: "transform 0.1s",
              transform: interactive && hoverRating === star ? "scale(1.2)" : "scale(1)",
            }}
          >
            <StarIcon 
              filled={star <= Math.floor(displayRating)} 
              half={star === Math.ceil(displayRating) && displayRating % 1 >= 0.5}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        background: T.card,
        borderRadius: 14,
        border: `1.5px solid ${T.border}`,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      {/* Header strip */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>⭐</span>
        <p style={{ margin: 0, color: T.text, fontSize: 14, fontWeight: 700 }}>Ratings & Reviews</p>
        {totalRatings > 0 && <span style={{ marginLeft: "auto", color: T.textSub, fontSize: 12 }}>{totalRatings} {totalRatings === 1 ? "rating" : "ratings"}</span>}
      </div>
      <div style={{ padding: "14px 16px" }}>

      {/* Average Rating Display */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ 
            fontSize: 32, 
            fontWeight: 700, 
            color: T.gold,
            fontFamily: "var(--font-cormorant), serif",
            lineHeight: 1 
          }}>
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </p>
          <p style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>
            {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
          </p>
        </div>
        <div>
          {renderStars(avgRating)}
        </div>
      </div>

      {/* User Rating Section */}
      {!hasRated ? (
        <div style={{ 
          background: T.card2, 
          borderRadius: 6, 
          padding: 12,
          border: `1px solid ${T.border2}`,
        }}>
          <p style={{ color: T.text, fontSize: 13, marginBottom: 8 }}>
            Rate this recipe
          </p>
          {renderStars(userRating, true)}
          
          {userRating > 0 && (
            <div style={{ marginTop: 12 }}>
              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  style={{
                    background: "none",
                    border: `1px dashed ${T.border2}`,
                    borderRadius: 4,
                    padding: "8px 12px",
                    color: T.textSub,
                    fontSize: 12,
                    cursor: "pointer",
                    width: "100%",
                    fontFamily: "inherit",
                  }}
                >
                  + Add a review (optional)
                </button>
              ) : (
                <textarea
                  value={userReview}
                  onChange={(e) => setUserReview(e.target.value)}
                  placeholder="Share your thoughts about this recipe..."
                  style={{
                    width: "100%",
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 4,
                    padding: 10,
                    color: T.text,
                    fontSize: 13,
                    resize: "vertical",
                    minHeight: 80,
                    fontFamily: "inherit",
                  }}
                />
              )}
              
              <button
                onClick={submitRating}
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  marginTop: 10,
                  background: T.accent,
                  border: "none",
                  borderRadius: 5,
                  padding: "10px 16px",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                  fontFamily: "inherit",
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          background: `var(--fc-accent-light)`,
          borderRadius: 6, 
          padding: 12,
          border: `1px solid var(--fc-accent-glow)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: T.accent, fontSize: 14 }}>✓</span>
            <p style={{ color: T.text, fontSize: 13 }}>
              You rated this {userRating} star{userRating !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { setHasRated(false); setShowReviewForm(true); }}
            style={{
              background: "none",
              border: "none",
              color: T.textSub,
              fontSize: 11,
              cursor: "pointer",
              padding: 0,
              marginTop: 6,
              textDecoration: "underline",
              fontFamily: "inherit",
            }}
          >
            Update your rating
          </button>
        </div>
      )}

      {/* Reviews List */}
      {allReviews.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: T.textSub, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
            Reviews ({allReviews.length})
          </p>
          {allReviews.slice(0, 5).map((review) => (
            <div 
              key={review.id}
              style={{
                background: T.card2,
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 8,
                border: `1px solid ${T.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} width="12" height="12" viewBox="0 0 24 24">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill={s <= review.rating ? "var(--fc-gold)" : "transparent"}
                      stroke={s <= review.rating ? "var(--fc-gold)" : T.textMut}
                      strokeWidth="1.5"
                    />
                  </svg>
                ))}
                <span style={{ fontSize: 10, color: T.textMut, marginLeft: 6 }}>
                  {new Date(review.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </div>
              <p style={{ color: T.text, fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                {review.review}
              </p>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
