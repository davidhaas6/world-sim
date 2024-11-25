import { FunctionComponent } from "react";
import { Bar, BarChart, Line, LineChart, RadialBar, RadialBarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cosmic, darkAcademia, nebulaSerenityPalette, retroOutrunPalette, scifi, tab20bPalette, tab20cPalette, tab20Palette } from "./lib/palettes";
import seedrandom from 'seedrandom';

type State = { [key in string]: number }
type StateSeries = { [key in string]: number[] };
type StringMap = { [key in string]: string }

interface InfoPanelProps {
  stateData: State[]
}

function noisyInterpolate(states: State[], numPoints: number) {
  let interpStateArr = [];
  for (let i = 0; i < states.length-1; i++) {
    let newStates: State[] = []
    const rng = seedrandom(states[i]['time'].toString())

    for (const metric in states[i]) {
      if (states[i+1].hasOwnProperty(metric)) {
        // interpolate
        const step = (states[i+1][metric] - states[i][metric]) / (numPoints+1);
        for (let j = 0; j < numPoints; j++) {
          const randomFactor = rng()*2;
          let val = states[i][metric] + step * (j+1) * randomFactor;
          val = Math.round(val*100)/100;
          if(newStates.length <= j) {
            const state: State = {};
            state[metric] = val;
            newStates.push(state)
          }
          else {
            newStates[j][metric] = val;
          }
        }
      }
    }
    interpStateArr.push(states[i]);
    interpStateArr.push(...newStates);
  }
  interpStateArr.push(states[states.length-1]);

  return interpStateArr;
}


const InfoPanel: FunctionComponent<InfoPanelProps> = (props: InfoPanelProps) => {
  const { stateData } = props;
  const chartColorPalette = nebulaSerenityPalette;
  const numInterp = stateData.length > 8 ? 1 : 3;
  const interpolatedState = noisyInterpolate(stateData,numInterp);

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
    if (metric == 'time') {
      continue;
    }
    if (Math.max(...measurements) > 101 || Math.min(...measurements) < -101) {
      bigMetrics.push(metric)
    }
    else {
      smolMetrics.push(metric)
    }

    metricColors[metric] = chartColorPalette[idx % chartColorPalette.length];
    idx += 1;
  }

  const tooltip = <Tooltip allowEscapeViewBox={{ x: true, y: true }} wrapperStyle={{zIndex:"100"}}/>

  const smolMetricGraph = (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={interpolatedState} dataKey={"time"}>
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
        {tooltip}
        <XAxis hide={true} dataKey={"time"} />
        <YAxis width={40} />
      </LineChart>
    </ResponsiveContainer>
  );

  const bigMetricGraph = (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={interpolatedState} dataKey={"time"}>
        {bigMetrics.map((metric) => (
          <Line
            key={metric}
            type="natural"
            dataKey={metric}
            stroke={metricColors[metric]}
            strokeWidth={4}
            dot={false}
          />
        ))}
        {tooltip}
        {/* <XAxis height={15} /> */}
        <YAxis width={40} />
        <XAxis height={15}  dataKey={"time"}/>
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