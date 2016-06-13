// ==UserScript==
// @name         PerfTimeline
// @namespace    http://nicj.net
// @version      0.1
// @author       Nic Jansma
// @grant        none
// @run-at       document-start
// @include      *
// @noframes
// ==/UserScript==

(function() {
    //
    // Utility functions
    //
    /**
     * Adds a SCRIPT to the current page
     *
     * @param {string} src Script source
     * @param {function} callback Callback function
     */
    function addScript(src, callback) {
        var s = document.createElement('script');
        s.setAttribute('src', src);

        if (callback) {
            s.onload = callback;
        }

        document.head.appendChild(s);
    }

    /**
     * Adds a CSS to the current page
     *
     * @param {string} src CSS source
     */
    function addCss(src) {
        var s = document.createElement('link');
        s.setAttribute('href', src);
        s.setAttribute('rel', 'stylesheet');
        document.head.appendChild(s);
    }

    //
    // Local Members
    //
    var startTime = Date.now();

    //
    // Constants
    //

    // PerfCollector
    var COLLECTION_INTERVAL = 1000;

    // different monitors
    var MONITORS = {
        "busy":
            {
                color: 'orange',
                name: "Page Busy %",
                data: [],
                backfill: 100
            },
        "fps":
            {
                color: 'green',
                name: "FPS",
                data: []
            },
        "videofps":
            {
                color: 'darkgreen',
                name: "Video FPS",
                data: []
            },
        "errors":
            {
                color: 'red',
                name: "Errors",
                data: []
            },
        "scroll":
            {
                color: 'yellow',
                name: "Scroll Px",
                data: []
            },
        "scrollpct":
            {
                color: 'yellow',
                name: "Scroll %",
                data: []
            },
        "clicks":
            {
                color: 'cyan',
                name: "Clicks",
                data: []
            },
        "mouse":
            {
                color: 'cyan',
                name: "Mouse Move",
                data: []
            },
        "mousepct":
            {
                color: 'cyan',
                name: "Mouse Move %",
                data: []
            },
        "keys":
            {
                color: 'turquoise',
                name: "Keys",
                data: []
            },
        "resources":
            {
                color: 'green',
                name: "Resources",
                data: []
            },
        "domchangecount":
            {
                color: 'purple',
                name: "DOM Change #",
                data: []
            },
        "domchangepct":
            {
                color: 'magenta',
                name: "DOM Change %",
                data: []
            },
        "domlength":
            {
                color: 'pink',
                name: "DOM Nodes",
                data: []
            },
        "domsize":
            {
                color: 'white',
                name: "DOM Size (kb)",
                data: []
            },
    };

    // BusyMonitor
    var BUSY_POLLING_INTERVAL = 25;
    var BUSY_POLLS_PER_COLLECTION = Math.ceil(COLLECTION_INTERVAL / BUSY_POLLING_INTERVAL);
    var BUSY_ALLOWED_DEVIATION_MS = 4;

    // PerfGraph
    var GRAPH_HEIGHT = 75;

    //
    // PerfCollector
    //
    var perfCollector = (function(startTime) {
        //
        // Functions
        //
        /**
         * Gets the current time
         * @returns {number} Current time
         */
        function getTime() {
            return Math.floor((Date.now() - startTime) / COLLECTION_INTERVAL);
        }

        /**
         * Ensures we have backfilled data for the specified type
         *
         * @param {string} type Type
         * @param {number} [time] Time
         */
        function ensureData(type, time) {
            while (!MONITORS[type].data[--time] && time >= 0) {
                MONITORS[type].data[time] = {x: time, y: (MONITORS[type].backfill ? MONITORS[type].backfill : 0)};
            }
        }

        /**
         * Sets data for the specified type
         *
         * @param {string} type Type
         * @param {number} [value] Value
         * @param {number} [time] Time
         */
        function set(type, value, time) {
            if (typeof time === "undefined") {
                time = getTime();
            }

            ensureData(type, time);

            MONITORS[type].data[time] = {x: time, y: value};
        }

        /**
         * Increments data for the specified type
         *
         * @param {string} type Type
         * @param {number} [value] Value
         * @param {number} [time] Time
         */
        function increment(type, value, time) {
            if (typeof time === "undefined") {
                time = getTime();
            }

            if (typeof value === "undefined") {
                value = 1;
            }

            ensureData(type, time);

            if (!MONITORS[type].data[time]) {
                MONITORS[type].data[time] = {x: time, y: 0};
            }

            MONITORS[type].data[time].y += value;
        }

        return {
            set: set,
            increment: increment,
            getTime: getTime
        };
    })(startTime, COLLECTION_INTERVAL);

    //
    // BusyMonitor
    //
    var busyMonitor = (function(collector) {
        //
        // Local Members
        //

        // time we last fired
        var last = Date.now();

        // number of times we fired in this interval
        var total = 0;

        // number of times we fired late in this interval
        var late = 0;

        //
        // Functions
        //
        /**
         * Run at each polling interval, detecting if we ran late at all
         */
        function checkBusy() {
            var now = Date.now();
            var delta = now - last;
            last = now;

            // if we're more than 2x the polling interval + deviation, we missed one period
            // completely
            while (delta > ((BUSY_POLLING_INTERVAL * 2) + BUSY_ALLOWED_DEVIATION_MS)) {
                total++;
                late++;

                // adjust by the interval, and check again
                delta -= BUSY_POLLING_INTERVAL;
            }

            // total intervals increased by one
            total++;

            // late intervals increased by one if we're more than the interval + deviation
            if (delta > (BUSY_POLLING_INTERVAL + BUSY_ALLOWED_DEVIATION_MS)) {
                late++;
            }
        }

        /**
         * Reports how busy we were for this collection interval
         */
        function reportBusy() {
            var reportTime = collector.getTime();
            var curTime = reportTime;

            // if we had more polls than we expect in each collection period,
            // we must've not been able to report, so assume those periods were
            // 100% busy
            while (total > BUSY_POLLS_PER_COLLECTION) {
                collector.set("busy", 100, --curTime);

                // reset the period by one
                total -= BUSY_POLLS_PER_COLLECTION;
                late -= BUSY_POLLS_PER_COLLECTION;
            }

            collector.set("busy", Math.round(late / total * 100), reportTime);

            // reset stats
            total = 0;
            late = 0;
        }

        setInterval(checkBusy, BUSY_POLLING_INTERVAL);
        setInterval(reportBusy, COLLECTION_INTERVAL);
    })(perfCollector);

    //
    // FrameRateMonitor
    //
    var frameRateMonitor = (function(collector) {
        //
        // Local Members
        //

        // the latest time
        var latestTime = collector.getTime();

        // total frames seen
        var totalFrames = 0;

        // time we started monitoring
        var frameStartTime = Date.now();

        /**
         * requestAnimationFrame callback
         */
        function frame() {
            var time = collector.getTime();
            totalFrames++;

            // make sure to draw after every second
            if (time != latestTime) {
                // perfGraph.update();
                latestTime = time;
            }

            // increment the FPS
            collector.increment("fps");

            // request the next frame
            window.requestAnimationFrame(frame);
        }

        // TODO: Final metrics like totalFrames / duration

        // start out the first frame
        window.requestAnimationFrame(frame);
    })(perfCollector);

    //
    // VideoFrameRateMonitor
    //
    var videoFrameRateMonitor = (function(collector) {
        //
        // Local Members
        //

        // the latest frame
        var latestFrame = 0;

        // frame from last report
        var latestReportedFrame = 0;

        /**
         * Reports on the number of errors seen
         */
        function reportFps() {
            // find the first VIDEO element on the page
            var vids = document.getElementsByTagName("video");
            if (vids && vids.length) {
                var vid = vids[0];
                if (vid.webkitDecodedFrameCount) {
                    latestFrame = vid.webkitDecodedFrameCount;
                }
            }

            collector.set("videofps", Math.max(latestFrame - latestReportedFrame, 0));

            // reset count
            latestReportedFrame = latestFrame;
        }

        setInterval(reportFps, COLLECTION_INTERVAL);
    })(perfCollector);

    //
    // ErrorMonitor
    //
    var errorMonitor = (function(collector) {
        //
        // Local Members
        //

        // number of errors we saw this period
        var errorCount = 0;

        // listen for errors
        var globalOnError = window.onerror;
        window.onerror = function () {
            errorCount++;

            // call the previous error handler
            if (typeof globalOnError === "function") {
                globalOnError.apply(window, arguments);
            }
        };

        /**
         * Reports on the number of errors seen
         */
        function reportErrors() {
            collector.set("errors", errorCount);

            // reset count
            errorCount = 0;
        }

        setInterval(reportErrors, COLLECTION_INTERVAL);
    })(perfCollector);

    //
    // ScrollMonitor
    //
    var scrollMonitor = (function(collector) {
        //
        // Local Members
        //

        // last scroll Y
        var lastY = 0;

        // scroll % this period
        var scrollPct = 0;

        window.addEventListener("scroll", function() {
            var body = document.body;
            var html = document.documentElement;

            var curY = window.scrollY;

            var height = Math.max(body.scrollHeight, body.offsetHeight,
                                  html.clientHeight, html.scrollHeight, html.offsetHeight) - window.innerHeight;

            var diffY = Math.abs(lastY - curY);

            collector.increment("scroll", diffY);

            // calculate percentage of document scrolled
            scrollPct += Math.round(diffY / height * 100);

            lastY = curY;
        }, false);

        /**
         * Reports on the number of errors seen
         */
        function reportScroll() {
            collector.set("scrollpct", Math.min(scrollPct, 100));

            // reset count
            scrollPct = 0;
        }

        setInterval(reportScroll, COLLECTION_INTERVAL);
    })(perfCollector);

    //
    // ClickMonitor
    //
    var clickMonitor = (function(collector) {
        document.addEventListener("click", function() {
            collector.increment("clicks");
        }, false);
    })(perfCollector);

    //
    // KeyMonitor
    //
    var keyMonitor = (function(collector) {
        document.addEventListener("keydown", function() {
            collector.increment("keys");
        }, false);
    })(perfCollector);

    //
    // MouseMonitor
    //
    var mouseMonitor = (function(collector) {
        var lastX = 0;
        var lastY = 0;
        var mousePct = 0;

        var screenPixels = Math.round(Math.sqrt(Math.pow(window.innerHeight, 2) +
            Math.pow(window.innerWidth, 2)));

        document.addEventListener("mousemove", function(e) {
            var newX = e.clientX;
            var newY = e.clientY;

            // calculate number of pixels moved
            var pixels = Math.round(Math.sqrt(Math.pow(lastY - newY, 2) +
                                    Math.pow(lastX - newX, 2)));

            // calculate percentage of screen moved (upper-left to lower-right = 100%)
            mousePct += Math.round(pixels / screenPixels * 100);

            lastX = newX;
            lastY = newY;

            collector.increment("mouse", pixels);
        }, false);

        /**
         * Reports on the number of errors seen
         */
        function reportMousePct() {
            collector.set("mousepct", Math.min(mousePct, 100));

            // reset count
            mousePct = 0;
        }
        setInterval(reportMousePct, COLLECTION_INTERVAL);
    })(perfCollector);

    //
    // ResourceMonitor
    //
    var resourceMonitor = (function(collector) {
        //
        // Local Members
        //
        var resourceCount = 0;

        function reportResources() {
            var curResources = performance.getEntriesByType("resource").length;

            var delta = 0;
            if (curResources > resourceCount) {
                delta = curResources - resourceCount;
            } else if (curResources < resourceCount) {
                // resources were cleared
                delta = curResources;
            }

            // reset to current count
            resourceCount = curResources;

            collector.set("resources", delta);
        }

        setInterval(reportResources, COLLECTION_INTERVAL);
    })(perfCollector);

    //
    // DomChangeMonitor
    //
    var domMonitor = (function(collector) {
        //
        // Local Members
        //

        // number of mutations seen
        var mutationCount = 0;

        // current size of the DOM
        var domLength = document.getElementsByTagName("*").length;

        // create an observer instance
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var node;

                if (mutation.type === "childList") {
                    // also count grand children
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        node = mutation.addedNodes[i];

                        if (!window.$ || $(node).parents("#perf-graph").length === 0) {
                            mutationCount++;
                            mutationCount += node.getElementsByTagName ? node.getElementsByTagName("*").length : 0;
                        }
                    }
				}
			});
        });

        // configuration of the observer:
        var config = { attributes: false, childList: true, subtree: true };

        // pass in the target node, as well as the observer options
        observer.observe(document, config);

        function reportMutations() {
            // report as % of DOM size
            var deltaPct = Math.min(Math.round(mutationCount / domLength * 100), 100);

            // report on change
            collector.set("domchangecount", mutationCount);
            collector.set("domchangepct", deltaPct);

            // reset count and DOM size
            mutationCount = 0;
            domLength = document.getElementsByTagName("*").length;

            // report on counts too
            reportCounts();
        }

        function reportCounts() {
            // report on other metrics
            collector.set("domlength", domLength);

            var graph = document.getElementById("perf-graph");
            var graphLength = graph ? graph.innerHTML.length : 0;

            var size = Math.round((document.documentElement.innerHTML.length - graphLength) / 1024);

            collector.set("domsize", size);
        }

        // report on static counts
        reportCounts();

        setInterval(reportMutations, COLLECTION_INTERVAL);
    })(perfCollector);

    //
    // PerfGraph
    //
    var perfGraph = (function(collector) {
        //
        // Local members
        //

        // graph container div
        var graphContainer$;

        // graph container top
        var graphContainerTop = 0;

        // RickShaw graph
        var graph;

        // annotator
        var annotator;

        // series data
        var series = [];

        /**
         * Initializes the graph
         */
        function init() {
            if (!window.Rickshaw || graphContainer$) {
                return;
            }

            // dynamic CSS
            $("<style>").prop("type", "text/css").html(".rickshaw_legend .line { display: inline-block }").appendTo("head");

            // graph template
            graphContainer$ = $('<div style="position: fixed; z-index: 100; top: 1000px; background: #404040; padding-top: 10px">' +
                '<div id="perf-graph"></div><div id="timeline"></div><div id="legend"></div></div>');

            // fill the screen width
            graphContainer$.width(screen.width);

            // add our graph to the body
            $('body').prepend(graphContainer$);

            for (var monitorName in MONITORS) {
                series.push(MONITORS[monitorName]);
            }

            //
            // Graph
            //
            graph = new Rickshaw.Graph({
                element: graphContainer$.find("#perf-graph")[0],
                series: series,
                renderer: "line",
                height: GRAPH_HEIGHT
            });

            //
            // Add components like the axis, annotation, legend, etc
            //
            var xAxis = new Rickshaw.Graph.Axis.Time({
                graph: graph
            });

            xAxis.render();

            var yAxis = new Rickshaw.Graph.Axis.Y({
                graph: graph
            });

            yAxis.render();

            annotator = new Rickshaw.Graph.Annotate({
                graph: graph,
                element: graphContainer$.find('#timeline')[0]
            });

            var legend = new Rickshaw.Graph.Legend({
                graph: graph,
                element: graphContainer$.find('#legend')[0]
            });

            var shelving = new Rickshaw.Graph.Behavior.Series.Toggle({
                graph: graph,
                legend: legend
            });

            var highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
                graph: graph,
                legend: legend
            });

            var hoverDetail = new Rickshaw.Graph.HoverDetail( {
                graph: graph,
            });

            // first render
            graph.render();
        }

        /**
         * Adds an annotation
         *
         * @param {string} value Annotation to add
         */
        function annotate(value) {
            if (!annotator) {
                return;
            }

            annotator.add(collector.getTime(), value);
            annotator.update();
        }

        /**
         * Updates the graph
         */
        function update() {
            if (!graph) {
                return;
            }

            // recalculate the top to position it on layout change
            var top = $(window).height() - graphContainer$.height();
            if (top != graphContainerTop) {
                graphContainerTop = top;
                graphContainer$.css("top", graphContainerTop + "px");
            }

            // have the graph update itself
            graph.update();
        }

        setInterval(update, COLLECTION_INTERVAL);

        return {
            update: update,
            init: init,
            annotate: annotate
        };
    })(perfCollector);

    //
    // Misc
    //
    document.addEventListener("visibilitychange", function() {
        perfGraph.annotate(document.hidden ? "hidden" : "visible");
    }, false);

    //
    // Before we draw the graph, we need to load some CSS and JS
    //

    //
    // CSS dependencies
    //
    addCss('//cdnjs.cloudflare.com/ajax/libs/rickshaw/1.5.1/rickshaw.min.css');

    //
    // JavaScript dependencies
    //
    function loadD3() {
        window.d3 ? loadRickshaw() : addScript("//cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js", loadRickshaw);
    }

    function loadRickshaw() {
        window.Rickshaw ? perfGraph.init() : addScript("//cdnjs.cloudflare.com/ajax/libs/rickshaw/1.5.1/rickshaw.min.js", perfGraph.init);
    }

    //
    // start off by loading jQuery
    //
    window.$ ? loadD3() : addScript("//cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js", loadD3);
})();
