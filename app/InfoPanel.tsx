import { FunctionComponent } from "react";
import { Bar, BarChart, Line, LineChart, RadialBar, RadialBarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { retroOutrunPalette, tab20cPalette, tab20Palette } from "./lib/palettes";

type State = { [key in string]: number }
type StateSeries = { [key in string]: number[] };
type StringMap = { [key in string]: string }

interface InfoPanelProps {
  stateData: State[]
}

const InfoPanel: FunctionComponent<InfoPanelProps> = (props: InfoPanelProps) => {
  const { stateData } = props;
  if (stateData.length == 0 || stateData == undefined) {
    return <div className="state-panel panel">
    </div>
  }

  var metrics: StateSeries = {}

  // form metric -> measurement series 
  for (const stateInstance of stateData) {
    for (const measure in stateInstance) {
      // if (measure == 'time')
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

    metricColors[metric] = tab20Palette[idx % retroOutrunPalette.length];
    idx += 1;
  }

  const smolMetricGraph = (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={stateData.slice()} dataKey={"time"}>
        {smolMetrics.map((metric) => (
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
        {/* <XAxis height={15}  dataKey={"time"}/> */}
      </LineChart>
    </ResponsiveContainer>
  );

  const bigMetricGraph = (
    <ResponsiveContainer width="100%" height={150}>
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
        {/* <XAxis height={15} /> */}
      </LineChart>
    </ResponsiveContainer>
  );


  return (
    <div className="state-panel panel">
      {smolMetrics.length > 0 && smolMetricGraph}
      {bigMetrics.length > 0 && bigMetricGraph}
    </div>
  );
}

export default InfoPanel;