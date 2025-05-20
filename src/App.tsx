import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Circle, Text } from "react-konva";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Boid } from "./lib/boid";

function App() {
  const stageRef = useRef<Konva.Stage | null>(null);

  const [boids, setBoids] = useState<Boid[]>([]);
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    const created = [];
    for (let i = 0; i < 100; i++) {
      created.push(new Boid(window.innerWidth, window.innerHeight));
    }
    setBoids(created);
  }, []);

  // Animation loop for boids and FPS counter
  useEffect(() => {
    let animationId: number;

    function animate() {
      setBoids((prevBoids) => {
        // Create new boid instances to avoid mutating state directly
        const newBoids = prevBoids.map((b) =>
          Object.assign(Object.create(Object.getPrototypeOf(b)), b),
        );
        newBoids.forEach((boid) => {
          boid.flock(newBoids);
          boid.update();
          boid.edges(window.innerWidth, window.innerHeight);
        });
        return newBoids;
      });

      // FPS calculation
      frameCount.current++;
      const now = performance.now();
      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = now;
      }

      animationId = requestAnimationFrame(animate);
    }
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Snippet from Konva docs
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition()!;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // how to scale? Zoom in? Or zoom out?
    let direction = e.evt.deltaY > 0 ? 1 : -1;

    // when we zoom on trackpad, e.evt.ctrlKey is true
    // in that case lets revert direction
    if (e.evt.ctrlKey) {
      direction = -direction;
    }

    const scaleBy = 1.01;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
  };

  return (
    <>
      <Stage
        ref={stageRef}
        draggable
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleWheel}
        fill="white"
        className="border-2 border-black fixed"
      >
        <Layer>
          <Rect x={20} y={20} width={100} height={100} fill="red" draggable />
          <Circle x={200} y={200} radius={50} fill="green" draggable />
          <Text text="Hello, Konva!" fontSize={24} x={300} y={300} />
        </Layer>
        <Layer>
          {boids.map((boid, index) => (
            <Circle
              key={index}
              x={boid.position.x}
              y={boid.position.y}
              radius={2}
              fill="blue"
              draggable
            />
          ))}
        </Layer>
      </Stage>
      <div className="absolute z-20 w-[50px] h-[50px] bg-red-500 flex items-center justify-center text-white text-lg select-none">
        {fps} FPS
      </div>
    </>
  );
}

export default App;
