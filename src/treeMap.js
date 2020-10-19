import buildTooltip from "./buildTooltipTreeMap";
import {
  linearGradientBlue,
  linearGradientBluePastel,
  divergentGradientBlueRed,
  divergentGradientBlueRedPastel,
  categoriesPalette10,
  categoriesPalette10Pastel
} from "./chartsStyling";

import {
  getRectBrush,
  getSliceXBrush,
  getSliceYBrush,
  getRectBrushForSelection,
  getSliceXBrushForSelection,
  getSliceYBrushForSelection
} from "./rectSelectionBrush";

const getEventProxySignal = (config = { minMoveInPixels: 10 }) => ({
  name: "eventProxy",
  value: {
    event: null,
    mouseMoveInRange: { x: [0, 0], y: [0, 0] },
    mouseMoveInDomain: { x: [0, 0], y: [0, 0] },
    polygonInRange: []
  },
  on: [
    // Mousedown
    {
      events:
        "view:mousedown[event.button === 0 && !event.crtlKey && !event.metaKey]",
      update: `{
        event: null,
        domEvent: event,
        item: event.item,
        mouseMoveInRange: { x: [x(), x()], y: [y(), y()], distance: 0 },
        polygonInRange: [ [ x(), y() ] ],
        polygonInDomain: [ [ invert('xScale', x()), invert('yScale', y()) ] ]
      }`
    },
    {
      events:
        "view:mousedown[event.button === 0 && !event.crtlKey && !event.metaKey]",
      update: `{
        event: 'mousedown',
        domEvent: eventProxy.event,
        item: eventProxy.item,
        mouseMoveInRange: eventProxy.mouseMoveInRange,
        mouseMoveInDomain: {
          x: [invert('xScale', eventProxy.mouseMoveInRange.x[0]), invert('xScale', eventProxy.mouseMoveInRange.x[1])],
          y: [invert('yScale', eventProxy.mouseMoveInRange.y[0]), invert('yScale', eventProxy.mouseMoveInRange.y[1])]
        },
        polygonInRange: eventProxy.polygonInRange,
        polygonInDomain: eventProxy.polygonInDomain
      }`
    },
    // Mousemove
    // polygonInRange: push(eventProxy.polygonInRange, [clamp(x(), 0, width), clamp(y(), 0, height)]),
    {
      events:
        "[view:mousedown[event.button === 0 && !event.crtlKey && !event.metaKey], window:mouseup] > window:mousemove!",
      update: `{
        event: eventProxy.event,
        domEvent: event,
        item: eventProxy.item,
        mouseMoveInRange: {
          x: [eventProxy.mouseMoveInRange.x[0], x()],
          y:[eventProxy.mouseMoveInRange.y[0] , y()],
          distance: eventProxy.mouseMoveInRange.distance
        }
      }`
    },
    {
      events:
        "[view:mousedown[event.button === 0 && !event.crtlKey && !event.metaKey], window:mouseup] > window:mousemove!",
      update: `{
        event: eventProxy.event,
        domEvent: event,
        item: eventProxy.item,
        mouseMoveInRange: {
          x: eventProxy.mouseMoveInRange.x,
          y: eventProxy.mouseMoveInRange.y,
          distance: sqrt(pow(eventProxy.mouseMoveInRange.x[1] - eventProxy.mouseMoveInRange.x[0], 2) + pow(eventProxy.mouseMoveInRange.y[1] - eventProxy.mouseMoveInRange.y[0], 2))
        },
        mouseMoveInDomain: {
          x: invert('xScale', eventProxy.mouseMoveInRange.x),
          y: invert('yScale', eventProxy.mouseMoveInRange.y)
        },
        polygonInRange: eventProxy.polygonInRange,
        polygonInDomain: eventProxy.polygonInDomain,
      }`
    },
    {
      events:
        "[view:mousedown[event.button === 0 && !event.crtlKey && !event.metaKey], window:mouseup] > window:mousemove!",
      update: `{
        event: eventProxy.event,
        domEvent: event,
        item: eventProxy.item,
        mouseMoveInRange: {
          x: eventProxy.mouseMoveInRange.x,
          deltaX: eventProxy.mouseMoveInRange.x[1] - eventProxy.mouseMoveInRange.x[0],
          y: eventProxy.mouseMoveInRange.y,
          deltaY: eventProxy.mouseMoveInRange.y[1] - eventProxy.mouseMoveInRange.y[0],
          distance: eventProxy.mouseMoveInRange.distance
        },
        mouseMoveInDomain: eventProxy.mouseMoveInDomain,
        polygonInRange: eventProxy.polygonInRange,
        polygonInDomain: eventProxy.polygonInDomain,
      }`
    },
    {
      events:
        "[view:mousedown[event.button === 0 && !event.crtlKey && !event.metaKey], window:mouseup] > window:mousemove!",
      update: `{
        event:
          (abs(eventProxy.mouseMoveInRange.deltaX) >= ${config.minMoveInPixels} || abs(eventProxy.mouseMoveInRange.deltaY) >= 10)
          ? (eventProxy.event === 'startdrawingshape' || eventProxy.event === 'drawingshape' ? 'drawingshape' : 'startdrawingshape')
          : eventProxy.event,
        domEvent: event,
        item: eventProxy.item,
        mouseMoveInRange: eventProxy.mouseMoveInRange,
        mouseMoveInDomain: eventProxy.mouseMoveInDomain,
        polygonInRange: eventProxy.polygonInRange,
        polygonInDomain: eventProxy.polygonInDomain
      }`
    },
    {
      events:
        "[view:mousedown[event.button === 0 && !event.crtlKey && !event.metaKey], window:mouseup] > window:mousemove!",
      update: `{
        event: event.buttons === 0 ? ((eventProxy.event !== 'startdrawingshape' && eventProxy.event !== 'drawingshape') ? 'click': 'stopdrawingshape') : eventProxy.event,
        domEvent: event,
        item: eventProxy.item,
        mouseMoveInRange: eventProxy.mouseMoveInRange,
        mouseMoveInDomain: eventProxy.mouseMoveInDomain,
        polygonInRange: eventProxy.polygonInRange,
        polygonInDomain: eventProxy.polygonInDomain
      }`
    },
    // Mouseup
    {
      events:
        "view:mouseup[event.button === 0 && !event.crtlKey && !event.metaKey]",
      update: `
        {
          event: (eventProxy.event !== 'startdrawingshape' && eventProxy.event !== 'drawingshape') ? 'click': 'stopdrawingshape',
          domEvent: event,
          item: eventProxy.item,
          mouseMoveInRange: eventProxy.mouseMoveInRange,
          mouseMoveInDomain: eventProxy.mouseMoveInDomain,
          polygonInRange: eventProxy.polygonInRange,
          polygonInDomain: eventProxy.polygonInDomain
        }`
    },
    {
      events:
        "window:mouseup[event.button === 0 && !event.crtlKey && !event.metaKey]",
      update: `
        {
          event: (eventProxy.event !== 'click' && eventProxy.event !== 'stopdrawingshape' ||
            eventProxy.domEvent.clientX !== event.clientX || eventProxy.domEvent.clientY !== event.clientY) ? 'clickOut': eventProxy.event,
          domEvent: event,
          item: eventProxy.item,
          mouseMoveInRange: eventProxy.mouseMoveInRange,
          mouseMoveInDomain: eventProxy.mouseMoveInDomain,
          polygonInRange: eventProxy.polygonInRange,
          polygonInDomain: eventProxy.polygonInDomain
        }`
    }

    /* {
      "events": "window:mouseout",
      "update": "{ event: null, domEvent: event, item: event.item, mouseMoveInRange: { x: [x(), x()], y: [y(), y()] } }"
    } */
  ]
});

