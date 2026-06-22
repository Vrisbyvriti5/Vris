import React from 'react';

/**
 * NirviLoader — Premium ultra-minimal loading animation.
 *
 * A tiny serif "N" rotates smoothly in 3D on its center axis while emitting
 * a soft luxury-pink glow pulse.  Pure white background, generous negative
 * space, zero clutter — inspired by Zara / SHEIN / Apple aesthetics.
 *
 * All animation is handled via a single injected <style> block so we avoid
 * any external CSS dependency and keep the component fully self-contained.
 */
const NirviLoader = () => (
  <>
    {/* Scoped keyframes — injected once, garbage-collected when unmounted */}
    <style>{`
      @keyframes nirvi-spin {
        0%   { transform: perspective(600px) rotateY(0deg); }
        100% { transform: perspective(600px) rotateY(360deg); }
      }

      @keyframes nirvi-glow {
        0%, 100% {
          text-shadow:
            0 0 8px  rgba(247, 182, 200, 0.45),
            0 0 20px rgba(247, 182, 200, 0.25),
            0 0 40px rgba(247, 182, 200, 0.10);
          opacity: 1;
        }
        50% {
          text-shadow:
            0 0 14px rgba(247, 182, 200, 0.65),
            0 0 32px rgba(247, 182, 200, 0.40),
            0 0 60px rgba(247, 182, 200, 0.18);
          opacity: 0.92;
        }
      }

      @keyframes nirvi-fade-in {
        from { opacity: 0; transform: scale(0.92); }
        to   { opacity: 1; transform: scale(1); }
      }

      .nirvi-loader-backdrop {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
      }

      .nirvi-loader-letter {
        font-family: 'Playfair Display', 'Georgia', 'Times New Roman', serif;
        font-size: 42px;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: #e0b090;
        line-height: 1;
        user-select: none;
        -webkit-user-select: none;

        /* Glossy / reflective sheen */
        background: linear-gradient(
          165deg,
          #e0b090 0%,
          #ebd1c1 38%,
          #e0b090 52%,
          #d6a382 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;

        /* 3D rotation */
        animation:
          nirvi-spin 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite,
          nirvi-glow 2.4s ease-in-out infinite,
          nirvi-fade-in 0.6s ease-out both;

        /* Subtle depth */
        filter: drop-shadow(0 1px 3px rgba(247, 182, 200, 0.20));
        will-change: transform, opacity;
      }
    `}</style>

    <div className="nirvi-loader-backdrop" role="status" aria-label="Loading NIRVI">
      <span className="nirvi-loader-letter" aria-hidden="true">N</span>
    </div>
  </>
);

export default NirviLoader;
