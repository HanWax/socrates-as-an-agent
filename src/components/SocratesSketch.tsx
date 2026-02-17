export function SocratesSketch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Sketch of Socrates"
    >
      <defs>
        {/* Filter that wobbles lines to simulate hand-drawn pen strokes */}
        <filter id="hand" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.03"
            numOctaves="4"
            seed="2"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      <g filter="url(#hand)">
        {/* Head */}
        <ellipse
          cx="100"
          cy="52"
          rx="28"
          ry="34"
          stroke="#2a3a52"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Brow line */}
        <path
          d="M78 44 Q88 37 102 38 Q112 39 120 46"
          stroke="#2a3a52"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Left eye */}
        <ellipse
          cx="90"
          cy="48"
          rx="5"
          ry="2.8"
          stroke="#2a3a52"
          strokeWidth="2.2"
        />
        <circle cx="90" cy="48" r="1.5" fill="#2a3a52" />
        {/* Right eye */}
        <ellipse
          cx="110"
          cy="48"
          rx="5"
          ry="2.8"
          stroke="#2a3a52"
          strokeWidth="2.2"
        />
        <circle cx="110" cy="48" r="1.5" fill="#2a3a52" />
        {/* Nose */}
        <path
          d="M100 50 Q96 58 100 64 Q104 62 102 59"
          stroke="#2a3a52"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Beard — outer left */}
        <path
          d="M80 68 Q82 73 77 84 Q74 95 80 105 Q86 113 94 117"
          stroke="#2a3a52"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Beard — inner left */}
        <path
          d="M86 70 Q89 80 84 92 Q81 103 89 113 Q95 119 100 121"
          stroke="#2a3a52"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Beard — outer right */}
        <path
          d="M120 68 Q118 73 123 84 Q126 95 120 105 Q114 113 106 117"
          stroke="#2a3a52"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Beard — inner right */}
        <path
          d="M114 70 Q111 80 116 92 Q119 103 111 113 Q105 119 100 121"
          stroke="#2a3a52"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Beard — centre wisps */}
        <path
          d="M96 73 Q98 88 97 103 Q98 115 100 121"
          stroke="#2a3a52"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M104 73 Q102 88 103 103 Q102 115 100 121"
          stroke="#2a3a52"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Neck */}
        <path
          d="M92 82 L89 98"
          stroke="#2a3a52"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M108 82 L111 98"
          stroke="#2a3a52"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* Shoulders */}
        <path
          d="M89 98 Q68 102 50 112 Q40 120 36 134"
          stroke="#2a3a52"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M111 98 Q132 102 150 112 Q160 120 164 134"
          stroke="#2a3a52"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Toga drape */}
        <path
          d="M54 114 Q72 110 91 122 Q102 131 102 144"
          stroke="#2a3a52"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.65"
        />
        <path
          d="M146 114 Q128 110 109 122 Q98 131 98 144"
          stroke="#2a3a52"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.65"
        />
        {/* Torso sides */}
        <path
          d="M36 134 Q34 158 40 184 Q46 204 58 220"
          stroke="#2a3a52"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <path
          d="M164 134 Q166 158 160 184 Q154 204 142 220"
          stroke="#2a3a52"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Toga folds across chest */}
        <path
          d="M50 122 Q68 133 82 150 Q92 164 87 180"
          stroke="#2a3a52"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M58 130 Q76 142 90 160 Q97 174 94 190"
          stroke="#2a3a52"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.45"
        />
        {/* Right arm — raised in gesture */}
        <path
          d="M150 116 Q160 122 167 113 Q174 103 180 94 Q184 87 182 82"
          stroke="#2a3a52"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Hand — open */}
        <path
          d="M182 82 Q179 75 174 70"
          stroke="#2a3a52"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M182 82 Q184 75 186 72"
          stroke="#2a3a52"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M182 82 Q186 78 190 78"
          stroke="#2a3a52"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {/* Left arm — resting */}
        <path
          d="M50 116 Q40 130 34 148 Q30 162 34 172"
          stroke="#2a3a52"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Hem */}
        <path
          d="M58 220 Q80 230 100 227 Q120 230 142 220"
          stroke="#2a3a52"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* Hair — wild */}
        <path
          d="M76 30 Q80 15 92 11 Q102 9 112 14 Q120 19 124 30"
          stroke="#2a3a52"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M80 26 Q86 14 96 12"
          stroke="#2a3a52"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M106 12 Q116 17 120 26"
          stroke="#2a3a52"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Extra hair tufts */}
        <path
          d="M74 36 Q70 28 72 20"
          stroke="#2a3a52"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M126 36 Q130 28 128 20"
          stroke="#2a3a52"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}
