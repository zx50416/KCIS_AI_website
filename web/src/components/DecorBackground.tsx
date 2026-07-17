"use client";

export function DecorBackground() {
  return (
    <div className="kc-decor" aria-hidden>
      <span
        className="kc-orb"
        style={{
          width: 220,
          height: 220,
          top: "12%",
          left: "-4%",
          background: "radial-gradient(circle, rgba(79,126,200,0.45), transparent 70%)",
        }}
      />
      <span
        className="kc-orb"
        style={{
          width: 280,
          height: 280,
          top: "55%",
          right: "-8%",
          background: "radial-gradient(circle, rgba(143,107,184,0.4), transparent 70%)",
        }}
      />
      <span
        className="kc-orb"
        style={{
          width: 160,
          height: 160,
          bottom: "8%",
          left: "30%",
          background: "radial-gradient(circle, rgba(27,79,156,0.25), transparent 70%)",
        }}
      />
    </div>
  );
}
