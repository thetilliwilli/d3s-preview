export class Reporter {
  public static getHtml(injection: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FocusTime</title>
            <script src="https://code.highcharts.com/highcharts.js"></script>
            <script src="https://code.highcharts.com/highcharts-more.js"></script>
            <!-- <script src="data.js"></script> -->
        </head>
        
        <body>
            <script>
                const data = ${injection};
                
                window.addEventListener("DOMContentLoaded", () => {
        
                    (function (H) {
                        H.seriesType('flame', 'columnrange', {
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                format: '{point.name}',
                                inside: true,
                                align: 'center',
                                crop: true,
                                overflow: 'none',
                                color: 'black',
                                style: {
                                    textOutline: 'none',
                                    fontWeight: 'normal'
                                }
                            },
                            point: {
                                events: {
                                    click: function () {
                                        const point = this,
                                            chart = point.series.chart,
                                            series = point.series,
                                            xAxis = series.xAxis,
                                            yAxis = series.yAxis;
        
                                        xAxis.setExtremes(xAxis.min, point.x, false);
                                        yAxis.setExtremes(point.low, point.high, false);
        
                                        chart.showResetZoom();
                                        chart.redraw();
                                    }
                                }
                            },
                            pointPadding: 0,
                            groupPadding: 0
                        }, {
                            drawDataLabels: H.seriesTypes.line.prototype.drawDataLabels
                        });
                    }(Highcharts));
        
                    // Create the chart
        
                    const chart = Highcharts.chart('container', {
                        chart: {
                            inverted: true
                        },
                        title: {
                            align: 'left',
                            text: 'FocusTime'
                        },
                        // subtitle: {
                        //     align: 'left',
                        //     text: 'Highcharts chart rendering process'
                        // },
                        legend: {
                            enabled: false
                        },
                        xAxis: [{
                            visible: false
                        }, {
                            visible: false,
                            startOnTick: false,
                            endOnTick: false,
                            minPadding: 0,
                            maxPadding: 0
                        }],
                        yAxis: [{
                            visible: false
                        }, {
                            visible: false,
                            min: 0,
                            maxPadding: 0,
                            startOnTick: false,
                            endOnTick: false
                        }],
                        series: [{
                            type: 'flame',
                            data: data,
                            yAxis: 1,
                            xAxis: 1,
                            animation:false
                        }],
                        tooltip: {
                            headerFormat: '',
                            pointFormat: '[{point.custom.processId}, {point.custom.processName}] {point.custom.windowTitle}<br>{point.custom.startTime} - {point.custom.endTime} = {point.custom.duration}m'
                        }
                    });
        
                })
        
            </script>
        
            <div id="container"></div>
        </body>
        
        </html>
      `;
  }
}
