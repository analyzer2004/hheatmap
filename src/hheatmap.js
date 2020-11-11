class Heatmap {
    constructor() {
        this._width = 0;
        this._height = 0;
        this._actualHeight = 0;
        this._padding = 0;
        this._legendCellWidth = 30;
        this._mapHeight = 5;
        this._minHeaderHeight = 45;
        this._data = null;
        this._groupColors = ["#107bab", "#3f95bb"];
        this._cellColors = ["#dee7c6", "#667848"];
        this._emptyColor = "#eee";
        this._groupScale = null;
        this._cellScale = null;
    }

    size(width, height) {
        return arguments.length ? (this._width = width, this._height = height, this) : [this._width, this._height];
    }

    padding(_) {
        return arguments.length ? (this._padding = _, this) : this._padding;
    }

    legendCellWidth(_) {
        return arguments.length ? (this._legendCellWidth = _, this) : this._legendCellWidth;
    }

    mapHeight(_) {
        return arguments.length ? (this._mapHeight = _, this) : this._mapHeight;
    }

    groupColors(color) {
        if (arguments.length) {
            if (typeof color === "string") {
                const c = d3.color(color);
                this._groupColors = [c, c.brighter(1.5)];
            }
            else {
                this._groupColors = color;
            }
            return this;
        }
        else return this._groupColors;
    }

    cellColors(color) {
        if (arguments.length) {
            if (typeof color === "string") {
                const c = d3.color(color);
                this._cellColors = [c, c.brighter(2)];
            }
            else {
                this._cellColors = color;
            }
            return this;
        }
        else return this._cellColors;
    }

    emptyColor(_) {
        return arguments.length ? (this._emptyColor = _, this) : this._emptyColor;
    }

    data(_) {
        return arguments.length ? (this._data = _, this) : this._data;
    }

    get actualHeight() {
        return this._actualHeight;
    }

    populate() {
        const { d, m, columns, slns } = this._align();
        // Leaf nodes are arranged vertically, all nodes at other levels are horizontally arranged
        // The height of a node at other levels is half of a leaf node        
        const unitHeight = this._height / ((d - 1) / 2 + this._mapHeight);
        const unitWidth = this._width / slns.length;

        var cellHeight, mapCellHeight;
        const mapCellWidth = unitWidth / columns;

        var uh = unitWidth < unitHeight ? unitWidth : unitHeight;
        // Header cells require a minimum height for properly displaying its content.
        // If the calculated unit height is less then the threshold, 
        // it will be limited to the requirement and the mapCellHeight will be calulated based on this limitation
        if (uh < this._minHeaderHeight * 2) {
            cellHeight = this._minHeaderHeight * 2;
            // Calculate mapCellHeight based on new available height
            const mh = (this._height - (d - 1) * cellHeight / 2) / this._mapHeight;
            mapCellHeight = mapCellWidth < mh ? mapCellWidth : mh;
        }
        else {
            // Normal situation
            cellHeight = unitWidth < unitHeight ? unitWidth : unitHeight;
            mapCellHeight = mapCellWidth < unitHeight ? mapCellWidth : unitHeight;
        }

        // Update actualHeight
        this._actualHeight = (d - 1) * cellHeight / 2 + mapCellHeight * this._mapHeight;

        // only leaf nodes use full cellHeight
        var x = 0;
        slns.forEach(p => {
            p.children.forEach((n, i) => {
                const y = (d - 1) * cellHeight / 2 + i % this._mapHeight * mapCellHeight; // d - 1 => leaf level
                const cellX = x + mapCellWidth * Math.floor(i / this._mapHeight);
                this._setPos(n, cellX, cellX + mapCellWidth, y, y + mapCellHeight);
            });
            const y = (d - 2) * cellHeight / 2; // d - 2 => the 2nd to last level
            this._setPos(p, x, x + unitWidth, y, y + cellHeight / 2);
            x += unitWidth;
        });

        // all other levels except leaf and the 2nd to last
        for (var i = d - 3; i >= 0; i--) {
            x = 0;
            this._getNodes(i).forEach(n => {
                const w = n.children.reduce((a, b) => a + (b.x1 - b.x0), 0),
                    y = i * cellHeight / 2;
                this._setPos(n, x, x + w, y, y + cellHeight / 2);
                x += w;
            });
        }

        this._updateScales();
        this._finalize(d);

        return this._data;
    }

    legend(segments, format) {
        const dataset = this._data.leaves().filter(d => d.data).map(d => d.data.value);
        const s = this._sample(d3.extent(dataset), segments)
            .filter(s => dataset.find(d => d >= s.floor && d < s.ceiling));

        format = format || ".2s";
        return {
            width: s.length * this._legendCellWidth,
            cells: s.map((d, i) => ({
                x: i * this._legendCellWidth,
                width: this._legendCellWidth,
                label: d3.format(format)(d.floor),
                color: this._cellScale(d.floor),
                floor: d.floor,
                ceiling: d.ceiling
            }))
        };
    }

    _sample(ext, segments) {
        const min = ext[0], max = ext[1],
            gap = (ext[1] - ext[0]) / segments;

        var curr = { floor: min, ceiling: 0 };
        const s = [curr];
        for (var i = min + gap; i < max - gap; i += gap) {
            const p = Math.pow(10, Math.round(i).toString().length - 2);
            const v = Math.floor(i / p) * p;
            curr.ceiling = v;
            curr = { floor: v, ceiling: 0 };
            s.push(curr);
        }
        curr.ceiling = max;
        s.push({ floor: max, ceiling: Number.MAX_VALUE });
        return s;
    }

    _align() {
        const d = this._getDepth();
        // Nodes at the second to last level
        const slns = this._getNodes(d - 2);
        // Maximum number of children at the second to last level
        const m = Math.max.apply(null, slns.map(d => d.children.length));

        // the mapHeight cannot exceed m
        if (this._mapHeight > m) this._mapHeight = m;

        // Calculate maximum number of columns based on m then get a unified number of cells
        const columns = Math.ceil(m / this._mapHeight);
        const cells = columns * this._mapHeight;

        // Align based on the unified number of cells
        slns.forEach(n => {
            for (var i = n.children.length; i < cells; i++) {
                n.children.push({
                    data: null,
                    height: 0,
                    depth: n.depth + 1,
                    parent: n
                });
            }
        });

        return { d, m, columns, slns };
    }

    _setPos(node, x0, x1, y0, y1) {
        node.x0 = x0;
        node.x1 = x1;
        node.y0 = y0;
        node.y1 = y1;
    }

    _finalize(depth) {
        this._data.descendants().forEach(n => {
            this._setPos(n, n.x0 + this._padding, n.x1 - this._padding, n.y0 + this._padding, n.y1 - this._padding);
            n.color = !n.data ?
                this._emptyColor : n.depth <= depth - 2 ?
                    this._groupScale(n.depth) : this._cellScale(n.data.value);
        });

        // circle
        const leaves = this._data.leaves();
        if (leaves && leaves.length > 0) {
            const sample = leaves[0];
            const x = sample.x1 - sample.x0,
                y = sample.y1 - sample.y0;
            const hx = x / 2, hy = y / 2;
            const r = hx < hy ? hx : hy;
            leaves.forEach(n => {
                n.cx = hx;
                n.cy = hy;
                n.r = r;
            });
        }
    }

    _updateScales() {
        this._groupScale = this._scale(this._groupColors)
            .domain(this._data.height === 1 ? [0, 0] : this._seq(this._data.height));
        //.range(seq(map.height).map(i => d3.interpolatePuBu((10 - i * 1) * 0.1)))

        this._cellScale = this._scale(this._cellColors)
            .domain(d3.extent(this._data.leaves().filter(d => d.data).map(d => d.data.value)))
    }

    _scale(range) {
        if (typeof range === "function")
            return d3.scaleSequential(range);
        else
            return d3.scaleSequential().range(range);
    }

    _seq(length) {
        return Array.apply(null, { length: length }).map((d, i) => i);
    }

    _walkthrough(n, f) {
        f(n);
        if (n.children) n.children.forEach(d => this._walkthrough(d, f));
    }

    _getDepth() {
        if (this._data.height)
            return this._data.height + 1;
        else {
            var depth = this._data.depth;
            this._walkthrough(this._data, n => { if (n.depth > depth) depth = n.depth; });
            return depth + 1;
        }
    }

    _getNodes(level) {
        const nodes = [];
        this._walkthrough(this._data, n => { if (n.depth === level) nodes.push(n); });
        return nodes;
    }
}