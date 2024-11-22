import { FunctionComponent } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type State = { [key in string]: number }
type StateSeries = { [key in string]: number[] };

interface InfoPanelProps {
  stateData: State[]
}


function displayState(worldState: any) {
  let fields = [];
  for (const key in worldState) {
    if (worldState.hasOwnProperty(key)) {
      fields.push(
        <li key={key}><b>{key}</b>: {worldState[key].toString()}</li>
      )
    }
  }
  return <ul>{fields}</ul>
}


const InfoPanel: FunctionComponent<InfoPanelProps> = (props: InfoPanelProps) => {
  const { stateData } = props;
  if (stateData.length == 0) {
    return <div className="state-panel panel">
    </div>
  }
  var metrics: StateSeries = {}
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

  const retroOutrunColors = [
    "#6a2a6a",
    "#2a6a6a",
    "#684a70",
    "#725863",
    "#6d475a",
    "#552565",
    "#556525",
    "#325c58",
    "#5e3a1e",
    "#663e41",
    "#204060",
    "#5a1c29",
    "#452161",
    "#266657",
    "#2a5b21",
    "#3a1e5e",
    "#632848",
    "#6a6a2a",
  ];

  return (
    <div className="state-panel panel">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart height={300} data={stateData} dataKey={"time"}>
          <ReferenceLine y={100} label="100" stroke="green" strokeDasharray="3 3" />
          {Object.keys(metrics).map((metric, index) => (
            <Line
              key={metric}
              type="natural"
              dataKey={metric}
              stroke={retroOutrunColors[index % retroOutrunColors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
          <Tooltip />
          <YAxis width={20} allowDecimals={false} />
          <XAxis height={15} /> 
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default InfoPanel;