import * as React from "react";
import { useEffect, useLayoutEffect, useState } from "react";
import styled from "styled-components";
import { useGameManager } from "..";
import { PIXEL_WIDTH, t_v } from "../consts";
import { Position } from "../Utils/Position";

type CharPixelProps = Position & { hidden?: boolean };

const StyledCharPixel = styled.span.attrs<CharPixelProps>(({ x, y }) => ({
  style: {
    left: x * PIXEL_WIDTH + "px",
    top: y * PIXEL_WIDTH + "px",
  },
}))<CharPixelProps>`
  position: absolute;
  width: ${PIXEL_WIDTH}px;
  height: ${PIXEL_WIDTH}px;

  /* background: yellow; */
  /* outline: 1px solid red; */

  line-height: ${PIXEL_WIDTH}px;
  display: inline-block;

  ${({ hidden }) => hidden && "opacity: 0;"}
`;

const Short = styled.span<{ h?: number }>`
  transform: scale(1, ${({ h }) => h || 0.7});
  display: inline-block;
`;
const ShortPipe = () => <Short>|</Short>;
const ShortTV = () => <Short h={0.6}>{t_v}</Short>;

export function CharPixel({
  x,
  y,
  z,
  char,
}: Position & { char: string; z?: number }) {
  const gM = useGameManager();

  var content: React.ReactNode | string = char;

  if (char === "|") content = <ShortPipe />;
  if (char === t_v) content = <ShortTV />;

  const [hidden, setHidden] = useState<boolean>(false);

  useLayoutEffect(() => {
    if (char === " ") return;
    const unregister = gM.charPixelGridManager.registerPixel(
      { x, y },
      z || 0,
      setHidden
    );

    return unregister;
  }, [x, y, z, char]);

  return (
    <StyledCharPixel x={x} y={y} hidden={hidden}>
      {content}
    </StyledCharPixel>
  );
}
export function Line({
  x,
  y,
  z,
  text,
}: Position & { z: number; text: string }) {
  return (
    <>
      {text.split("").map((str: string, i: number) => (
        <CharPixel x={x + i} y={y} z={z} char={str} key={i} />
      ))}
    </>
  );
}
