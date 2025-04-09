"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef(null);;

  const prevPoint = useRef(null);

  const [mouseDown, setMouseDown] = useState(false);

  const draw = ({ ctx, currentPosition, prevPosition }) => {
    const { x: currX, y: currY } = currentPosition;

    const startPosition = prevPosition ?? currentPosition;
    ctx?.beginPath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#000";
    ctx.moveTo(startPosition.x, startPosition.y);
    ctx.lineTo(currX, currY);

    ctx.stroke();

    ctx.fillStyle = "#000";
    ctx.arc(startPosition.x, startPosition.y, 2, 0, 2 * Math.PI);
    ctx.fill();
  };

  useEffect(() => {
    const handler = (e) => {
      if (!mouseDown) return;
      console.log("draw");
      const currentPosition = getCurrentPosition(e);
      const ctx = canvasRef?.current?.getContext("2d");

      if (!ctx || !currentPosition) return;
      draw({ ctx, currentPosition, prevPosition: prevPoint?.current });
      prevPoint.current = currentPosition;
    };

    const getCurrentPosition = (e) => {
      const canvas = canvasRef?.current;
      if (!canvas) return;

      const rect = canvas?.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      return { x, y };
    };

    const handleMouseUp = () => {
      setMouseDown(false);
      prevPoint.current = null;
    };
    canvasRef?.current?.addEventListener("mousemove", handler);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvasRef?.current?.removeEventListener("mousemove", handler);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [mouseDown]);

  console.log(mouseDown, "popp");

  return (
    <>
    <div className="p-24">
    <canvas
        onMouseDown={() => setMouseDown(true)}
        ref={canvasRef}
        width={500}
        height={500}
        className="bg-white border border-black"></canvas>
    </div>

    </>
  );
}