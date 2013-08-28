;(function (window, $, undefined) {

    /**
     * Grid
     *
     * Absolute positions columns and cells based on class names
     *
     * Usage:
     *   Class names for the wrapper (this.el)
     *     cols-x: total number of columns in the grid
     *
     *   Class names for cells:
     *     col-x: start at column x
     *     colspan-x: span across x columns
     *
     * @author Peter Rudolfsen <peter@aptoma.com>
     */
    var Grid = function (options) {
        var styles;

        this.options = $.extend({
            prefix: ''
        }, options);

        this.el = options.el;

        // The total height each column has available
        this.height = options.height || $(this.el).height();

        // Define lineHeight if you want to align columns to a "vertical grid"
        this.lineHeight = options.lineHeight || 0;

        // Make sure to respect the padding
        styles = window.getComputedStyle(this.el, null);
        this.paddingTop = parseInt(styles.getPropertyValue('padding-top'), 10);
        this.paddingBottom = parseInt(styles.getPropertyValue('padding-bottom'), 10);
        this.height -= (this.paddingTop + this.paddingBottom);

        this._position();
    };

    /**
     * Position all elements in the grid based on the class names
     *
     * Currently does not support multiple flexing elements in a single column
     * (flex = automatically adjust the height to the available space)
     *
     * @return {void}
     * @private
     */
    Grid.prototype._position = function () {
        var that = this,
            columns = [],
            numCols = this.el.className.match(/cols\-([0-9]+)/);

        if (!numCols) {
            throw new Error('Failed to find number of columns');
        }

        // Initialize each column
        numCols = parseInt(numCols[1], 10);
        for (var i = 0; i < numCols; i++) {
            columns[i] = {
                remainingHeight: this.height,
                cells: []
            };
        }

        $(this.el).find('[class*="col-"]').each(function () {
            var col = parseInt(this.className.match(/col\-([0-9]+)/)[1], 10) - 1,
                span = this.className.match(/colspan\-([0-9]+)/),
                cell = that._createCellFromEl(this);

            span = span ? parseInt(span[1], 10) : 1;

            // Cells that span across multiple columns are added to
            // the array for each column it spans across
            // TODO: cells sometimes need to stick to the bottom
            for (var i = col; i < (col + span); i++) {
                columns[i].cells.push(cell);
            }
        });

        this._calcMetrics(columns);

        console.log(_.pluck(columns, 'cells'));

        $.each(columns, function (index, column) {
            that._positionColumn(index, column);
        });
    };

    /**
     * Create a cell object from an HTML element
     *
     * Contains all required properties to calculate the grid
     *
     * @param {HTMLElement} el
     * @return {Object}
     */
    Grid.prototype._createCellFromEl = function (el) {
        var flex = $(el).hasClass(this._class('flex'));

        return {
            el: el,
            height: 0,
            top: 0,
            flex: flex
        };
    };

    Grid.prototype._calcMetrics = function (columns) {
        var colTop, colBottom, numColumns, numCells, height, cell, $cell, i, j;

        colTop = this._class('col-top');
        colBottom = this._class('col-bottom');

        numColumns = columns.length;

        for (i = 0; i < numColumns; i++) {
            numCells = columns[i].cells.length;

            for (j = 0; j < numCells; j++) {
                cell = columns[i].cells[j];
                $cell = $(cell.el);
                $cell.removeClass(colTop + ' ' + colBottom);

                if (j === 0) {
                    cell.isTop = true;
                    $cell.addClass(colTop);
                }

                if (j === (numCells - 1)) {
                    cell.isBottom = true;
                    $cell.addClass(colBottom);
                }
            }
        }

        // Batch calculatation for DOM performance
        for (i = 0; i < numColumns; i++) {
            numCells = columns[i].cells.length;

            for (j = 0; j < numCells; j++) {
                $cell = $(columns[i].cells[j].el);
                height = $cell.hasClass(this._class('flex')) ? 0 : $cell.outerHeight(true);

                console.log(columns[i].cells[j].el, columns[i].cells[j].el.className, height);

                columns[i].cells[j].height = height;
                columns[i].remainingHeight -= height;
            }
        }
    };

    /**
     * Position a single column
     *
     * Helper method for _position
     *
     * @param {number} index
     * @param {HTMLElement} column
     * @return {void}
     * @private
     */
    Grid.prototype._positionColumn = function (index, column) {
        var that = this, top = this.paddingTop;

        $.each(column.cells, function (index, cell) {
            var $cell = $(cell.el), css = {}, rest = 0;

            // only snap to the vertical grid if it's not the top cell
            // AND if it's a flexing cell
            if (that.lineHeight && !cell.isTop && !(cell.isBottom && !cell.flex)) {
                rest = (top - that.paddingTop) % that.lineHeight;
                if (rest !== 0) {
                    rest = that.lineHeight - rest;
                    column.remainingHeight -= rest;
                    top += rest;
                }
            }

            // Push it down to the lowest position so it doesn't overlap with any of the cells above it
            if (!cell.isTop || cell.top < top) {
                cell.top = top;
            }

            css.top = cell.top + 'px';

            if (cell.flex) {
                var margin = parseInt($cell.css('margin-bottom'), 10) + parseInt($cell.css('margin-top'), 10);

                cell.height = column.remainingHeight;
                css.height = (cell.height > margin ? cell.height - margin : 0) + 'px';
            }

            $cell.css(css);
            top += cell.height;
        });
    };

    /**
     * Prefix a class name
     *
     * @param {string} string
     * @return {string} prefixed string
     */
    Grid.prototype._class = function (string) {
        return this.options.prefix + string;
    };

    $.fn.grid = function (options) {
        options = options || {};

        options.el = this[0];
        return new Grid(options);
    };

    window.Grid = Grid;

}(this, window.Zepto || window.jQuery));
