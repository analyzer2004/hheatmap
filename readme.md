# Hierarchical Heatmap

Visualize hierarchical data in an interesting and different aspect where leaf nodes are represented by a heatmap. The algorithm uses hierarchical data to compute the cell positions, colors and generates a legend with ranges.

**For a live demo, see [Hierarchical Heatmap](https://observablehq.com/@analyzer2004/hierarchical-heatmap).**

# API Reference
* **Heatmap()** - Constructs a new hierarchical heatmap generator with the default settings.
* **size(width, height)** - Sets this heatmap's dimensions to specified width and height and returns this heatmap.
* **padding(padding)** - Sets the padding to the specified number and returns this heatmap.
* **legendCellWidth(width)** - Sets the width for each cell of the legend and returns this heatmap.
* **mapHeight(height)** - Sets the number of rows for the heatmap part and returns this heatmap.
* **groupColors(color)** - Sets the color range of group cells and returns this heatmap. If a single color is specified, it sets the color range to [color, **1.5 times brighter** of the color], otherwise you can simply specify a color range [start, end] or a color interpolator.
* **cellColor(color)** - Sets the color range of map cells and returns this heatmap. If a single color is specified, it sets the color range to [color, **2 times darker** of the color], otherwise you can simply specify a color range [start, end] or an color interpolator.
* **emptyColor(color)** - Sets the color of empty cells and returns this heatmap.
* **data(data)** - Sets the hierarchical data to generate the map and returns this heatmap.
* **populate()** - Computes and assigns the following properties on root and its descendants:
  * node.**x0** - the left edge of the cell
  * node.**y0** - the top edge of the cell
  * node.**x1** - the right edge of the cell
  * node.**y1** - the bottom edge of the cell
  * node.**color** - the color of the cell
  * node.**cx** - the x of the center of the circle *(Only applys to leaves)*
  * node.**cy** - the y of the center of the circle *(Only applys to leaves)*
  * node.**r** - the radius of the circle
* **legend(segments, format)** - Computes and returns an array that represents each cell of the legend:
  * cell.**x** - the left edge of the cell
  * cell.**width** - the width of the cell
  * cell.**label** - the formated number of the cell
  * cell.**color** - the color of the cell
  * cell.**floor** - the floor of the range this cell represents
  * cell.**ceiling** - the ceiling of the range this cell represents