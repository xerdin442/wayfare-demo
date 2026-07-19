import { useState } from "react";
import { Star } from "lucide-react";

interface CheckoutDetailsProps {
  setRating: (rating: number) => void;
  setComment: (comment: string) => void;
  setDriverTip: (tip: number) => void;
}

const TIP_SUGGESTIONS = [1000, 2000, 3000, 5000, 7500, 10000];

export default function CheckoutDetails({
  setRating,
  setComment,
  setDriverTip,
}: CheckoutDetailsProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [tipInput, setTipInput] = useState("");

  const handleStarClick = (value: number) => {
    setSelectedStar(value);
    setRating(value);
  };

  const handleTipInput = (raw: string) => {
    setTipInput(raw);
    const parsed = parseInt(raw.replace(/\D/g, ""), 10);
    setDriverTip(isNaN(parsed) ? 0 : parsed);
  };

  const handleSuggestionClick = (amount: number) => {
    setTipInput(amount.toLocaleString());
    setDriverTip(amount);
  };

  const activeStar = hoveredStar || selectedStar;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Rate your experience
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleStarClick(n)}
              onMouseEnter={() => setHoveredStar(n)}
              onMouseLeave={() => setHoveredStar(0)}
              className="p-1 transition-transform duration-150 hover:scale-115"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                size={26}
                strokeWidth={1.5}
                className="transition-colors duration-150"
                fill={n <= activeStar ? "#F59E0B" : "none"}
                color={n <= activeStar ? "#F59E0B" : "#D1D5DB"}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="checkout-comment"
          className="text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          Add a comment
          <span className="normal-case tracking-normal font-normal text-gray-300 ml-1">
            (optional)
          </span>
        </label>
        <textarea
          id="checkout-comment"
          rows={2}
          placeholder="How was your ride?"
          onChange={(e) => setComment(e.target.value)}
          className="resize-none w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 focus:bg-white transition-colors duration-200"
        />
      </div>

      {/* Driver Tip */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="checkout-tip"
          className="text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          Driver tip
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">
            &#8358;
          </span>
          <input
            id="checkout-tip"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={tipInput}
            onChange={(e) => handleTipInput(e.target.value)}
            className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 focus:bg-white transition-colors duration-200"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TIP_SUGGESTIONS.map((amount) => {
            const isSelected = tipInput === amount.toLocaleString();
            return (
              <button
                key={amount}
                type="button"
                onClick={() => handleSuggestionClick(amount)}
                className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all duration-150 text-center
                  ${
                    isSelected
                      ? "border-gray-800 bg-gray-800 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                &#8358;{amount.toLocaleString()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
