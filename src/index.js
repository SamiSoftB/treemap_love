//import * as R from "ramda";

import { applyChanges, runVega } from "./selection";

import vegaSpec from "./treeMap";
const vegaEmbed = window.vegaEmbed;
const vega = window.vega;

const createObject = (x, y) => {
  return { [x]: y };
};
vega.expressionFunction("createObject", createObject);

let vegaView;

const chartStruct = {
  columnsData: {
    groups: [
      {
        name: "gender",
        count: 2,
        type: "CATEGORICAL"
      },
      {
        name: "creditCard",
        count: 16,
        type: "CATEGORICAL"
      },
      {
        name: "size",
        count: 7,
        type: "CATEGORICAL"
      }
    ],
    size: {
      name: "sum(sales)",
      domain: [0, 181972.5],
      type: "QUANTITATIVE"
    },
    selection: {
      name: "s",
      type: "SELECTION"
    },
    idx: {
      name: "l",
      type: "LINE"
    }
  }
};

const _createSelectDataMarkChanges = (
  vegaView,
  columnsData,
  values,
  keepSelection = false,
  removeFromSelection = false
) => {
  const datumTuplesToModify = [];
  const currentData = vegaView.data("tree");
  const selectionColName = columnsData.selection.name;
  const quantitativeColName = "size"; /* columnsData.Qcolumn.name */
  const quantitativeSelectionColName =
    "sizeSelected"; /* columnsData.QSelectedColumn.name */
  const datumIdxColName = columnsData.idx.name;

  currentData.forEach((datum) => {
    const isIntendedForSelection = values.some(
      (value) => value[datumIdxColName] === datum[datumIdxColName]
    );
    // Case 1: keep current selection and remove from selection bars in the brush
    if (
      values.length > 0 &&
      keepSelection && // shift key pressed keep current selection
      datum[selectionColName] > 0 &&
      removeFromSelection && // altKey pressed => remove
      isIntendedForSelection
    ) {
      datumTuplesToModify.push({
        datum,
        field: selectionColName,
        value: 0
      });
    }
    // Case 2: select bars
    if (!removeFromSelection && isIntendedForSelection) {
      datumTuplesToModify.push({
        datum,
        field: selectionColName,
        value: 1
      });
      // Set selected amount to amount
      datumTuplesToModify.push({
        datum,
        field: quantitativeSelectionColName,
        value: datum[quantitativeColName]
      });
    }
    // Case 3: TODO Describe.
    if (
      !keepSelection &&
      datum[selectionColName] > 0 &&
      !isIntendedForSelection
    ) {
      // -- No shift, all other datamarks are unselected
      datumTuplesToModify.push({
        datum,
        field: selectionColName,
        value: 0
      });
    }
    // Default case
  });

  return { datumTuplesToModify };
};

const handleResetSelectionClick = (_signal, signalValue) => {
  if (!signalValue.value) return;

  try {
    if (signalValue.selectionIsOn) {
      //console.log("hello", signalValue)
      const currentData = vegaView.data("tree");
      const selection = vegaView.data("chartStruct")[0].columnsData.selection
        .name;

      const datumTuplesToModify = [];
      currentData.forEach((datum) => {
        if (datum[selection] && datum[selection] > 0) {
          datumTuplesToModify.push({
            datum,
            field: selection,
            value: 0
          });
        }
      });
      applyChanges(vegaView, "tree", { datumTuplesToModify });
      runVega(vegaView, "tree");

      // Call the API.
      //getResetSelectionOpToAPI()
    }
  } catch (e) {
    console.error(e);
  }
};

const handleMarkSelectionClick = (_signal, signalValue) => {
  try {
    //console.log("markSelection signalValue", signalValue);
    applyChanges(
      vegaView,
      "tree",
      _createSelectDataMarkChanges(
        vegaView,
        signalValue.chartStructure.columnsData,
        [signalValue.value],
        signalValue.ctrlKey,
        signalValue.altKey
      )
    );
    runVega(vegaView, "tree");
    vegaView.runAsync();

    // Call the API.
    // getSimpleSelectionOpForApi({
    //   datum: signalValue.value,
    //   isResetting: !signalValue.shiftKey,
    //   isRemoving: signalValue.shiftKey && signalValue.altKey,
    //   type: 'formula',
    // })
  } catch (e) {
    console.error(e);
  }
};

