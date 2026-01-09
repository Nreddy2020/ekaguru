import { useEffect, useRef } from 'react';

type AvatarEmotion = 'neutral' | 'happy' | 'thinking' | 'compassionate' | 'celebrating';

interface AvatarCanvasProps {
    emotion: AvatarEmotion;
    isTalking: boolean;
}

export default function AvatarCanvas({ emotion, isTalking }: AvatarCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frame = 0;

        const draw = () => {
            frame++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const size = 100;

            // 1. Base Face (Circle)
            ctx.beginPath();
            ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
            ctx.fillStyle = emotions[emotion].skinColor; // Dynamic Skin Tone based on emotion (e.g., Red blush if shy?)
            // Just standard skin
            ctx.fillStyle = '#FFDFC4';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#333';
            ctx.stroke();

            // 2. Eyes
            drawEyes(ctx, centerX, centerY, emotion, frame);

            // 3. Mouth (Dynamic if talking)
            drawMouth(ctx, centerX, centerY, emotion, isTalking, frame);

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => cancelAnimationFrame(animationRef.current);
    }, [emotion, isTalking]);

    return (
        <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full h-full object-contain"
        />
    );
}

const emotions: Record<AvatarEmotion, any> = {
    neutral: { skinColor: '#FFDFC4' },
    happy: { skinColor: '#FFDFC4' },
    thinking: { skinColor: '#FFDFC4' },
    compassionate: { skinColor: '#FFDFC4' },
    celebrating: { skinColor: '#FFDFC4' }
};

function drawEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, emotion: AvatarEmotion, frame: number) {
    const blink = Math.sin(frame * 0.05) > 0.98; // Random blink

    ctx.fillStyle = '#333';

    if (blink) {
        // Closed eyes
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 20);
        ctx.lineTo(cx - 70, cy - 20);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + 30, cy - 20);
        ctx.lineTo(cx + 70, cy - 20);
        ctx.stroke();
        return;
    }

    if (emotion === 'compassionate') {
        // Softer, wider eyes
        ctx.beginPath();
        ctx.arc(cx - 50, cy - 20, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 50, cy - 20, 15, 0, Math.PI * 2);
        ctx.fill();
    } else if (emotion === 'thinking') {
        // Looking up
        ctx.beginPath();
        ctx.arc(cx - 50, cy - 30, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 50, cy - 30, 10, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Normal eyes
        ctx.beginPath();
        ctx.arc(cx - 50, cy - 20, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 50, cy - 20, 12, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawMouth(ctx: CanvasRenderingContext2D, cx: number, cy: number, emotion: AvatarEmotion, isTalking: boolean, frame: number) {
    ctx.beginPath();
    ctx.lineWidth = 3;

    if (isTalking) {
        // Talking animation (Open/Close)
        const open = Math.sin(frame * 0.2) * 10 + 10;
        ctx.ellipse(cx, cy + 50, 20, open, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        // Static Mouth Expressions
        if (emotion === 'happy' || emotion === 'celebrating') {
            ctx.arc(cx, cy + 40, 30, 0, Math.PI, false); // Smile
            ctx.stroke();
        } else if (emotion === 'compassionate') {
            ctx.moveTo(cx - 20, cy + 50);
            ctx.quadraticCurveTo(cx, cy + 60, cx + 20, cy + 50); // Gentle smile
            ctx.stroke();
        } else if (emotion === 'thinking') {
            ctx.moveTo(cx - 15, cy + 50);
            ctx.lineTo(cx + 15, cy + 50); // Flat line
            ctx.stroke();
        } else {
            ctx.moveTo(cx - 20, cy + 50);
            ctx.quadraticCurveTo(cx, cy + 55, cx + 20, cy + 50); // Neutral
            ctx.stroke();
        }
    }
}
