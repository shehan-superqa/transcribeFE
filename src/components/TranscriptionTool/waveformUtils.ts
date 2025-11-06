export const drawWaveform = (
  canvas: HTMLCanvasElement | null,
  analyser: AnalyserNode | null,
  animationFrameRef: React.MutableRefObject<number | null>
) => {
  if (!canvas || !analyser) return;

  const canvasCtx = canvas.getContext('2d');
  if (!canvasCtx) return;

  // Ensure canvas is properly sized
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width) {
    canvas.width = rect.width;
  }
  if (canvas.height !== 120) {
    canvas.height = 120;
  }

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const draw = () => {
    // Check if we should continue drawing
    if (!analyser || !canvas) {
      return;
    }

    animationFrameRef.current = requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    // Calculate RMS to detect if there's actual audio
    const rms = Math.sqrt(
      Array.from(dataArray).reduce((sum, val) => {
        const normalized = (val - 128) / 128.0;
        return sum + normalized * normalized;
      }, 0) / bufferLength
    );

    const audioThreshold = 0.05;
    const hasAudio = rms > audioThreshold;

    // Clear canvas with dark background
    canvasCtx.fillStyle = '#0a0a0a';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const sliceWidth = (canvas.width * 1.0) / bufferLength;
    const centerY = canvas.height / 2;
    const maxAmplitude = centerY * 0.85;

    // Use different opacity based on audio level
    const waveformOpacity = hasAudio ? 1.0 : 0.3;

    // Create gradient for the waveform
    const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#3b82f6'); // Blue
    gradient.addColorStop(0.5, '#8b5cf6'); // Purple
    gradient.addColorStop(1, '#06b6d4'); // Cyan

    // Draw multiple layers for depth effect
    const layers = [
      { opacity: hasAudio ? 0.3 : 0.1, lineWidth: 8, offset: 0 },
      { opacity: hasAudio ? 0.5 : 0.15, lineWidth: 6, offset: 0 },
      { opacity: hasAudio ? 0.7 : 0.2, lineWidth: 4, offset: 0 },
      { opacity: waveformOpacity, lineWidth: 3, offset: 0 },
    ];

    layers.forEach((layer, layerIndex) => {
      canvasCtx.save();
      canvasCtx.globalAlpha = layer.opacity;
      canvasCtx.strokeStyle = gradient;
      canvasCtx.lineWidth = layer.lineWidth;
      canvasCtx.lineCap = 'round';
      canvasCtx.lineJoin = 'round';
      
      // Add glow effect using shadow (reduced when no audio)
      canvasCtx.shadowBlur = hasAudio ? 15 : 5;
      canvasCtx.shadowColor = layerIndex === layers.length - 1 ? '#3b82f6' : '#8b5cf6';
      
      canvasCtx.beginPath();
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = (dataArray[i] - 128) / 128.0;
        const amplitude = v * maxAmplitude;
        
        // Apply smoothing for more fluid curves
        let y = centerY + amplitude;
        
        // Add slight offset for layered effect
        if (layerIndex > 0) {
          y += Math.sin(i * 0.1) * 2 * layerIndex;
        }

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          // Use quadratic curves for smoother lines
          const prevX = x - sliceWidth;
          const prevV = (dataArray[Math.max(0, i - 1)] - 128) / 128.0;
          let prevY = centerY + (prevV * maxAmplitude);
          if (layerIndex > 0) {
            prevY += Math.sin((i - 1) * 0.1) * 2 * layerIndex;
          }
          
          const cpX = (prevX + x) / 2;
          const cpY = (prevY + y) / 2;
          canvasCtx.quadraticCurveTo(cpX, cpY, x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.stroke();
      canvasCtx.restore();
    });

    // Draw main waveform with enhanced glow
    canvasCtx.save();
    canvasCtx.globalAlpha = waveformOpacity;
    canvasCtx.strokeStyle = gradient;
    canvasCtx.lineWidth = 3;
    canvasCtx.lineCap = 'round';
    canvasCtx.lineJoin = 'round';
    canvasCtx.shadowBlur = hasAudio ? 20 : 5;
    canvasCtx.shadowColor = '#3b82f6';
    
    canvasCtx.beginPath();
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = (dataArray[i] - 128) / 128.0;
      const amplitude = v * maxAmplitude;
      const y = centerY + amplitude;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        // Smooth curves using quadratic bezier
        const prevX = x - sliceWidth;
        const prevV = (dataArray[Math.max(0, i - 1)] - 128) / 128.0;
        const prevY = centerY + (prevV * maxAmplitude);
        
        const cpX = (prevX + x) / 2;
        const cpY = (prevY + y) / 2;
        canvasCtx.quadraticCurveTo(cpX, cpY, x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.stroke();
    canvasCtx.restore();

    // Add subtle particles/sparkles for extra visual appeal (only when audio is present)
    if (hasAudio) {
      canvasCtx.save();
      canvasCtx.globalAlpha = 0.6;
      for (let i = 0; i < bufferLength; i += 10) {
        const v = (dataArray[i] - 128) / 128.0;
        if (Math.abs(v) > 0.3) {
          const x = (i / bufferLength) * canvas.width;
          const y = centerY + (v * maxAmplitude);
          
          const sparkleGradient = canvasCtx.createRadialGradient(x, y, 0, x, y, 3);
          sparkleGradient.addColorStop(0, '#ffffff');
          sparkleGradient.addColorStop(1, 'transparent');
          
          canvasCtx.fillStyle = sparkleGradient;
          canvasCtx.fillRect(x - 3, y - 3, 6, 6);
        }
      }
      canvasCtx.restore();
    }

    // Overlay text when audio is below threshold
    if (!hasAudio) {
      // Draw semi-transparent background for text readability
      canvasCtx.fillStyle = 'rgba(10, 10, 10, 0.7)';
      canvasCtx.fillRect(0, centerY - 20, canvas.width, 40);
      
      canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      canvasCtx.font = '14px sans-serif';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillText('Microphone Preview - Speak to test your mic', canvas.width / 2, centerY + 5);
    }
  };

  draw();
};

