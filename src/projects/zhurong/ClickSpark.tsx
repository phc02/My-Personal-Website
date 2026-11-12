import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";

type Easing = "linear" | "ease-in" | "ease-in-out" | "ease-out";

type ClickSparkProps = {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: Easing;
  extraScale?: number;
  children: ReactNode;
};

type Spark = {
  x: number;
  y: number;
  angle: number;
  startTime: number;
};

export default function ClickSpark({
  sparkColor = "#fff",
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1,
  children,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const animationIdRef = useRef<number | null>(null);
  const drawRef = useRef<(timestamp: number) => void>(() => undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeTimeout: number | undefined;

    const resizeCanvas = () => {
      const nextWidth = Math.max(1, Math.round(window.innerWidth));
      const nextHeight = Math.max(1, Math.round(window.innerHeight));

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
      }
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, 100);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    resizeCanvas();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.clearTimeout(resizeTimeout);
    };
  }, []);

  const ease = useCallback(
    (value: number) => {
      switch (easing) {
        case "linear":
          return value;
        case "ease-in":
          return value * value;
        case "ease-in-out":
          return value < 0.5
            ? 2 * value * value
            : -1 + (4 - 2 * value) * value;
        default:
          return value * (2 - value);
      }
    },
    [easing],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const draw = (timestamp: number) => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = elapsed / duration;
        const eased = ease(progress);
        const distance = eased * sparkRadius * extraScale;
        const lineLength = sparkSize * (1 - eased);
        const cos = Math.cos(spark.angle);
        const sin = Math.sin(spark.angle);
        const x1 = spark.x + distance * cos;
        const y1 = spark.y + distance * sin;
        const x2 = spark.x + (distance + lineLength) * cos;
        const y2 = spark.y + (distance + lineLength) * sin;

        context.globalAlpha = 1 - progress;
        context.strokeStyle = sparkColor;
        context.lineWidth = 2;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();

        return true;
      });

      context.globalAlpha = 1;
      if (sparksRef.current.length > 0) {
        animationIdRef.current = requestAnimationFrame(draw);
      } else {
        animationIdRef.current = null;
      }
    };

    drawRef.current = draw;
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [duration, ease, extraScale, sparkColor, sparkRadius, sparkSize]);

  const handleClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const now = performance.now();
    const newSparks = Array.from({ length: sparkCount }, (_, index) => ({
      x,
      y,
      angle: (2 * Math.PI * index) / sparkCount,
      startTime: now,
    }));

    sparksRef.current.push(...newSparks);
    if (animationIdRef.current === null) {
      animationIdRef.current = requestAnimationFrame(drawRef.current);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative min-h-screen w-full"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[100] block h-screen w-screen select-none"
      />
      {children}
    </div>
  );
}
