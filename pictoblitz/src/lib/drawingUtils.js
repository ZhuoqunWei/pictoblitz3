// Drawing utility functions for PictoBlitz

/**
 * Draw a single line on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {{x: number, y: number}} start - Start point
 * @param {{x: number, y: number}} end - End point
 * @param {string} color - Line color
 * @param {number} width - Line width
 */
export const drawLine = (ctx, start, end, color, width) => {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
};

/**
 * Draw a circle on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {{x: number, y: number}} center - Center point
 * @param {number} radius - Circle radius
 * @param {string} color - Circle color
 * @param {boolean} fill - Whether to fill the circle
 * @param {number} width - Line width if not filled
 */
export const drawCircle = (ctx, center, radius, color, fill = true, width = 1) => {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
  
  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
};

/**
 * Draw a rectangle on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {{x: number, y: number}} start - Top-left corner
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {string} color - Rectangle color
 * @param {boolean} fill - Whether to fill the rectangle
 * @param {number} lineWidth - Line width if not filled
 */
export const drawRect = (ctx, start, width, height, color, fill = true, lineWidth = 1) => {
  if (fill) {
    ctx.fillStyle = color;
    ctx.fillRect(start.x, start.y, width, height);
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(start.x, start.y, width, height);
  }
};

/**
 * Clear the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export const clearCanvas = (ctx, width, height) => {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
};

/**
 * Draw all elements on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} elements - Drawing elements (lines, circles, etc.)
 */
export const drawElements = (ctx, elements, canvasWidth, canvasHeight) => {
  // Clear canvas
  clearCanvas(ctx, canvasWidth, canvasHeight);
  
  // Draw all elements
  elements.forEach(element => {
    switch (element.type) {
      case 'line':
        const start = { x: element.startX, y: element.startY };
        const end = { x: element.endX, y: element.endY };
        drawLine(ctx, start, end, element.color, element.width);
        break;
      case 'circle':
        const center = { x: element.centerX, y: element.centerY };
        drawCircle(ctx, center, element.radius, element.color, element.fill, element.width);
        break;
      case 'rectangle':
        const rectStart = { x: element.startX, y: element.startY };
        drawRect(ctx, rectStart, element.width, element.height, element.color, element.fill, element.lineWidth);
        break;
      default:
        console.warn('Unknown element type:', element.type);
    }
  });
};

/**
 * Get the current position of the mouse relative to the canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {MouseEvent} event - Mouse event
 * @returns {{x: number, y: number}} - Current position
 */
export const getCurrentPosition = (canvas, event) => {
  if (!canvas) return null;
  
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
};

/**
 * Get the distance between two points
 * @param {{x: number, y: number}} point1 - First point
 * @param {{x: number, y: number}} point2 - Second point
 * @returns {number} - Distance between points
 */
export const getDistance = (point1, point2) => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};