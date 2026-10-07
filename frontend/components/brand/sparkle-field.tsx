// Fixed positions so server and client render the same field.
const SPARKLES = [
  { x: 8, y: 14, s: 14, d: 11, delay: 0, o: 0.55 },
  { x: 22, y: 72, s: 10, d: 9, delay: 2.5, o: 0.4 },
  { x: 35, y: 30, s: 7, d: 13, delay: 5, o: 0.35 },
  { x: 48, y: 86, s: 12, d: 10, delay: 1.2, o: 0.45 },
  { x: 63, y: 10, s: 9, d: 12, delay: 3.8, o: 0.4 },
  { x: 74, y: 58, s: 16, d: 14, delay: 0.6, o: 0.5 },
  { x: 86, y: 24, s: 8, d: 9, delay: 6.2, o: 0.35 },
  { x: 92, y: 80, s: 11, d: 11, delay: 4.4, o: 0.45 },
  { x: 14, y: 46, s: 6, d: 8, delay: 7, o: 0.3 },
  { x: 57, y: 44, s: 6, d: 10, delay: 8.5, o: 0.25 },
  { x: 81, y: 4, s: 6, d: 9, delay: 2, o: 0.3 },
  { x: 4, y: 92, s: 9, d: 12, delay: 9, o: 0.35 },
];

export function SparkleField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,rgb(91_53_163/0.22),transparent_70%)]" />
      {SPARKLES.map((sparkle, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          className="sparkle"
          style={
            {
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              width: sparkle.s,
              height: sparkle.s,
              color: index % 5 === 0 ? "var(--spark)" : undefined,
              "--sparkle-d": `${sparkle.d}s`,
              "--sparkle-delay": `${sparkle.delay}s`,
              "--sparkle-o": sparkle.o,
            } as React.CSSProperties
          }
        >
          <path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0z" fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}