const vegaSpec = (width, height, chartStruct) => {
  const typography = {
    IR11: {
      fontFamily: "Arial",
      fontWeight: 500,
      fontSize: 11,
      letterSpacing: 0,
      lineHeight: "13px"
    },
    IB13: {
      fontFamily: "Arial",
      fontWeight: 500,
      fontSize: 11,
      letterSpacing: 0,
      lineHeight: "13px"
    }
  };
  // const palette = { base: { 200: "#DFE6ED", 900: "#374B5F" } };
  // const columnsData = chartStruct.columnsData;
  // const colorField = chartStruct.columnsData.color
  //   ? chartStruct.columnsData.color.name
  //   : "PivotedAnasencolumns";
  // const colorFieldCategoriesCount = chartStruct.columnsData.color
  //   ? chartStruct.columnsData.Bycolumns.find((col) => {
  //       return col.name === colorField;
  //     }).count
  //   : chartStruct.columnsData.Qcolumn.length;

  function _buildColorsScales(chartStruct) {
    const color = chartStruct?.columnsData?.color;

    switch (color?.type) {
      case "CATEGORICAL": {
        return [
          {
            name: "colorFull",
            type: "ordinal",
            domain: { data: "tree", field: "color" },
            range: categoriesPalette10
          },
          {
            name: "colorLight",
            type: "ordinal",
            domain: { data: "tree", field: "color" },
            range: categoriesPalette10Pastel
          }
        ];
      }

      case "QUANTITATIVE": {
        return [
          {
            name: "colorFull",
            type: "linear",
            interpolate: "hcl",
            zero: false,
            domain: [
              { signal: "colorExtent[0]" },
              { signal: "(colorExtent[0]+colorExtent[1])/2" },
              { signal: "colorExtent[1]" }
            ],
            range: { signal: "chooseGradient" }
          },
          {
            name: "colorLight",
            type: "linear",
            interpolate: "hcl",
            zero: false,
            domain: [
              { signal: "colorExtent[0]" },
              { signal: "(colorExtent[0]+colorExtent[1])/2" },
              { signal: "colorExtent[1]" }
            ],
            range: { signal: "chooseGradientPastel" }
          }
        ];
      }

      default:
        return [];
    }
  }

  const data = [
    {
      name: "chartStruct",
      values: [chartStruct]
    },
    {
      name: "userData",
      values: [
        {
          columnsData: {
            x: { rangeZoom: [0, 1] },
            y: { rangeZoom: [0, 1] }
          }
        }
      ]
    },
    {
      name: "tree",
      values: [
        { l: -1, name: "root", column: "root" },
        {
          l: 0,
          name: "Female",
          column: "gender",
          parent: -1
        },
        {
          l: 1,
          name: "americanexpress",
          column: "creditCard",
          parent: 0
        },
        {
          l: 2,
          name: "2XL",
          column: "size",
          parent: 1,
          size: 6790.64,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 3,
          name: "3XL",
          column: "size",
          parent: 1,
          size: 30662.21,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 4,
          name: "L",
          column: "size",
          parent: 1,
          size: 19129.06,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 5,
          name: "M",
          column: "size",
          parent: 1,
          size: 30734.96,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 6,
          name: "S",
          column: "size",
          parent: 1,
          size: 5550.07,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 7,
          name: "XL",
          column: "size",
          parent: 1,
          size: 32124.09,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 8,
          name: "XS",
          column: "size",
          parent: 1,
          size: 15648.91,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 9,
          name: "bankcard",
          column: "creditCard",
          parent: 0
        },
        {
          l: 10,
          name: "2XL",
          column: "size",
          parent: 9,
          size: 29214.48,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 11,
          name: "3XL",
          column: "size",
          parent: 9,
          size: 1541.56,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 12,
          name: "L",
          column: "size",
          parent: 9,
          size: 7824.44,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 13,
          name: "M",
          column: "size",
          parent: 9,
          size: 14707.15,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 14,
          name: "S",
          column: "size",
          parent: 9,
          size: 20919.16,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 15,
          name: "XL",
          column: "size",
          parent: 9,
          size: 13494.35,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 16,
          name: "XS",
          column: "size",
          parent: 9,
          size: 18290.73,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 17,
          name: "china-unionpay",
          column: "creditCard",
          parent: 0
        },
        {
          l: 18,
          name: "2XL",
          column: "size",
          parent: 17,
          size: 552.67,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 19,
          name: "3XL",
          column: "size",
          parent: 17,
          size: 4572.67,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 20,
          name: "L",
          column: "size",
          parent: 17,
          size: 5048.32,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 21,
          name: "M",
          column: "size",
          parent: 17,
          size: 7005.62,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 22,
          name: "S",
          column: "size",
          parent: 17,
          size: 41032.05,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 23,
          name: "XL",
          column: "size",
          parent: 17,
          size: 16023.44,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 24,
          name: "XS",
          column: "size",
          parent: 17,
          size: 10004.36,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 25,
          name: "diners-club-carte-blanche",
          column: "creditCard",
          parent: 0
        },
        {
          l: 26,
          name: "2XL",
          column: "size",
          parent: 25,
          size: 2718.21,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 27,
          name: "3XL",
          column: "size",
          parent: 25,
          size: 14076.33,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 28,
          name: "L",
          column: "size",
          parent: 25,
          size: 23001.8,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 29,
          name: "M",
          column: "size",
          parent: 25,
          size: 3268.05,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 30,
          name: "S",
          column: "size",
          parent: 25,
          size: 20017.79,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 31,
          name: "XL",
          column: "size",
          parent: 25,
          size: 22992.78,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 32,
          name: "XS",
          column: "size",
          parent: 25,
          size: 14809.5,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 33,
          name: "diners-club-enroute",
          column: "creditCard",
          parent: 0
        },
        {
          l: 34,
          name: "2XL",
          column: "size",
          parent: 33,
          size: 11032.44,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 35,
          name: "3XL",
          column: "size",
          parent: 33,
          size: 12660.56,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 36,
          name: "L",
          column: "size",
          parent: 33,
          size: 22196.38,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 37,
          name: "M",
          column: "size",
          parent: 33,
          size: 20300.41,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 38,
          name: "S",
          column: "size",
          parent: 33,
          size: 29355.2,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 39,
          name: "XL",
          column: "size",
          parent: 33,
          size: 10355.26,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 40,
          name: "XS",
          column: "size",
          parent: 33,
          size: 7856.39,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 41,
          name: "diners-club-international",
          column: "creditCard",
          parent: 0
        },
        {
          l: 42,
          name: "3XL",
          column: "size",
          parent: 41,
          size: 239.16,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 43,
          name: "XS",
          column: "size",
          parent: 41,
          size: 506.07,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 44,
          name: "diners-club-us-ca",
          column: "creditCard",
          parent: 0
        },
        {
          l: 45,
          name: "2XL",
          column: "size",
          parent: 44,
          size: 15756.38,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 46,
          name: "3XL",
          column: "size",
          parent: 44,
          size: 5395.28,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 47,
          name: "L",
          column: "size",
          parent: 44,
          size: 5060.7,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 48,
          name: "M",
          column: "size",
          parent: 44,
          size: 3359.77,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 49,
          name: "XL",
          column: "size",
          parent: 44,
          size: 10954.41,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 50,
          name: "instapayment",
          column: "creditCard",
          parent: 0
        },
        {
          l: 51,
          name: "3XL",
          column: "size",
          parent: 50,
          size: 2644.78,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 52,
          name: "L",
          column: "size",
          parent: 50,
          size: 5950.09,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 53,
          name: "M",
          column: "size",
          parent: 50,
          size: 10552.76,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 54,
          name: "S",
          column: "size",
          parent: 50,
          size: 15606.61,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 55,
          name: "XS",
          column: "size",
          parent: 50,
          size: 8130.03,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 56,
          name: "jcb",
          column: "creditCard",
          parent: 0
        },
        {
          l: 57,
          name: "2XL",
          column: "size",
          parent: 56,
          size: 147694.72,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 58,
          name: "3XL",
          column: "size",
          parent: 56,
          size: 150221.83,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 59,
          name: "L",
          column: "size",
          parent: 56,
          size: 163852.81,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 60,
          name: "M",
          column: "size",
          parent: 56,
          size: 175512.36,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 61,
          name: "S",
          column: "size",
          parent: 56,
          size: 181972.5,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 62,
          name: "XL",
          column: "size",
          parent: 56,
          size: 175061.13,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 63,
          name: "XS",
          column: "size",
          parent: 56,
          size: 142828.94,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 64,
          name: "laser",
          column: "creditCard",
          parent: 0
        },
        {
          l: 65,
          name: "2XL",
          column: "size",
          parent: 64,
          size: 7875.58,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 66,
          name: "3XL",
          column: "size",
          parent: 64,
          size: 34300.37,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 67,
          name: "L",
          column: "size",
          parent: 64,
          size: 11665.13,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 68,
          name: "M",
          column: "size",
          parent: 64,
          size: 9133.28,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 69,
          name: "S",
          column: "size",
          parent: 64,
          size: 14479.3,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 70,
          name: "XL",
          column: "size",
          parent: 64,
          size: 9596.39,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 71,
          name: "maestro",
          column: "creditCard",
          parent: 0
        },
        {
          l: 72,
          name: "2XL",
          column: "size",
          parent: 71,
          size: 22784.73,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 73,
          name: "3XL",
          column: "size",
          parent: 71,
          size: 67099.35,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 74,
          name: "L",
          column: "size",
          parent: 71,
          size: 25301.49,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 75,
          name: "M",
          column: "size",
          parent: 71,
          size: 21139.19,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 76,
          name: "S",
          column: "size",
          parent: 71,
          size: 27682.65,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 77,
          name: "XL",
          column: "size",
          parent: 71,
          size: 25388.22,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 78,
          name: "XS",
          column: "size",
          parent: 71,
          size: 37621.43,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 79,
          name: "mastercard",
          column: "creditCard",
          parent: 0
        },
        {
          l: 80,
          name: "2XL",
          column: "size",
          parent: 79,
          size: 22360.66,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 81,
          name: "3XL",
          column: "size",
          parent: 79,
          size: 80845.19,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 82,
          name: "L",
          column: "size",
          parent: 79,
          size: 33441.69,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 83,
          name: "M",
          column: "size",
          parent: 79,
          size: 20635.14,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 84,
          name: "S",
          column: "size",
          parent: 79,
          size: 46727.65,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 85,
          name: "XL",
          column: "size",
          parent: 79,
          size: 35691.0,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 86,
          name: "XS",
          column: "size",
          parent: 79,
          size: 37276.28,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 87,
          name: "solo",
          column: "creditCard",
          parent: 0
        },
        {
          l: 88,
          name: "3XL",
          column: "size",
          parent: 87,
          size: 3126.75,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 89,
          name: "M",
          column: "size",
          parent: 87,
          size: 5430.09,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 90,
          name: "S",
          column: "size",
          parent: 87,
          size: 2931.39,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 91,
          name: "XL",
          column: "size",
          parent: 87,
          size: 2892.24,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 92,
          name: "XS",
          column: "size",
          parent: 87,
          size: 2715.96,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 93,
          name: "switch",
          column: "creditCard",
          parent: 0
        },
        {
          l: 94,
          name: "2XL",
          column: "size",
          parent: 93,
          size: 11468.83,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 95,
          name: "3XL",
          column: "size",
          parent: 93,
          size: 28892.29,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 96,
          name: "L",
          column: "size",
          parent: 93,
          size: 8991.34,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 97,
          name: "M",
          column: "size",
          parent: 93,
          size: 15879.79,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 98,
          name: "S",
          column: "size",
          parent: 93,
          size: 4140.88,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 99,
          name: "XL",
          column: "size",
          parent: 93,
          size: 17679.07,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 100,
          name: "XS",
          column: "size",
          parent: 93,
          size: 28249.09,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 101,
          name: "visa",
          column: "creditCard",
          parent: 0
        },
        {
          l: 102,
          name: "2XL",
          column: "size",
          parent: 101,
          size: 9487.34,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 103,
          name: "3XL",
          column: "size",
          parent: 101,
          size: 6558.06,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 104,
          name: "L",
          column: "size",
          parent: 101,
          size: 6036.0,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 105,
          name: "M",
          column: "size",
          parent: 101,
          size: 1072.97,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 106,
          name: "S",
          column: "size",
          parent: 101,
          size: 16700.34,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 107,
          name: "XL",
          column: "size",
          parent: 101,
          size: 18243.83,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 108,
          name: "XS",
          column: "size",
          parent: 101,
          size: 16904.7,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 109,
          name: "visa-electron",
          column: "creditCard",
          parent: 0
        },
        {
          l: 110,
          name: "2XL",
          column: "size",
          parent: 109,
          size: 1873.21,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 111,
          name: "3XL",
          column: "size",
          parent: 109,
          size: 22424.91,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 112,
          name: "L",
          column: "size",
          parent: 109,
          size: 10321.06,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 113,
          name: "M",
          column: "size",
          parent: 109,
          size: 36313.38,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 114,
          name: "S",
          column: "size",
          parent: 109,
          size: 21519.07,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 115,
          name: "XL",
          column: "size",
          parent: 109,
          size: 4646.37,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 116,
          name: "XS",
          column: "size",
          parent: 109,
          size: 6791.68,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 117,
          name: "Male",
          column: "gender",
          parent: -1
        },
        {
          l: 118,
          name: "americanexpress",
          column: "creditCard",
          parent: 117
        },
        {
          l: 119,
          name: "2XL",
          column: "size",
          parent: 118,
          size: 16867.72,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 120,
          name: "3XL",
          column: "size",
          parent: 118,
          size: 12831.39,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 121,
          name: "L",
          column: "size",
          parent: 118,
          size: 23825.03,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 122,
          name: "M",
          column: "size",
          parent: 118,
          size: 14093.12,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 123,
          name: "S",
          column: "size",
          parent: 118,
          size: 8691.84,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 124,
          name: "XL",
          column: "size",
          parent: 118,
          size: 27303.88,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 125,
          name: "XS",
          column: "size",
          parent: 118,
          size: 18274.19,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 126,
          name: "bankcard",
          column: "creditCard",
          parent: 117
        },
        {
          l: 127,
          name: "2XL",
          column: "size",
          parent: 126,
          size: 22031.73,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 128,
          name: "3XL",
          column: "size",
          parent: 126,
          size: 7814.08,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 129,
          name: "L",
          column: "size",
          parent: 126,
          size: 11214.32,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 130,
          name: "M",
          column: "size",
          parent: 126,
          size: 7057.71,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 131,
          name: "S",
          column: "size",
          parent: 126,
          size: 15179.0,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 132,
          name: "XL",
          column: "size",
          parent: 126,
          size: 34025.61,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 133,
          name: "XS",
          column: "size",
          parent: 126,
          size: 15704.08,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 134,
          name: "china-unionpay",
          column: "creditCard",
          parent: 117
        },
        {
          l: 135,
          name: "2XL",
          column: "size",
          parent: 134,
          size: 16056.41,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 136,
          name: "3XL",
          column: "size",
          parent: 134,
          size: 5656.89,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 137,
          name: "M",
          column: "size",
          parent: 134,
          size: 19445.35,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 138,
          name: "S",
          column: "size",
          parent: 134,
          size: 16.54,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 139,
          name: "XL",
          column: "size",
          parent: 134,
          size: 12984.91,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 140,
          name: "XS",
          column: "size",
          parent: 134,
          size: 21613.85,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 141,
          name: "diners-club-carte-blanche",
          column: "creditCard",
          parent: 117
        },
        {
          l: 142,
          name: "2XL",
          column: "size",
          parent: 141,
          size: 17505.8,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 143,
          name: "3XL",
          column: "size",
          parent: 141,
          size: 16755.52,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 144,
          name: "L",
          column: "size",
          parent: 141,
          size: 23658.51,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 145,
          name: "S",
          column: "size",
          parent: 141,
          size: 9865.14,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 146,
          name: "XL",
          column: "size",
          parent: 141,
          size: 10169.92,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 147,
          name: "XS",
          column: "size",
          parent: 141,
          size: 31504.43,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 148,
          name: "diners-club-enroute",
          column: "creditCard",
          parent: 117
        },
        {
          l: 149,
          name: "2XL",
          column: "size",
          parent: 148,
          size: 28451.59,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 150,
          name: "3XL",
          column: "size",
          parent: 148,
          size: 7108.87,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 151,
          name: "L",
          column: "size",
          parent: 148,
          size: 20039.57,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 152,
          name: "M",
          column: "size",
          parent: 148,
          size: 27513.04,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 153,
          name: "S",
          column: "size",
          parent: 148,
          size: 21696.4,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 154,
          name: "XL",
          column: "size",
          parent: 148,
          size: 6934.36,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 155,
          name: "XS",
          column: "size",
          parent: 148,
          size: 18285.81,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 156,
          name: "diners-club-international",
          column: "creditCard",
          parent: 117
        },
        {
          l: 157,
          name: "M",
          column: "size",
          parent: 156,
          size: 8950.39,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 158,
          name: "XL",
          column: "size",
          parent: 156,
          size: 1162.22,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 159,
          name: "XS",
          column: "size",
          parent: 156,
          size: 1484.67,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 160,
          name: "diners-club-us-ca",
          column: "creditCard",
          parent: 117
        },
        {
          l: 161,
          name: "2XL",
          column: "size",
          parent: 160,
          size: 11706.0,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 162,
          name: "L",
          column: "size",
          parent: 160,
          size: 8026.97,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 163,
          name: "XL",
          column: "size",
          parent: 160,
          size: 7840.37,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 164,
          name: "instapayment",
          column: "creditCard",
          parent: 117
        },
        {
          l: 165,
          name: "M",
          column: "size",
          parent: 164,
          size: 3498.26,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 166,
          name: "S",
          column: "size",
          parent: 164,
          size: 5140.28,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 167,
          name: "XL",
          column: "size",
          parent: 164,
          size: 12759.52,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 168,
          name: "jcb",
          column: "creditCard",
          parent: 117
        },
        {
          l: 169,
          name: "2XL",
          column: "size",
          parent: 168,
          size: 140379.08,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 170,
          name: "3XL",
          column: "size",
          parent: 168,
          size: 118454.55,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 171,
          name: "L",
          column: "size",
          parent: 168,
          size: 144926.14,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 172,
          name: "M",
          column: "size",
          parent: 168,
          size: 92935.86,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 173,
          name: "S",
          column: "size",
          parent: 168,
          size: 157162.67,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 174,
          name: "XL",
          column: "size",
          parent: 168,
          size: 161072.8,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 175,
          name: "XS",
          column: "size",
          parent: 168,
          size: 136183.26,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 176,
          name: "laser",
          column: "creditCard",
          parent: 117
        },
        {
          l: 177,
          name: "2XL",
          column: "size",
          parent: 176,
          size: 24653.56,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 178,
          name: "3XL",
          column: "size",
          parent: 176,
          size: 8070.5,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 179,
          name: "L",
          column: "size",
          parent: 176,
          size: 9524.6,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 180,
          name: "M",
          column: "size",
          parent: 176,
          size: 10724.74,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 181,
          name: "S",
          column: "size",
          parent: 176,
          size: 7485.48,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 182,
          name: "XL",
          column: "size",
          parent: 176,
          size: 16319.58,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 183,
          name: "XS",
          column: "size",
          parent: 176,
          size: 9082.2,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 184,
          name: "maestro",
          column: "creditCard",
          parent: 117
        },
        {
          l: 185,
          name: "2XL",
          column: "size",
          parent: 184,
          size: 29834.44,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 186,
          name: "3XL",
          column: "size",
          parent: 184,
          size: 24537.96,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 187,
          name: "L",
          column: "size",
          parent: 184,
          size: 4037.32,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 188,
          name: "M",
          column: "size",
          parent: 184,
          size: 13035.39,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 189,
          name: "S",
          column: "size",
          parent: 184,
          size: 18393.31,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 190,
          name: "XL",
          column: "size",
          parent: 184,
          size: 29583.97,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 191,
          name: "XS",
          column: "size",
          parent: 184,
          size: 17993.61,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 192,
          name: "mastercard",
          column: "creditCard",
          parent: 117
        },
        {
          l: 193,
          name: "2XL",
          column: "size",
          parent: 192,
          size: 21996.12,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 194,
          name: "3XL",
          column: "size",
          parent: 192,
          size: 19921.18,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 195,
          name: "L",
          column: "size",
          parent: 192,
          size: 44399.71,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 196,
          name: "M",
          column: "size",
          parent: 192,
          size: 30673.16,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 197,
          name: "S",
          column: "size",
          parent: 192,
          size: 46248.24,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 198,
          name: "XL",
          column: "size",
          parent: 192,
          size: 16697.03,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 199,
          name: "XS",
          column: "size",
          parent: 192,
          size: 35328.95,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 200,
          name: "solo",
          column: "creditCard",
          parent: 117
        },
        {
          l: 201,
          name: "2XL",
          column: "size",
          parent: 200,
          size: 1039.23,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 202,
          name: "L",
          column: "size",
          parent: 200,
          size: 6546.3,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 203,
          name: "S",
          column: "size",
          parent: 200,
          size: 3836.97,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 204,
          name: "XL",
          column: "size",
          parent: 200,
          size: 13449.03,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 205,
          name: "XS",
          column: "size",
          parent: 200,
          size: 15437.74,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 206,
          name: "switch",
          column: "creditCard",
          parent: 117
        },
        {
          l: 207,
          name: "2XL",
          column: "size",
          parent: 206,
          size: 17421.37,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 208,
          name: "3XL",
          column: "size",
          parent: 206,
          size: 7873.02,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 209,
          name: "L",
          column: "size",
          parent: 206,
          size: 9631.05,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 210,
          name: "M",
          column: "size",
          parent: 206,
          size: 24539.56,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 211,
          name: "S",
          column: "size",
          parent: 206,
          size: 27447.35,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 212,
          name: "XL",
          column: "size",
          parent: 206,
          size: 5637.78,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 213,
          name: "XS",
          column: "size",
          parent: 206,
          size: 30945.07,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 214,
          name: "visa",
          column: "creditCard",
          parent: 117
        },
        {
          l: 215,
          name: "2XL",
          column: "size",
          parent: 214,
          size: 28323.05,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 216,
          name: "L",
          column: "size",
          parent: 214,
          size: 25428.72,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 217,
          name: "M",
          column: "size",
          parent: 214,
          size: 16066.37,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 218,
          name: "S",
          column: "size",
          parent: 214,
          size: 13959.64,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 219,
          name: "XL",
          column: "size",
          parent: 214,
          size: 3184.65,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 220,
          name: "XS",
          column: "size",
          parent: 214,
          size: 8700.75,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 221,
          name: "visa-electron",
          column: "creditCard",
          parent: 117
        },
        {
          l: 222,
          name: "2XL",
          column: "size",
          parent: 221,
          size: 9225.23,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 223,
          name: "3XL",
          column: "size",
          parent: 221,
          size: 10826.45,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 224,
          name: "L",
          column: "size",
          parent: 221,
          size: 10268.06,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 225,
          name: "M",
          column: "size",
          parent: 221,
          size: 7078.94,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 226,
          name: "S",
          column: "size",
          parent: 221,
          size: 6523.46,
          sizeSelected: null,
          s: 0.0
        },
        {
          l: 227,
          name: "XL",
          column: "size",
          parent: 221,
          size: 16141.34,
          sizeSelected: null,
          s: 0.0
        }
      ],
      transform: [
        { type: "filter", expr: "(!isDefined(datum.size) || datum.size >= 0)" },
        {
          type: "formula",
          as: "sizeSelected",
          expr: "max(0,datum.sizeSelected)"
        },
        {
          type: "formula",
          as: "superSize",
          expr:
            "if(datum.s>0,max(datum.size,max(0,datum.sizeSelected)),datum.size)"
        },
        { type: "stratify", key: "l", parentKey: "parent" },
        {
          type: "treemap",
          field: "superSize",
          sort: { field: "superSize" },
          round: true,
          method: { signal: "layout" },
          ratio: { signal: "aspectRatio" },
          size: [{ signal: "width" }, { signal: "height" }],
          paddingInner: 0,
          paddingTop: 30
        }
      ]
    },
    {
      name: "treeNaN",
      source: "tree",
      transform: [{ type: "collect", sort: { field: "superSize" } }]
    },
    {
      name: "nodes",
      source: "tree",
      transform: [{ type: "filter", expr: "datum.children" }]
    },
    {
      name: "leaves",
      source: "tree",
      transform: [
        { type: "filter", expr: "!datum.children" },
        ...(chartStruct.columnsData.color
          ? [
              {
                type: "extent",
                field: "color",
                signal: "colorExtent"
              }
            ]
          : [])
      ]
    },
    {
      name: "leaveSelected",
      source: "leaves",
      transform: [
        { type: "filter", expr: "datum.s > 0" },
        {
          type: "formula",
          as: "y0Selected",
          expr: `if(datum.sizeSelected > datum.size, 
                datum.y0, 
                round(datum.y1-datum.sizeSelected/datum.size*(datum.y1-datum.y0)))`
        }
      ]
    }
  ];
  const signals = [
    //{ name: "testum", update: "warn('treeNaN', data('treeNaN') )" },
    // {
    //   name: "testum2",
    //   update: "warn('levesSelected', data('leaveSelected') )"
    // },
    getEventProxySignal(),
    {
      name: "NoSelection",
      update: "if(length(data('leaveSelected'))>0 ,false,true)"
    },
    ...(chartStruct.columnsData.color
      ? [
          {
            name: "containsZero",
            update: "colorExtent[0] && colorExtent[0]*colorExtent[1]<0"
          },
          {
            name: "chooseGradient",
            update: `containsZero
  ? ['${divergentGradientBlueRed[0]}', '${divergentGradientBlueRed[1]}', '${divergentGradientBlueRed[2]}'] 
  : ['${linearGradientBlue[0]}', '${linearGradientBlue[1]}']`
          },
          {
            name: "chooseGradientPastel",
            update: `containsZero 
    ? ['${divergentGradientBlueRedPastel[0]}', '${divergentGradientBlueRedPastel[1]}', '${divergentGradientBlueRedPastel[2]}'] 
    : ['${linearGradientBluePastel[0]}', '${linearGradientBluePastel[1]}']`
          }
        ]
      : []),
    {
      name: "layout",
      value: "squarify",
      bind: {
        input: "select",
        options: [
          "squarify",
          "resquarify",
          "binary",
          "dice",
          "slice",
          "slicedice"
        ]
      }
    },
    {
      name: "aspectRatio",
      value: 1.6,
      bind: { input: "range", min: 1, max: 5, step: 0.1 }
    },
    {
      name: "selectionIsOn",
      update: "{ selectionIsOn: length(data('selectedbars')) > 0 }"
    },
    {
      name: "resetSelectionOnClick",
      value: false,
      on: [
        {
          events: "@plottingArea:click",
          filter: ["!@leaveStroke:click"],
          update: `{ selectionIsOn: selectionIsOn,       
                chartStructure: data('chartStruct')[0],           
                value: eventProxy.event === 'click' && !eventProxy.domEvent.ctrlKey && !eventProxy.domEvent.metaKey && (!eventProxy.item || !isNumber(eventProxy.item.datum.numeric0))
                }`
        }
      ]
    },
    {
      name: "OnClickDataMark",
      on: [
        {
          events: "@hoverRect:click",
          update: `
              eventProxy.event === 'click'
              ? { chartStructure: data('chartStruct')[0], 
                  value: datum,
                  ctrlKey: event.ctrlKey,
                  metaKey: event.metaKey,
                  altKey: event.altKey }         
              : OnClickDataMark`
        }
      ]
    },
    {
      name: "isOnView",
      on: [
        {
          events: "view:mousemove",
          update: `  
            xy()[0] > 0 && xy()[0] < width && xy()[1] > 0 && xy()[1] < height
          `
        }
      ]
    },
    {
      name: "xcur",
      value: null,
      on: [
        {
          events: "mousedown, touchstart, touchend, wheel",
          update: "slice(xRange)"
        }
      ]
    },
    {
      name: "ycur",
      value: null,
      on: [
        {
          events: "mousedown, touchstart, touchend, wheel",
          update: "slice(yRange)"
        }
      ]
    },
    {
      name: "down",
      value: null,
      on: [
        { events: "touchend", update: "null" },
        {
          events: "mousedown, touchstart",
          update: "xy()"
        }
      ]
    },
    {
      name: "deltaX",
      init: "[0, 0]",
      on: [
        {
          events: [
            {
              source: "window",
              type: "mousemove",
              filter: [
                "event.altKey",
                "!event.ctrlKey && !event.metaKey",
                "event.button === 0"
              ],
              consume: true,
              between: [
                {
                  type: "mousedown",
                  filter: [
                    "event.altKey",
                    "!event.ctrlKey && !event.metaKey",
                    "event.button === 0"
                  ]
                },
                { source: "window", type: "mouseup" }
              ]
            },
            {
              type: "touchmove",
              consume: true,
              filter: "event.touches.length === 1"
            }
          ],
          update: "down ? [-down[0]+x(), -down[0]+x()]: [0,0]"
        },
        {
          events:
            "[@GroupAxisX:mousedown[event.item && event.item.cursor && event.item.cursor==='ew-resize'], window:mouseup] > view:mousemove!",
          update: "down ? [down[0]-x(), down[0]-x()] : [0,0]"
        },
        {
          events:
            "[@GroupAxisX:mousedown[event.item && event.item.cursor && event.item.cursor==='w-resize'], window:mouseup] > view:mousemove!",
          update: "down ? [down[0]-x(), 0] : [0,0]"
        },
        {
          events:
            "[@GroupAxisX:mousedown[event.item && event.item.cursor && event.item.cursor==='e-resize'], window:mouseup] > view:mousemove!",
          update: "down ? [0,down[0]-x()] : [0,0]"
        },
        {
          events:
            "[@GroupAxisY:mousedown[event.item && event.item.cursor && event.item.cursor==='ns-resize'], window:mouseup] > view:mousemove!",
          update: "[0,0]"
        },
        {
          events:
            "[@GroupAxisY:mousedown[event.item && event.item.cursor && event.item.cursor==='n-resize'], window:mouseup] > view:mousemove!",
          update: "[0,0]"
        },
        {
          events:
            "[@GroupAxisY:mousedown[event.item && event.item.cursor && event.item.cursor==='s-resize'], window:mouseup] > view:mousemove!",
          update: "[0,0]"
        }
      ]
    },
    {
      name: "deltaY",
      init: "[0, 0]",
      on: [
        {
          events: [
            {
              source: "window",
              type: "mousemove",
              filter: [
                "event.altKey",
                "!event.ctrlKey && !event.metaKey",
                "event.button === 0"
              ],
              consume: true,
              between: [
                { type: "mousedown" },
                { source: "window", type: "mouseup" }
              ]
            },
            {
              type: "touchmove",
              consume: true,
              filter: "event.touches.length === 1"
            }
          ],
          update: "down ? [y()-down[1], y()-down[1]] : [0,0]"
        },
        {
          events:
            "[@GroupAxisX:mousedown[event.item && event.item.cursor && event.item.cursor==='ew-resize'], window:mouseup] > view:mousemove!",
          update: "[0,0]"
        },
        {
          events:
            "[@GroupAxisX:mousedown[event.item && event.item.cursor && event.item.cursor==='w-resize'], window:mouseup] > view:mousemove!",
          update: "[0,0]"
        },
        {
          events:
            "[@GroupAxisX:mousedown[event.item && event.item.cursor && event.item.cursor==='e-resize'], window:mouseup] > view:mousemove!",
          update: "[0,0]"
        },
        {
          events:
            "[@GroupAxisY:mousedown[event.item && event.item.cursor && event.item.cursor==='ns-resize'], window:mouseup] > view:mousemove!",
          update: "down ? [y()-down[1], y()-down[1]] : [0,0]"
        },
        {
          events:
            "[@GroupAxisY:mousedown[event.item && event.item.cursor && event.item.cursor==='n-resize'], window:mouseup] > view:mousemove!",
          update: "down ? [0,y()-down[1]] : [0,0]"
        },
        {
          events:
            "[@GroupAxisY:mousedown[event.item && event.item.cursor && event.item.cursor==='s-resize'], window:mouseup] > view:mousemove!",
          update: "down ? [y()-down[1],0] : [0,0]"
        }
      ]
    },
    {
      name: "anchor",
      value: [0, 0],
      on: [
        {
          events: "wheel",
          update: "[invert('xScale', x()), invert('yScale', y())]"
        }
        // {
        //   events: {
        //     type: 'touchstart',
        //     filter: 'event.touches.length===2',
        //   },
        //   update: '[(xdom[0] + xdom[1]) / 2, (ydom[0] + ydom[1]) / 2]',
        // }
      ]
    },
    {
      name: "zoomX",
      init: "[1,1]",
      on: [
        {
          events: "view:wheel![!event.item ||!event.item.cursor]",
          update:
            "abs(event.deltaY) > abs(event.deltaX) ? [pow(1.001, -event.deltaY * pow(16, event.deltaMode)),pow(1.001, -event.deltaY * pow(16, event.deltaMode))]: [1,1]"
        },
        {
          events:
            "@GroupAxisX:wheel![event.item && event.item.cursor && event.item.cursor==='ew-resize']",
          update:
            "[pow(1.001, event.deltaY * pow(16, event.deltaMode)),pow(1.001, event.deltaY * pow(16, event.deltaMode))]"
        },
        {
          events:
            "@GroupAxisX:wheel![event.item && event.item.cursor && event.item.cursor==='w-resize']",
          update: "[pow(1.001, event.deltaY * pow(16, event.deltaMode)),1]"
        },
        {
          events:
            "@GroupAxisX:wheel![event.item && event.item.cursor && event.item.cursor==='e-resize']",
          update: "[1,pow(1.001, event.deltaY * pow(16, event.deltaMode))]"
        },
        {
          events:
            "@GroupAxisY:wheel![event.item && event.item.cursor && event.item.cursor==='ns-resize']",
          update: "[1,1]"
        },
        {
          events:
            "@GroupAxisY:wheel![event.item && event.item.cursor && event.item.cursor==='s-resize']",
          update: "[1,1]"
        },
        {
          events:
            "@GroupAxisY:wheel![event.item && event.item.cursor && event.item.cursor==='n-resize']",
          update: "[1,1]"
        }
      ]
    },

    // Yaxis
    {
      name: "zoomY",
      init: "[1,1]",
      on: [
        {
          events: "view:wheel![!event.item ||!event.item.cursor]",
          update:
            "abs(event.deltaY) > abs(event.deltaX) ? [pow(1.001, -event.deltaY * pow(16, event.deltaMode)),pow(1.001, -event.deltaY * pow(16, event.deltaMode))]: [1,1]"
        },
        {
          events:
            "@GroupAxisX:wheel![event.item && event.item.cursor && event.item.cursor==='ew-resize']",

          update: "[1,1]"
        },
        {
          events:
            "@GroupAxisX:wheel![event.item && event.item.cursor && event.item.cursor==='w-resize']",

          update: "[1,1]"
        },
        {
          events:
            "@GroupAxisX:wheel![event.item && event.item.cursor && event.item.cursor==='e-resize']",

          update: "[1,1]"
        },
        {
          events:
            "@GroupAxisY:wheel![event.item && event.item.cursor && event.item.cursor==='ns-resize']",
          update:
            "[pow(1.001, event.deltaY * pow(16, event.deltaMode)),pow(1.001, event.deltaY * pow(16, event.deltaMode))]"
        },
        {
          events:
            "@GroupAxisY:wheel![event.item && event.item.cursor && event.item.cursor==='s-resize']",
          update: "[pow(1.001, event.deltaY * pow(16, event.deltaMode)),1]"
        },
        {
          events:
            "@GroupAxisY:wheel![event.item && event.item.cursor && event.item.cursor==='n-resize']",
          update: "[1,pow(1.001, event.deltaY * pow(16, event.deltaMode))]"
        }
      ]
    },
    {
      name: "zoomObj",
      on: [
        {
          events: { signal: "[zoomX, zoomY]" },
          update: `
          {
            anchor: anchor,
            zoomX: zoomX,
            xRangeNormalized: xRangeNormalized,
            zoomY: zoomY,
            yRangeNormalized: yRangeNormalized,
            width: width,
            height: height
          }`
        }
      ]
    },
    {
      name: "panObj",
      on: [
        {
          events: { signal: "[deltaX, deltaY]" },
          update: `
          {
            xcur: xcur,
            ycur: ycur,
            xRangeNormalized: xRangeNormalized,
            yRangeNormalized: yRangeNormalized,
            deltaX: deltaX,
            deltaY: deltaY,
            width: width,
            height: height
          }`
        }
      ]
    },
    {
      name: "extractXZoom",
      update:
        "length(data('userData')) > 0  && data('userData')[0].columnsData.x.rangeZoom"
    },
    {
      name: "extractYZoom",
      update:
        "length(data('userData')) > 0 && data('userData')[0].columnsData.y.rangeZoom"
    },
    {
      name: "xRangeNormalized",
      update: "slice([0,1])",
      on: [
        {
          events: { signal: "extractXZoom" },
          update: "extractXZoom"
        }
      ]
    },
    {
      name: "xRange",
      update: "[xRangeNormalized[0]*width,xRangeNormalized[1]*width]"
    },
    {
      name: "yRangeNormalized",
      update: "slice([0,1])",
      on: [
        {
          events: { signal: "extractYZoom" },
          update: "extractYZoom"
        }
      ]
    },
    {
      name: "yRange",
      update: "[yRangeNormalized[0]*height,yRangeNormalized[1]*height]"
    },
    getRectBrush(),
    getRectBrushForSelection()
  ];
  const marks = [
    {
      type: "rect",
      name: "plottingArea",
      encode: {
        update: {
          x: { signal: "width-40" },
          width: { signal: "40" },
          y: { signal: "height-40" },
          height: { signal: "40" },
          fill: { value: "red" }
        }
      }
    },
    {
      type: "rect",
      name: "nodesRect",
      from: { data: "nodes" },
      interactive: false,
      encode: {
        update: {
          x: { scale: "xScale", field: "x0" },
          y: { scale: "yScale", field: "y0" },
          x2: { scale: "xScale", field: "x1" },
          y2: { scale: "yScale", field: "y1" },
          fill: { value: "lightgrey" },
          stroke: { value: "white" }
        }
      }
    },
    {
      type: "rect",
      name: "leavesRect",
      from: { data: "leaves" },
      interactive: false,
      encode: {
        update: {
          x: { scale: "xScale", field: "x0" },
          y: { scale: "yScale", field: "y0" },
          x2: { scale: "xScale", field: "x1" },
          y2: { scale: "yScale", field: "y1" },
          fill: [
            ...(chartStruct.columnsData.color
              ? [
                  {
                    test: "NoSelection",
                    scale: "colorFull",
                    field: "color"
                  },
                  { scale: "colorLight", field: "color" }
                ]
              : [{ value: "lightgrey" }])
          ],
          stroke: { value: null }
        }
      }
    },
    {
      type: "rect",
      name: "leaveSelectedRect",
      from: { data: "leaveSelected" },
      interactive: false,
      encode: {
        update: {
          x: { scale: "xScale", field: "x0" },
          y: { scale: "yScale", signal: "datum.y0Selected" },
          x2: { scale: "xScale", field: "x1" },
          y2: { scale: "yScale", field: "y1" },
          fill: [
            ...(chartStruct.columnsData.color
              ? [{ scale: "colorFull", field: "color" }]
              : [{ value: "grey" }])
          ],
          stroke: { value: null }
        }
      }
    },
    {
      type: "rect",
      name: "leaveStroke",
      from: { data: "leaves" },
      interactive: false,
      encode: {
        update: {
          x: { scale: "xScale", field: "x0" },
          y: { scale: "yScale", field: "y0" },
          x2: { scale: "xScale", field: "x1" },
          y2: { scale: "yScale", field: "y1" },
          fill: { value: null },
          stroke: { value: "white" },
          strokeWidth: { value: 2 }
        }
      }
    },
    {
      type: "rect",
      name: "hoverRect",
      from: { data: "tree" },
      interactive: true,
      encode: {
        update: {
          x: { scale: "xScale", field: "x0" },
          y: { scale: "yScale", field: "y0" },
          x2: { scale: "xScale", field: "x1" },
          y2: { scale: "yScale", field: "y1" },
          fill: { value: "transparent" },
          stroke: { value: "white" },
          strokeWidth: { value: 0 },
          zindex: { signal: "datum.depth" },
          tooltip: { signal: "datum" } //{ signal: buildTooltip(chartStruct) }
        },
        hover: { strokeWidth: { value: 5 }, stroke: { value: "red" } }
      }
    },
    {
      type: "text",
      from: { data: "tree" },
      interactive: false,
      encode: {
        update: {
          font: { value: "Helvetica Neue, Arial" },
          //align: { value: "left" },
          //baseline: { value: "bottom" },
          fill: [
            ...(chartStruct.columnsData.color
              ? [
                  {
                    signal: `if(contrast('white', scale('colorFull',datum.color) ) > contrast('black', scale('colorFull',datum.color)),
                         'white',
                         'black')`
                  }
                ]
              : [{ value: "black" }])
          ],
          text: [
            {
              test: "isDefined(datum.name)",
              signal: "datum.name"
            }
          ],
          fontSize: [
            {
              test: "scale('limitScale', abs(datum.x1-datum.x0)) > 5",
              signal:
                "min(floor(3*log(scale('fontScale', abs(datum.y1-datum.y0)))), 24)"
            },{
              value: null
            }
          ],
          limit: [
            {
              signal:
                "min(scale('limitScale', abs(datum.x1-datum.x0)), width)"
            },
          ],
          x: { scale: "xScale", signal: "datum.x0" },
          y: { scale: "yScale", signal: "datum.y0" },
          dy: {
            signal: "min(scale('fontScale', abs(datum.y1-datum.y0)*4/5), 20)"
          },
          dx: {
            signal: "min(scale('limitScale', abs(datum.x1-datum.x0)*4/5), 5)"
          }
        }
      }
    },
    {
      type: "rect",
      name: "rectBrush",
      encode: {
        enter: {},
        update: {
          stroke: [
            { test: "rectBrush.state === 'resizing'", value: "#ABB9C8" },
            { value: null }
          ],
          strokeWidth: [
            {
              test:
                "(rectBrush.state === 'resizing' || rectBrush.state === 'stop')",
              value: 2
            },
            { value: 0 }
          ],
          fill: [
            { test: "rectBrush.state === 'resizing'", value: "#8b9bac" },
            { value: null }
          ],
          fillOpacity: { signal: "rectBrush.state === 'resizing' ? 0.2 : 0" },
          zindex: { signal: "rectBrush.state === 'resizing' ? 10 : -100" },
          x: {
            signal:
              "rectBrush.state === 'resizing' && rectBrush.segmentInRange.x[0]"
          },
          y: {
            signal:
              "rectBrush.state === 'resizing' && rectBrush.segmentInRange.y[0]"
          },
          x2: {
            signal:
              "rectBrush.state === 'resizing' && rectBrush.segmentInRange.x[1]"
          },
          y2: {
            signal:
              "rectBrush.state === 'resizing' && rectBrush.segmentInRange.y[1]"
          }
        }
      }
    }
  ];
  const scales = [
    {
      name: "xScale",
      type: "linear",
      round: false,
      nice: false,
      zero: false,
      domain: { data: "tree", fields: ["x0", "x1"] },
      range: { signal: "xRange" }
    },
    {
      name: "yScale",
      type: "linear",
      round: false,
      nice: false,
      zero: false,
      domain: { data: "tree", fields: ["y0", "y1"] },
      range: { signal: "yRange" }
    },
    {
      name: "fontScale",
      type: "linear",
      round: false,
      nice: false,
      zero: false,
      domain: { data: "tree", fields: ["y0", "y1"] },
      range: { signal: "[0, span(yRange)]" }
    },
    {
      name: "limitScale",
      type: "linear",
      round: false,
      nice: false,
      zero: false,
      domain: { data: "tree", fields: ["x0", "x1"] },
      range: { signal: "[0, span(xRange)]" }
    },
    ...(chartStruct.columnsData.color ? _buildColorsScales(chartStruct) : []),
    {
      name: "depth",
      type: "ordinal",
      domain: { data: "tree", field: "depth" },
      range: { scheme: "set1" }
    },
    {
      name: "size",
      type: "ordinal",
      domain: [0, 1, 2, 3],
      range: [256, 28, 20, 14]
    },
    {
      name: "opacity",
      type: "ordinal",
      domain: [0, 1, 2, 3],
      range: [0.15, 0.5, 0.8, 1]
    }
  ];
  const axes = [];

  return {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    width: width,
    height: height,
    autosize: { type: "none", resize: true },
    padding: { top: 10, right: 10, bottom: 10, left: 10 },
    data,
    signals,
    marks,
    scales,
    axes,
    config: {
      axis: {
        domain: false,
        tickSize: 3,
        tickcolor: "#888",
        labelFont: "Inter, Courier New"
      }
    }
  };
};

export default vegaSpec;
