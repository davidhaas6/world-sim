// import { supabase } from '@/app/lib/initSupabase';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import metrics from '@/app/lib/metrics';
import seedrandom from 'seedrandom';


const world_sim_system = `You are a highly sophisticated simulation engine. You can simulate scenarios ranging from quantum interactions to the human experience. The simulation progresses via your text output. You must continually provide an **update** and the **state** of the simulation.

# Update
A **40-50 word summary** of the universe's state, reflecting time progression and fractal-like complexity. Include cascading effects of user events where applicable. You write with short and plain sentences, like a 1980s sci-fi computer.

# State
A **JSON object** summarizing the simulation parameters. The state consists of {{num_metrics}} continuous variables, continuously being updated in accordance to the simulation. Each update, provide a NUMERICAL value for EACH variable in VALID JSON format.

### State Variables
{{metric_text}}
`

function getSystemPrompt(clientId: string) {
  const num_metrics = 10;
  const rng = seedrandom(clientId);
  const randomizedMetrics = [...metrics].sort(() => rng() - 0.5);
  const myMetrics = randomizedMetrics.slice(0, num_metrics);

  let metric_prompt = '';
  // for (let metric of myMetrics) {
  //   metric_prompt += `\n- ${metric['name']}\n  - ${metric['description']}\n  - Unit: ${metric['unit']}`;
  // }

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
  metric_prompt = metric_prompt.substring(0, metric_prompt.length - 1)  // remove final comma
  metric_prompt += '\n}\n```'

  const prompt = world_sim_system.replace(
    '{{num_metrics}}', num_metrics.toString()
  ).replace('{{metric_text}}', metric_prompt)
  console.log("Prompt:", prompt)
  return prompt;
}


export const maxDuration = 30;  // Allow streaming responses up to 30 seconds

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Extract the client ID from the headers
  const clientId = req.headers.get('x-client-id');
  console.log("client id", clientId)

  if (!clientId) {
    return new Response('Missing client ID', { status: 400 });
  }

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    system: getSystemPrompt(clientId),
    messages,
  });

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

