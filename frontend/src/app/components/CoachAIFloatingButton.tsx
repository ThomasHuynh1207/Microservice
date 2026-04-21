import { MouseEvent, useEffect, useRef, useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

const BUTTON_SIZE = 68;
const SAFE_MARGIN = 20;
const HEADER_SAFE_TOP = 120;

interface Position {
  x: number;
  y: number;
}

const clampPosition = (position: Position): Position => {
  const maxX = Math.max(SAFE_MARGIN, window.innerWidth - BUTTON_SIZE - SAFE_MARGIN);
  const maxY = Math.max(SAFE_MARGIN, window.innerHeight - BUTTON_SIZE - SAFE_MARGIN);
  const minY = Math.min(HEADER_SAFE_TOP, maxY);

  return {
    x: Math.min(Math.max(position.x, SAFE_MARGIN), maxX),
    y: Math.min(Math.max(position.y, minY), maxY),
  };
};

export function CoachAIFloatingButton() {
  const navigate = useNavigate();
  const [position, setPosition] = useState<Position>({ x: SAFE_MARGIN, y: SAFE_MARGIN });
  const [isReady, setIsReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragState = useRef({
    active: false,
    moved: false,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initial = clampPosition({
      x: window.innerWidth - BUTTON_SIZE - SAFE_MARGIN,
      y: window.innerHeight - BUTTON_SIZE - 88,
    });

    setPosition(initial);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const handleMouseMove = (event: globalThis.MouseEvent) => {
      if (!dragState.current.active) return;

      dragState.current.moved = true;
      setIsDragging(true);

      const next = clampPosition({
        x: event.clientX - dragState.current.offsetX,
        y: event.clientY - dragState.current.offsetY,
      });

      setPosition(next);
    };

    const handleMouseUp = () => {
      dragState.current.active = false;
      setIsDragging(false);
    };

    const handleResize = () => {
      setPosition((current) => clampPosition(current));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleResize);
    };
  }, [isReady]);

  const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    dragState.current.active = true;
    dragState.current.moved = false;
    dragState.current.offsetX = event.clientX - rect.left;
    dragState.current.offsetY = event.clientY - rect.top;
  };

  const handleClick = () => {
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    navigate("/dashboard/coach");
  };

  if (!isReady) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Mở Coach AI"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={`fixed z-20 hidden h-[68px] w-[68px] items-center justify-center rounded-2xl border border-indigo-200 bg-[linear-gradient(145deg,#6366F1_0%,#8B5CF6_100%)] text-white shadow-[0_16px_30px_-18px_rgba(99,102,241,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-18px_rgba(99,102,241,0.95)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/70 lg:flex ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <Bot className="h-8 w-8" />
      <span className="pointer-events-none absolute -top-2 -right-1 rounded-lg bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600 shadow-sm">
        AI
      </span>
      <Sparkles className="pointer-events-none absolute -bottom-1 -left-1 h-4 w-4 text-indigo-100" />
    </button>
  );
}
