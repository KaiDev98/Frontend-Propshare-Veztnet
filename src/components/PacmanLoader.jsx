export default function PacmanLoader({ size = 40, color = "#EC5B13" }) {
  const dotSize = size * 0.18;
  const mouthSize = size;

  return (
    <div className="flex items-center justify-center gap-1">
      {/* Pacman Body */}
      <div
        className="relative flex-shrink-0"
        style={{ width: mouthSize, height: mouthSize }}
      >
        <style>{`
          @keyframes chomp {
            0%   { clip-path: polygon(50% 50%, 100% 15%, 100% 0%, 0% 0%, 0% 100%, 100% 100%, 100% 85%); }
            50%  { clip-path: polygon(50% 50%, 100% 50%, 100% 0%, 0% 0%, 0% 100%, 100% 100%, 100% 50%); }
            100% { clip-path: polygon(50% 50%, 100% 15%, 100% 0%, 0% 0%, 0% 100%, 100% 100%, 100% 85%); }
          }
          @keyframes dot1 {
            0%   { opacity: 1;   transform: translateX(0); }
            100% { opacity: 0.2; transform: translateX(-${size * 0.6}px); }
          }
          @keyframes dot2 {
            0%   { opacity: 1;   transform: translateX(0); }
            25%  { opacity: 1;   transform: translateX(0); }
            100% { opacity: 0.2; transform: translateX(-${size * 0.6}px); }
          }
          @keyframes dot3 {
            0%   { opacity: 1;   transform: translateX(0); }
            50%  { opacity: 1;   transform: translateX(0); }
            100% { opacity: 0.2; transform: translateX(-${size * 0.6}px); }
          }
        `}</style>

        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: color,
            animation: "chomp 0.5s linear infinite",
          }}
        />
      </div>

      {/* Dots */}
      {[
        { delay: "0s", anim: "dot1" },
        { delay: "0.15s", anim: "dot2" },
        { delay: "0.3s", anim: "dot3" },
      ].map((dot, i) => (
        <div
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: color,
            animation: `${dot.anim} 0.5s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}