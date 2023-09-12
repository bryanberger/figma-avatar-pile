// Defaults
const DEFAULT_DEPTH_PERCENTAGE = 40;
const DEFAULT_USE_FULL_END_CAP = true;

// Need fills or the mask doesn't show
const dumbFill: Paint = { type: "SOLID", color: { r: 1, g: 0, b: 0 } };

figma.parameters.on("input", async ({ query, key, result }) => {
  switch (key) {
    case "size":
      setSuggestionsForNumberInput(query, result, generateNumberArray(16, 96));
      break;
    case "gap":
      setSuggestionsForNumberInput(
        query,
        result,
        generateNumberArray(2, 32, 1)
      );
      break;
    case "instances":
      setSuggestionsForNumberInput(
        query,
        result,
        generateNumberArray(2, 48, 1)
      );
      break;
    // optional
    case "depth":
      setSuggestionsForNumberInput(
        query,
        result,
        generateNumberArray(10, 90, 10)
      );
      break;
    // optional
    case "useFullEndCap":
      result.setSuggestions(["true", "false"]);
      break;
    default:
      result.setSuggestions([]);
  }
});

// create a ParameterValuesType
type ParameterValuesType = {
  size: number;
  gap: number;
  instances: number;
  depth?: number;
  useFullEndCap?: boolean;
};

// assign the ParameterValuesType to the parameters

figma.on("run", async ({ parameters }) => {
  let { size, gap, instances, depth, useFullEndCap } =
    parameters as ParameterValuesType;

  if (parameters === undefined) {
    figma.closePlugin();
    return;
  }

  // if depth is not defined, use the default
  if (depth === undefined) {
    depth = DEFAULT_DEPTH_PERCENTAGE;
  }

  // if useFullEndCap is not defined, use the default
  if (useFullEndCap === undefined) {
    useFullEndCap = DEFAULT_USE_FULL_END_CAP;
  }

  // Format string params as numbers
  size = Number(size);
  gap = Number(gap);
  depth = Number(depth);
  instances = Number(instances);

  // Calculate other values required
  const cutDepth = (size * depth) / 100;
  const cutoutDiameter = size + gap * 2;
  const cx = size - cutDepth;
  const cy = -gap;
  const itemSpacing = -(cutDepth - gap);

  const topLevelFrame = figma.createFrame();
  topLevelFrame.name = "Avatar Pile";
  topLevelFrame.clipsContent = true;
  topLevelFrame.layoutMode = "HORIZONTAL";
  topLevelFrame.primaryAxisSizingMode = "AUTO";
  topLevelFrame.counterAxisSizingMode = "AUTO";
  topLevelFrame.fills = [];
  topLevelFrame.itemSpacing = itemSpacing;

  // Instance creation loop
  for (let i = 0; i < instances; i++) {
    const frame =
      Boolean(useFullEndCap) && i === instances - 1
        ? createSingleAvatarFull()
        : createSingleAvatarCutout();
    topLevelFrame.appendChild(frame);
  }

  function createSingleAvatarFull() {
    // This is where your fill will go
    const avatar = figma.createEllipse();
    avatar.name = "Fill";
    avatar.x = 0;
    avatar.y = 0;
    avatar.resize(size, size);
    avatar.fills = [dumbFill];
    return avatar;
  }

  function createSingleAvatarCutout() {
    // Create a new frame to place the elements
    const frame = figma.createFrame();
    frame.name = "Avatar Cutout";
    frame.fills = [];
    frame.resizeWithoutConstraints(size, size);

    // This is where your fill will go
    const fill = createSingleAvatarFull();

    // Creating a Mask
    const circle1 = figma.createEllipse();
    circle1.name = "Circle 1";
    circle1.x = 0;
    circle1.y = 0;
    circle1.resize(size, size);
    circle1.fills = [dumbFill];

    const circle2 = figma.createEllipse();
    circle2.name = "Circle 2";
    circle2.x = cx;
    circle2.y = cy;
    circle2.resize(cutoutDiameter, cutoutDiameter);

    // Subtract the Shapes, use it as a Mask
    const subtract = figma.subtract([circle1, circle2], frame);
    subtract.isMask = true;
    frame.appendChild(fill);

    return frame;
  }

  figma.currentPage.appendChild(topLevelFrame);
  figma.viewport.scrollAndZoomIntoView([topLevelFrame]);

  // Close the plugin when done
  figma.closePlugin();
});

function setSuggestionsForNumberInput(
  query: string,
  result: SuggestionResults,
  completions?: string[]
) {
  if (query === "") {
    result.setSuggestions(completions !== undefined ? completions : []);
  } else if (!Number.isFinite(Number(query))) {
    result.setError("Please enter a numeric value");
  } else if (Number(query) <= 0) {
    result.setError("Must be larger than 0");
  } else {
    const filteredCompletions = completions
      ? completions.filter((s) => s.includes(query) && s !== query)
      : [];
    result.setSuggestions([query, ...filteredCompletions]);
  }
}

function generateNumberArray(start: number, end: number, interval: number = 4) {
  return Array.from(
    { length: Math.floor((end - start) / interval) + 1 },
    (_, index) => (start + index * interval).toString()
  );
}
