/**
 * Image Generation Service Abstraction
 * Supports multiple providers with a privacy-first explicit consent model.
 */

// Local Mock Adapter for offline/privacy-safe testing
class MockImageProvider {
  async generateVariations(originalImage, subject, context, count) {
    // Simulates generating variations locally using SVG filters for MVP
    await new Promise((res) => setTimeout(res, 1200)); // Simulate latency
    
    const variations = [];
    const tints = [
      'rgba(5, 150, 105, 0.22)', // Green/Mist
      'rgba(217, 119, 6, 0.22)',  // Warm Sun
      'rgba(37, 99, 235, 0.22)',  // River/Sky
      'rgba(147, 51, 234, 0.22)'  // Purple/Dusk
    ];

    for (let i = 0; i < count; i++) {
      const tint = tints[i % tints.length];
      const svgOverlay = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
        <defs>
          <filter id="f${i}">
            <feColorMatrix type="hueRotate" values="${(i + 1) * 45}"/>
            <feColorMatrix type="matrix" values="0.9 0 0 0 0  0 0.9 0 0 0  0 0 0.9 0 0  0 0 0 1 0"/>
          </filter>
        </defs>
        <rect width="300" height="300" fill="#f3f4f6"/>
        <image href="${originalImage}" width="300" height="300" preserveAspectRatio="xMidYMid slice" filter="url(#f${i})"/>
        <rect width="300" height="300" fill="${tint}"/>
        <rect y="240" width="300" height="60" fill="rgba(20, 35, 26, 0.85)"/>
        <text x="150" y="275" font-family="sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">Synthetic Variant ${i + 1}</text>
      </svg>`;
      
      variations.push(`data:image/svg+xml;utf8,${encodeURIComponent(svgOverlay)}`);
    }
    return variations;
  }
}

// Current configured provider
let activeProvider = new MockImageProvider();

/**
 * Switch the active AI provider (e.g., when keys are entered)
 */
export function setImageProvider(provider) {
  activeProvider = provider;
}

/**
 * Generate controlled variations of an original image for cognitive games.
 * MUST include explicit consent before external API calls.
 */
export async function generateVariations({ originalImage, subject, description, context, language, count = 3, hasExplicitConsent = false }) {
  if (!originalImage) throw new Error("Original image required for memory variations.");
  
  // Privacy Guard
  if (activeProvider.constructor.name !== 'MockImageProvider' && !hasExplicitConsent) {
    throw new Error("PRIVACY GUARD: External image generation requires explicit caregiver consent.");
  }
  
  return activeProvider.generateVariations(originalImage, subject, context, count);
}

