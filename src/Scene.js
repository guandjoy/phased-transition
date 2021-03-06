import React, { useMemo, useState, useEffect, useRef } from "react";
import { morphing, spacing } from "primitivo-svg";
// Local components
import Composition from "./Composition";
import ShapeToggle from "./misc/ShapeToggle";

function Scene(props) {
  const [effectsData, setEffectsData] = useState([]);
  const [compositionSize, setCompositionSize] = useState(10);
  const resizeHandler = () => {
    setCompositionSize(sceneRef.current.offsetWidth);
  };
  useEffect(() => {
    window.addEventListener("resize", resizeHandler);
    console.log("scene ref", sceneRef);
    setCompositionSize(sceneRef.current.offsetWidth);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);
  const [incircle, setIncircle] = useState(true);
  const [transition, setTransition] = useState(false);
  const [depth, setDepth] = useState(0);
  const [numOfSegments, setNumOfSegments] = useState(4);
  const [numOfGroups, setNumOfGroups] = useState(2);
  const [centerX, setCenterX] = useState(100);
  const [centerY, setCenterY] = useState(100);
  const [numOfClicks, setNumOfClicks] = useState(0);
  // const debouncedDepth = useDebounce(depth, depth * 200);
  const updateDepth = factor => {
    setDepth(depth => {
      let result = depth + factor;
      // Limit number of segment
      return result < 0 || result > 5 ? depth : result;
    });
  };

  const interactiveArea = useRef();
  const sceneRef = useRef();
  const handleClick = e => {
    e.preventDefault();
    var offsets = interactiveArea.current.getBoundingClientRect();
    let clickX = e.clientX - offsets.left;
    let clickY = e.clientY - offsets.top;
    setCenterX(clickX);
    setCenterY(clickY);
    var data = {};
    data.centerX = clickX;
    data.centerY = clickY;
    data.depth = depth;
    data.active = true;
    data.incircle = incircle;
    data.numOfGroups = numOfGroups;
    data.numOfSegments = incircle ? 3 : 4;
    setEffectsData(effectsData => {
      effectsData.push(data);
      data.index = effectsData.length - 1;
      return effectsData;
    });
    setNumOfClicks(numOfClicks => numOfClicks + 1);
    setTimeout(() => {
      setEffectsData(effectsData => {
        effectsData[data.index].active = false;
        return effectsData;
      });
    }, 2000);
  };

  const effects = effectsData.map((data, index) => {
    if (data.active) {
      return (
        <Composition
          key={index}
          depth={data.depth}
          x={0}
          y={0}
          centerX={data.centerX}
          centerY={data.centerY}
          compositionWidth={compositionSize}
          compositionHeight={compositionSize}
          width={compositionSize}
          height={compositionSize}
          incircle={data.incircle}
          numOfGroups={data.numOfGroups}
          numOfSegments={data.numOfSegments}
          className={incircle ? "composition circle" : "composition"}
        />
      );
    } else {
      return null;
    }
  });

  const getInteractiveAreaStyles = () => {
    let styles = ["interactive-area"];
    incircle ? styles.push("circle") : styles.push("square");
    // !numOfClicks && styles.push("illumination");
    transition && styles.push("transition");
    styles = styles.join(" ");
    return styles;
  };

  return (
    <div className="scene" ref={sceneRef}>
      <div className="composition-wrapper">
        <div
          className={getInteractiveAreaStyles()}
          ref={interactiveArea}
          onClick={e => handleClick(e)}
          onTransitionEnd={e => setTransition(false)}
        />
        {effects.length && effects}
      </div>
      <ShapeToggle
        incircle={incircle}
        setIncircle={setIncircle}
        transition={transition}
        setTransition={setTransition}
      />
    </div>
  );
}

export default Scene;
