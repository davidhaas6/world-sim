// import { supabase } from '@/app/lib/initSupabase';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import metrics from '@/app/lib/metrics';
import seedrandom from 'seedrandom';


const world_sim_system = `You are a highly sophisticated simulation engine. You can simulate scenarios ranging from quantum interactions to the human experience. The simulation progresses via your text output. The user will provide the time and any events, and you must provide an **update** and the **state** of the simulation.

# Update
A **50-60 word update** on the universe's state. Include cascading effects of user events where applicable. The content should reflect the time progression since the previous update. Use narrative-style updates, zooming in on specific aspects and events in the simulated world. Your updates should complement the trajectory of the simulated state, accompanying it with new and engaging information. 

### Update style
 - Write with plain sentences. 
 - To enhance readability, surround 2-3 key areas of the update with the <b> HTML tag.
 - *Never mention* the state variables
 - *Never refer* to the future. 

# State
A **JSON object** summarizing the simulation parameters. The state consists of {{num_metrics}} continuous variables that are updated in accordance to the simulation. Each update, provide a NUMERICAL value for EACH variable in VALID JSON format.

### State Variables
{{metric_text}}
`

function getSystemPrompt(clientId: string, sessionId: string) {
  const num_metrics = 10;
  const rng = seedrandom(clientId + sessionId);
  const randomizedMetrics = [...metrics].sort(() => rng() - 0.5);
  const myMetrics = randomizedMetrics.slice(0, num_metrics);
  let metric_prompt = '';

  metric_prompt += '\nExample state:\n```json\n{\n'
  for (let metric of myMetrics) {
    const unit = metric['unit'].toLowerCase();
    let random_num;
    if (unit.includes('percent')) {
      random_num = Math.round(rng() * 100 * 100) / 100
    } else if (unit.includes('index')) {
      random_num = Math.round(rng() * 100)
    }
    else {
      random_num = Math.round(rng() * 10000)
    }
    metric_prompt += `\n  "${metric['name']}": ${random_num},`
  }
  metric_prompt += '\n  "time": 2.045'
  metric_prompt += '\n}\n```'

  const prompt = world_sim_system.replace(
    '{{num_metrics}}', (num_metrics+1).toString() // plus one for time
  ).replace('{{metric_text}}', metric_prompt)
  return prompt;
}


export const maxDuration = 30;  // Allow streaming responses up to 30 seconds

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Extract the client ID from the headers
  const clientId = req.headers.get('x-client-id') ?? '';  // bad fix for null session IDs
  const sessionId = req.headers.get('x-session-id') ?? '';
  console.log("client id", clientId)
  console.log("session id", sessionId)

  if (!clientId) {
    return new Response('Missing client ID', { status: 400 });
  }

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    system: getSystemPrompt(clientId, sessionId),
    messages,
  });
  console.log(messages)

  // TODO: server-side event parsing and database storage
  // const { data, error } = await supabase
  // .from('simulation_events')
  // .insert([
  //   {simulation_id: 1232, update: "test"},
  // ])
  // .select()
  // console.log(error)
  // console.log(data)


  return result.toDataStreamResponse();
}

