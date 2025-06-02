// Function to generate a deterministic color based on tokenId
function generateColor(tokenId: string): string {
  // Use the tokenId as a seed for the color
  const hash = Array.from(tokenId).reduce((acc, char) => 
    ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  
  // Generate HSL color with good saturation and lightness
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

// Function to generate a pattern based on tokenId
function generatePattern(tokenId: string): string {
  const hash = Array.from(tokenId).reduce((acc, char) => 
    ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
  
  const numCircles = (Math.abs(hash) % 5) + 3;
  let patterns = '';
  
  for (let i = 0; i < numCircles; i++) {
    const cx = 250 + Math.cos(i * (2 * Math.PI / numCircles)) * 100;
    const cy = 250 + Math.sin(i * (2 * Math.PI / numCircles)) * 100;
    const r = 50 + (hash % 30);
    patterns += `
      <circle 
        cx="${cx}" 
        cy="${cy}" 
        r="${r}" 
        fill="rgba(255,255,255,0.2)"
      />
    `;
  }
  
  return patterns;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;
    const backgroundColor = generateColor(tokenId);
    
    const svg = `
      <svg 
        width="500" 
        height="500" 
        viewBox="0 0 500 500" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${backgroundColor};stop-opacity:0.7" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#grad)"/>
        
        <!-- Pattern -->
        ${generatePattern(tokenId)}
        
        <!-- Token ID -->
        <text 
          x="50%" 
          y="50%" 
          dominant-baseline="middle" 
          text-anchor="middle" 
          font-family="Arial, sans-serif" 
          font-size="48" 
          font-weight="bold" 
          fill="white"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
        >
          #${tokenId}
        </text>
      </svg>
    `.trim();
    
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return Response.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
} 