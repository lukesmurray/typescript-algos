import Full from "./Full";

interface BaseRafBuildOptions {
  /**
   * The maximum number of milliseconds to use per frame.
   */
  maxMillisecondsPerFrame?: number;
}
export interface RafBuildOptionsWithRaf extends BaseRafBuildOptions {
  /**
   * wether or not to use request animation frame while building.
   * If true the build process will use request animation frame to
   * avoid throttling the ui thread.
   */
  useRaf: true;
}
export interface RafBuildOptionsWithoutRaf extends BaseRafBuildOptions {
  /**
   * wether or not to use request animation frame while building.
   * If true the build process will use request animation frame to
   * avoid throttling the ui thread.
   */
  useRaf?: false;
}

export type RafBuildOptions =
  | RafBuildOptionsWithRaf
  | RafBuildOptionsWithoutRaf;
export function normalizeBuildOptions(
  buildOptions?: RafBuildOptions
): Full<RafBuildOptions> {
  return {
    maxMillisecondsPerFrame: 3,
    useRaf: false,
    ...buildOptions,
  };
}