const _getRectBrushSelectionOpsForApi = ({
  vegaView,
  signalValue,
  xExclusive = false,
  yExclusive = false
}) => {
  const brush = signalValue.brush;

  if (brush.state === "stop") {
    const chartStructure = signalValue.chartStructure;
    const columnsData = chartStructure.columnsData;

    const xSegmentInDomain = brush.segmentInDomain.x;
    const ySegmentInDomain = brush.segmentInDomain.y;

    const currentData = vegaView.data("tree");

    const intervals = {
      x: xSegmentInDomain,
      y: ySegmentInDomain
    };

    const indexes = currentData.filter((datum) => {
      return (
        (xExclusive ||
          (datum.y0 <= ySegmentInDomain[1] &&
            datum.y1 >= ySegmentInDomain[0])) &&
        (yExclusive ||
          (datum.x0 <= xSegmentInDomain[1] && datum.x1 >= xSegmentInDomain[0]))
      );
    });

    // getRectBrushSelectionOpsForApi({
    //   quantitativeExclusiveFlag,
    //   categoryExclusiveFlag,
    //   columnsData,
    //   indexes,
    //   intervals,
    //   quantitativeBrushSegmentInDomain,
    //   categoryBrushList,
    //   nameNIdxOfByColumnTuples,
    //   brush,
    // })

    return _createSelectDataMarkChanges(
      vegaView,
      columnsData,
      indexes,
      brush.domEvent.ctrlKey || brush.domEvent.metaKey,
      brush.domEvent.altKey
    );
  }
};

const handleRectangleSelectionBrush = (_signal, signalValue) => {
  try {
    applyChanges(
      vegaView,
      "tree",
      _getRectBrushSelectionOpsForApi({ vegaView, signalValue })
    );
    runVega(vegaView, "tree");
  } catch (e) {
    console.error(e);
  }
};

const handleXSliceSelectionBrush = (_signal, signalValue) => {
  try {
    applyChanges(
      vegaView,
      "tree",
      _getRectBrushSelectionOpsForApi({
        vegaView,
        signalValue,
        xExclusive: true
      })
    );
    runVega(vegaView, "tree");
  } catch (e) {
    console.error(e);
  }
};

const handleYSliceSelectionBrush = (_signal, signalValue) => {
  try {
    applyChanges(
      vegaView,
      "tree",
      _getRectBrushSelectionOpsForApi({
        vegaView,
        signalValue,
        yExclusive: true
      })
    );
    runVega(vegaView, "tree");
  } catch (e) {
    console.error(e);
  }
};

const handleZoom = (_signal, signalValue) => {
  if (!vegaView || !signalValue) return null;
  const {
    anchor,
    zoomX,
    zoomY,
    xRangeNormalized,
    yRangeNormalized,
    width,
    height
  } = signalValue;

  let newXRange = [
    span(xRangeNormalized) > 1 && xRangeNormalized[0] === 0
      ? 0
      : anchor[0] / width +
        (xRangeNormalized[0] - anchor[0] / width) * zoomX[0],
    span(xRangeNormalized) > 1 && xRangeNormalized[1] === 1
      ? 1
      : anchor[0] / width + (xRangeNormalized[1] - anchor[0] / width) * zoomX[1]
  ];
  let newYRange = [
    span(yRangeNormalized) > 1 && yRangeNormalized[0] === 0
      ? 0
      : anchor[1] / height +
        (yRangeNormalized[0] - anchor[1] / height) * zoomY[0],
    span(yRangeNormalized) > 1 && yRangeNormalized[1] === 1
      ? 1
      : anchor[1] / height +
        (yRangeNormalized[1] - anchor[1] / height) * zoomY[1]
  ];

  if (span(newXRange) < 1 || span(newYRange) < 1) {
    newXRange = [0, 1];
    newYRange = [0, 1];
  }

  // console.group("zooming");
  // //console.log("signalValue", signalValue);
  // //console.log("oldRange", xRangeNormalized);
  // console.log("newRange", newXRange);
  // console.log("newRange", span(newXRange));
  // console.groupEnd();

  const userData = vegaView.data("userData")[0];
  const columnsData = userData.columnsData;

  const newUserData = {
    ...columnsData,
    x: {
      ...columnsData.x,
      rangeZoom: newXRange,
      zoomed: true
    },
    y: {
      ...columnsData.y,
      rangeZoom: newYRange,
      zoomed: true
    },
    operation: "zooming"
  };
  const datumTuplesToModify = [
    {
      datum: userData,
      field: "columnsData",
      value: newUserData
    }
  ];

  applyChanges(vegaView, "userData", { datumTuplesToModify });
};

