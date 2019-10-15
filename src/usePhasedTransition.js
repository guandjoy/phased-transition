import React, { useState, useEffect, useMemo } from "react";
import { morphing, spacing, path, phases, randomRange } from "primitivo-svg";

function usePhasedTransition(props) {
  const phaseOneRatio = 3;
  const phaseTwoRatio = 2;

  const getStartGroupsParameters = () => {
    let groups = [];
    for (let i = 0; i < props.numOfGroups - 1; i++) {
      groups.push({
        incircle: props.incircle,
        type: props.incircle ? "radial" : "linear",
        radius: 2,
        round: 1,
        adaptArms: true,
        smartRound: true
      });
    }
    groups.push({
      incircle: props.incircle,
      type: props.incircle ? "radial" : "linear",
      radius: 2,
      round: 1,
      adaptArms: true,
      smartRound: true
    });
    return groups;
  };

  const getEndGroupsParameters = () => {
    let groups = [];
    for (let i = 0; i < props.numOfGroups - 1; i++) {
      groups.push({
        incircle: props.incircle,
        type: props.incircle ? "radial" : "linear",
        distance: 1,
        round: props.incircle ? 1 : 0,
        adaptArms: !props.incircle,
        lengthBasedRound: true
      });
    }
    groups.push({
      incircle: props.incircle,
      type: props.incircle ? "radial" : "linear",
      distance: 1,
      round: 1,
      adaptArms: false,
      lengthBasedRound: true
    });
    return groups;
  };

  const startGroupsParameters = getStartGroupsParameters();
  const endGroupsParameters = getEndGroupsParameters();

  ///////////////
  // Phase one //
  ///////////////

  var progressionsPhaseScope = params => {
    let numOfVertexes = params.endPath.vertexes.length;
    let progressions = Array(numOfVertexes);
    progressions.fill(1, 0, numOfVertexes);
    return progressions;
  };

  var progressionsGeneralScope = params => {
    let numOfVertexes = params.endPath.vertexes.length;
    let progressions = Array(numOfVertexes);
    progressions.fill(params.duration, 0, numOfVertexes);
    return progressions;
  };

  var phaseOneDuration = ({ endPath }) => {
    var { minLength, maxLength } = endPath.parameters;
    // if (minLength < 200) minLength = 200;
    let duration = minLength / phaseOneRatio;
    duration = 0.5 / (maxLength / duration);
    return duration;
  };

  var phaseOneRadius = ({ endPath, progression }) => {
    const { maxLength } = endPath.parameters;
    return maxLength * progression;
  };

  const getPhaseOneGroupsParameters = () => {
    let groups = [];
    for (let i = 0; i < props.numOfGroups - 1; i++) {
      groups.push({
        incircle: () => props.incircle,
        type: () => "radial",
        radius: phaseOneRadius,
        round: () => 1,
        adaptArms: () => true,
        smartRound: () => true
      });
    }
    groups.push({
      incircle: () => props.incircle,
      type: () => (props.incircle ? "radial" : "linear"),
      radius: phaseOneRadius,
      round: () => 1,
      adaptArms: () => true,
      smartRound: () => true
    });
    return groups;
  };

  const phaseOne = {
    duration: phaseOneDuration,
    progressionsPhaseScope,
    progressionsGeneralScope,
    groupsParameters: getPhaseOneGroupsParameters()
  };

  ///////////////
  // Phase two //
  ///////////////

  var duration = ({ prevDurations }) => {
    return 0.5 - prevDurations[0];
  };

  var progressionsPhaseScope = params => {
    let progressions = [];
    const { endPath, duration } = params;
    params.endPath.vertexes.forEach((vertex, index) => {
      let maxLength = endPath.parameters.maxLength;
      let delta = maxLength / vertex.length;
      progressions.push(1 / delta);
    });
    return progressions;
  };

  var progressionsGeneralScope = params => {
    const { duration, endPath, prevPhaseProgressions } = params;
    let progressions = [];
    params.endPath.vertexes.forEach((vertex, index) => {
      let maxLength = endPath.parameters.maxLength;
      let delta = maxLength / vertex.length;
      progressions.push(duration / delta + prevPhaseProgressions[index]);
    });
    return progressions;
  };

  var radiusFirstGroup = ({
    progression,
    endPath,
    vertex,
    progressionsGeneralScope,
    progressionsPhaseScope,
    activePhaseIndex,
    phasesDuration
  }) => {
    let maxLength = endPath.parameters.maxLength;
    let factor =
      (progression / progressionsGeneralScope[activePhaseIndex][vertex.index]) *
      progressionsPhaseScope[activePhaseIndex][vertex.index];
    let result = factor * maxLength;
    return result;
  };

  var radiusSecondGroup = ({
    progression,
    endPath,
    vertex,
    progressionsGeneralScope,
    progressionsPhaseScope,
    activePhaseIndex,
    phasesDuration
  }) => {
    let maxLength = endPath.parameters.maxLength;
    let factor =
      (progression / progressionsGeneralScope[activePhaseIndex][vertex.index]) *
      progressionsPhaseScope[activePhaseIndex][vertex.index];
    let result = factor * maxLength;
    return result / 2;
  };

  const getPhaseTwoGroupsParameters = () => {
    let groups = [];
    for (let i = 0; i < props.numOfGroups - 1; i++) {
      groups.push({
        incircle: () => props.incircle,
        type: () => (props.incircle ? "radial" : "linear"),
        radius: radiusFirstGroup,
        adaptArms: () => true,
        round: () => 1,
        lengthBasedRound: () => true
      });
    }
    groups.push({
      incircle: () => props.incircle,
      type: () => (props.incircle ? "radial" : "linear"),
      radius: radiusSecondGroup,
      adaptArms: () => false,
      round: () => 1,
      lengthBasedRound: () => true
    });
    return groups;
  };

  const phaseTwo = {
    duration,
    progressionsPhaseScope,
    progressionsGeneralScope,
    groupsParameters: getPhaseTwoGroupsParameters()
  };

  /////////////////
  // Phase three //
  /////////////////

  var progressionsPhaseScope = params => {
    let progressions = [];
    const { endPath, duration } = params;
    const { vertexes } = endPath;
    const maxLength = endPath.parameters.maxLengthByGroup[1];

    for (let i = 0; i < vertexes.length; i++) {
      let vertex = vertexes[i];
      if (vertex.group === 0) {
        // Handle M and C type vertexes
        const prevIndex = i === 0 ? vertexes.length - 2 : i - 1;
        const nextIndex = i === vertexes.length - 1 ? 1 : i + 1;

        let prevDelta = maxLength / vertexes[prevIndex].length;
        let nextDelta = maxLength / vertexes[nextIndex].length;

        let prevProgression = 1 / prevDelta;
        let nextProgression = 1 / nextDelta;

        progressions[prevIndex] = prevProgression;
        progressions[nextIndex] = nextProgression;

        progressions[i] =
          nextProgression > prevProgression ? nextProgression : prevProgression;
      } else if (progressions[i] === undefined) {
        let delta = maxLength / vertex.length;
        progressions[i] = 1 / delta;
      }
    }
    return progressions;
  };

  var progressionsGeneralScope = params => {
    const { duration, endPath, prevPhaseProgressions } = params;
    const { vertexes } = endPath;
    const maxLength = endPath.parameters.maxLengthByGroup[1];
    let progressions = [];
    for (let i = 0; i < vertexes.length; i++) {
      let vertex = vertexes[i];
      if (vertex.group === 0) {
        // Handle M and C type vertexes
        const prevIndex = i === 0 ? vertexes.length - 2 : i - 1;
        const nextIndex = i === vertexes.length - 1 ? 1 : i + 1;

        let prevDelta = maxLength / vertexes[prevIndex].length;
        let nextDelta = maxLength / vertexes[nextIndex].length;

        let prevProgression =
          duration / prevDelta + prevPhaseProgressions[prevIndex];
        let nextProgression =
          duration / nextDelta + prevPhaseProgressions[nextIndex];

        progressions[prevIndex] = prevProgression;
        progressions[nextIndex] = nextProgression;

        progressions[i] =
          nextProgression > prevProgression ? nextProgression : prevProgression;
      } else if (progressions[i] === undefined) {
        let delta = maxLength / vertex.length;
        progressions[i] = duration / delta + prevPhaseProgressions[i];
      }
    }
    return progressions;
  };

  var roundFirstGroup = ({
    progression,
    endPath,
    vertex,
    progressionsGeneralScope,
    progressionsPhaseScope,
    activePhaseIndex
  }) => {
    if (props.incircle) return 1;
    const { vertexes } = endPath;
    const prevIndex =
      vertex.index === 0 ? vertexes.length - 2 : vertex.index - 1;
    const nextIndex =
      vertex.index === vertexes.length - 1 ? 1 : vertex.index + 1;
    let prevPhaseGeneralScopeProgression =
      progressionsGeneralScope[activePhaseIndex - 1][vertex.index];
    let firstFactor =
      (prevPhaseGeneralScopeProgression - progression) /
      (prevPhaseGeneralScopeProgression -
        progressionsGeneralScope[activePhaseIndex][prevIndex]);

    let firstArm = 1 - firstFactor;
    if (firstArm < 0) firstArm = 0;
    else if (firstArm > 1) firstArm = 0;

    let secondFactor =
      (prevPhaseGeneralScopeProgression - progression) /
      (prevPhaseGeneralScopeProgression -
        progressionsGeneralScope[activePhaseIndex][nextIndex]);

    let secondArm = 1 - secondFactor;
    if (secondArm < 0) secondArm = 0;
    else if (secondArm > 1) secondArm = 0;
    let result = [firstArm, secondArm];
    return result;
  };

  var radiusSecondGroup = ({
    progression,
    endPath,
    vertex,
    progressionsGeneralScope,
    progressionsPhaseScope,
    activePhaseIndex
  }) => {
    let maxLength = endPath.parameters.maxLengthByGroup[1];
    let factor =
      (progression / progressionsGeneralScope[activePhaseIndex][vertex.index]) *
      progressionsPhaseScope[activePhaseIndex][vertex.index];
    let result = factor * maxLength;
    return result;
  };

  const getPhaseThreeGroupsParameters = () => {
    let groups = [];
    for (let i = 0; i < props.numOfGroups - 1; i++) {
      groups.push({
        incircle: () => props.incircle,
        type: () => (props.incircle ? "radial" : "linear"),
        radius: ({ vertex }) => vertex.length,
        adaptArms: () => !props.incircle,
        round: roundFirstGroup,
        lengthBasedRound: () => true
      });
    }
    groups.push({
      incircle: () => props.incircle,
      type: () => (props.incircle ? "radial" : "linear"),
      radius: radiusSecondGroup,
      adaptArms: () => false,
      round: () => 1,
      lengthBasedRound: () => true
    });
    return groups;
  };

  const phaseThree = {
    duration: () => 0.5,
    progressionsPhaseScope,
    progressionsGeneralScope,
    groupsParameters: getPhaseThreeGroupsParameters()
  };
  const rotate = useMemo(() => (props.incircle ? randomRange(0, 90) : 45), [
    props.incircle
  ]);
  const baseParameters = {
    numOfSegments: props.numOfSegments,
    depth: props.depth,
    x: props.x,
    y: props.y,
    width: props.width,
    height: props.height,
    centerX: props.centerX,
    centerY: props.centerY,
    rotate: rotate,
    numOfGroups: props.numOfGroups
  };

  const phasesOutput = phases({
    loop: false,
    startGroupsParameters,
    endGroupsParameters,
    baseParameters,
    phases: [{ ...phaseOne }, { ...phaseTwo }, { ...phaseThree }]
  });

  return phasesOutput;
}

export default usePhasedTransition;