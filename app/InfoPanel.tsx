import { FunctionComponent } from "react";
import { Line, LineChart, RadialBar, RadialBarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { retroOutrunPalette } from "./lib/palettes";

type State = { [key in string]: number }
type StateSeries = { [key in string]: number[] };
type StringMap = { [key in string]: string }

interface InfoPanelProps {
  stateData: State[]
}

const InfoPanel: FunctionComponent<InfoPanelProps> = (props: InfoPanelProps) => {
  const { stateData } = props;
  if (stateData.length == 0) {
    return <div className="state-panel panel">
    </div>
  }

  var metrics: StateSeries = {}

  // form metric -> measurement series 
  for (const stateInstance of stateData) {
    for (const measure in stateInstance) {
      if (metrics.hasOwnProperty(measure)) {
        metrics[measure].push(stateInstance[measure])
      }
      else {
        metrics[measure] = [stateInstance[measure]]
      }
    }
  }

  const smolMetrics = [];
  const bigMetrics = [];
  const radialMetrics = [];
  var metricColors: StringMap = {};

  let idx = 0;
  for (const metric in metrics) {
    const measurements = metrics[metric];
    if (Math.max(...measurements) > 100 || Math.min(...measurements) < -100) {
      bigMetrics.push(metric)
    }
    else {
      smolMetrics.push(metric)
    }

    metricColors[metric] = retroOutrunPalette[idx % retroOutrunPalette.length];
    idx += 1;
  }


  console.log("bigmetrics", bigMetrics)
  console.log("small metrics ", smolMetrics)
  console.log("metric colors ", metricColors)

  return (
    <div className="state-panel panel">
      <ResponsiveContainer width={200} height="100%">
        <LineChart data={stateData} dataKey={"time"}>
          {bigMetrics.map((metric) => (
            <Line
              key={metric}
              type="natural"
              dataKey={metric}
              stroke={metricColors[metric]}
              strokeWidth={2}
              dot={false}
            />
          ))}
          <Tooltip />
          <XAxis height={15} />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width={200} height="100%">
        <LineChart data={stateData.slice()} dataKey={"time"}>
          {smolMetrics.map((metric, index) => (
            <Line
              key={metric}
              type="natural"
              dataKey={metric}
              stroke={metricColors[metric]}
              strokeWidth={2}
              dot={false}
            />
          ))}
          <Tooltip />
          {/* <YAxis width={20} allowDecimals={false} /> */}
          <XAxis height={15} />
        </LineChart>
      </ResponsiveContainer>

    </div>
  );
}

export default InfoPanel;