import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Circle } from "react-konva";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Boid } from "./lib/boid";
import { Card, CardContent } from "./components/ui/card";
import { Slider } from "./components/ui/slider";

function App() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [alignWeight, setAlignWeight] = useState(1);
  const [cohesionWeight, setCohesionWeight] = useState(1);
  const [separationWeight, setSeparationWeight] = useState(1);

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
        ) as Boid[];

        newBoids.forEach((boid) => {
          boid.edges(window.innerWidth, window.innerHeight);

          boid.flock(newBoids, {
            alignWeight,
            cohesionWeight,
            separationWeight,
          });
          boid.update();
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
  }, [alignWeight, cohesionWeight, separationWeight]);

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
      <Card className="absolute top-20 right-20 z-10 w-[20em]">
        <CardContent>
          <p>{fps} FPS</p>
          <div className="w-full flex flex-col gap-2">
            <label htmlFor="align">Align: {alignWeight}</label>
            <Slider
              id="align"
              defaultValue={[1]}
              min={0.1}
              max={5}
              step={0.1}
              value={[alignWeight]}
              onValueChange={(setValue) => {
                setAlignWeight(setValue[0]);
              }}
            />
            <label htmlFor="cohesion">Cohesion: {cohesionWeight}</label>
            <Slider
              id="cohesion"
              defaultValue={[1]}
              min={0.1}
              max={5}
              step={0.1}
              value={[cohesionWeight]}
              onValueChange={(setValue) => {
                setCohesionWeight(setValue[0]);
              }}
            />
            <label htmlFor="separation">Separation: {separationWeight}</label>
            <Slider
              id="separation"
              defaultValue={[1]}
              min={0.1}
              max={5}
              step={0.1}
              value={[separationWeight]}
              onValueChange={(setValue) => {
                setSeparationWeight(setValue[0]);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default App;
