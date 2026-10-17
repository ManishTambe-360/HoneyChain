function Logo({ size = 72 }) {
  return (
    <svg width={size} height={size * 0.68} viewBox="0 0 44 30" aria-hidden="true">
      <polygon points="30,1 42,8 42,22 30,29 18,22 18,8" fill="#F6C768" stroke="#6E4116" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="14,1 26,8 26,22 14,29 2,22 2,8" fill="#E8A33A" stroke="#6E4116" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export default Logo;