export default function KeeprLogo({
  className = "",
  width = 175,
}) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 350 120"
      width={width}
      height="auto"
      role="img"
      aria-label="Keepr"
    >
      {/* K icon */}

      {/* Left pillar - Trust Blue */}
      <rect
        x="30"
        y="25"
        width="18"
        height="70"
        rx="4"
        fill="#1A56DB"
      />

      {/* Upper arm - Verification Green */}
      <path
        d="M 48 60 L 82 25 C 85 22, 92 25, 89 30 L 55 65 Z"
        fill="#059669"
      />

      {/* Lower arm - Trust Blue */}
      <path
        d="M 55 60 L 92 100 C 95 103, 87 110, 82 105 L 42 65 Z"
        fill="#1A56DB"
      />

      {/* Brand name */}
      <text
        x="115"
        y="82"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize="64"
        fill="#1A56DB"
        letterSpacing="-1.5"
      >
        Keepr
      </text>

      {/* Verification dot */}
      <circle
        cx="294"
        cy="82"
        r="8"
        fill="#059669"
      />
    </svg>
  );
}