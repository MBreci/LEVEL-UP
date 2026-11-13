"use client";

import { Fragment, useSyncExternalStore } from "react";
import { HW_FLOW } from "@/lib/domain/dashboardContent";

function flowCols(): number {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200;
  if (w <= 560) return 1;
  if (w <= 980) return 2;
  return 4;
}

function subscribeResize(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout>;
  function onResize() {
    clearTimeout(timer);
    timer = setTimeout(onChange, 180);
  }
  window.addEventListener("resize", onResize);
  return () => {
    clearTimeout(timer);
    window.removeEventListener("resize", onResize);
  };
}

function useFlowCols(): number {
  return useSyncExternalStore(subscribeResize, flowCols, () => 4);
}

export function FlowSnake() {
  const cols = useFlowCols();

  const rows: { step: string; index: number }[][] = [];
  for (let start = 0; start < HW_FLOW.length; start += cols) {
    rows.push(HW_FLOW.slice(start, start + cols).map((step, k) => ({ step, index: start + k })));
  }

  return (
    <div className="hw-flow" id="hw-flow" style={{ "--flow-cols": cols } as React.CSSProperties}>
      {rows.map((slice, row) => {
        const reversed = cols > 1 && row % 2 === 1;
        const ordered = reversed ? [...slice].reverse() : slice;
        const hasNext = row < rows.length - 1;
        const turnSide = cols === 1 ? "center" : reversed ? "left" : "right";
        return (
          <div key={row}>
            <div className={`hw-flow-row${reversed ? " rev" : ""}`}>
              {ordered.map((item, k) => (
                <Fragment key={item.index}>
                  <div className="hw-flow-step">
                    <div className="hw-flow-n">{item.index + 1}</div>
                    <div className="hw-flow-text">{item.step}</div>
                  </div>
                  {k < ordered.length - 1 && (
                    <div className={`hw-flow-conn ${reversed ? "left" : "right"}`}>
                      <span className="hw-flow-chev">{reversed ? "‹" : "›"}</span>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
            {hasNext && (
              <div className={`hw-flow-turn ${turnSide}`}>
                <span className="hw-flow-chev down">⌄</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