const span = (x) => {
  return x[1] - x[0];
};
const handlePan = (_signal, signalValue) => {
  if (!signalValue) return null;
  const {
    xcur,
    ycur,
    xRangeNormalized,
    yRangeNormalized,
    deltaX,
    deltaY,
    width,
    height
  } = signalValue;

  if (
    !(
      xcur &&
      ycur &&
      xRangeNormalized &&
      yRangeNormalized &&
      deltaX &&
      deltaY &&
      width &&
      height
    )
  )
    return null;

  if (
    deltaX[0] === 0 &&
    deltaX[1] === 0 &&
    deltaY[0] === 0 &&
    deltaY[1] === 0
  ) {
    return null;
  }

  const _clampRange = (range, min, max) => {
    let lo = range[0];
    let hi = range[1];
    let span;

    if (hi < lo) {
      span = hi;
      hi = lo;
      lo = span;
    }
    span = hi - lo;

    return span >= max - min
      ? [min, max]
      : [(lo = Math.min(Math.max(lo, min), max - span)), lo + span];
  };

  const newXRange = _clampRange(
    [(xcur[0] + deltaX[0]) / width, (xcur[1] + deltaX[1]) / width],
    1 - span(xRangeNormalized),
    span(xRangeNormalized)
  );

  const newYRange = _clampRange(
    [(ycur[0] + deltaY[0]) / height, (ycur[1] + deltaY[1]) / height],
    1 - span(yRangeNormalized),
    span(yRangeNormalized)
  );

  if (
    !(
      Number.isFinite(newXRange[0]) &&
      Number.isFinite(newXRange[1]) &&
      Number.isFinite(newYRange[0]) &&
      Number.isFinite(newYRange[1])
    )
  ) {
    return null;
  }

  // console.group("panning");
  // //console.log("signalValue", signalValue);
  // //console.log("oldRange", xRangeNormalized);
  // console.log("newRange", newXRange);
  // console.log("span newRange", span(newXRange));
  // console.groupEnd();

  const userData = vegaView.data("userData")[0];
  const columnsData = userData.columnsData;

  const newUserData = {
    ...columnsData,
    x: {
      ...columnsData.x,
      rangeZoom: newXRange,
      zoomed: true
    },
    y: {
      ...columnsData.y,
      rangeZoom: newYRange,
      zoomed: true
    },
    operation: "panning"
  };
  const datumTuplesToModify = [
    {
      datum: userData,
      field: "columnsData",
      value: newUserData
    }
  ];

  setTimeout(
    () => applyChanges(vegaView, "userData", { datumTuplesToModify }),
    0
  );
};

document.getElementById("app").innerHTML = `<div id="vega-container"></div>`;

vegaEmbed("#vega-container", vegaSpec(700, 600, chartStruct), {
  mode: "vega"
})
  .then((result) => {
    // add bar selection handler
    // see: https://vega.github.io/vega/docs/api/view/

    vegaView = result.view;

    // result.view.addSignalListener("panObj", handlePan);
    result.view.addSignalListener(
      "resetSelectionOnClick",
      handleResetSelectionClick
    );
    result.view.addSignalListener("OnClickDataMark", handleMarkSelectionClick);
    result.view.addSignalListener(
      "rectBrushForSelection",
      handleRectangleSelectionBrush
    );
    // result.view.addSignalListener(
    //   "sliceXBrushForSelection",
    //   handleXSliceSelectionBrush
    // );
    // result.view.addSignalListener(
    //   "sliceYBrushForSelection",
    //   handleYSliceSelectionBrush
    // );
    result.view.addSignalListener("zoomObj", handleZoom);
    result.view.addSignalListener("panObj", handlePan);
  })
  .catch((error) => {
    console.error("vega:error", error);
  });
