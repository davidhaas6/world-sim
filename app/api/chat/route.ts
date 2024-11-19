import { supabase } from '@/app/lib/initSupabase';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';


const world_sim_system = `You are a sophisticated world simulation engine powered by text. Each message in the conversation represents a step in the simulation. The user may update the simulation through events and time changes.
Each step, provide a **concise** 40-50 word update of the universe's state. The progress should reflect the change in time between steps and any events, demonstrating the fractal-like complexity of evolution within a universe. 
Provide your updates in a highly condensed but comprehensive form, maximizing the amount of information conveyed. Also provide the relevant **state** and other parameters of the simulation in a JSON object. This information should contextualize the simulation update.

# Example output:
This is an information-dense update for the simulation.
{
    \"relevant parameter\": \"value\",
    \"some data\": [123, 243],
    \"a more complex parameter\": {...}
}`

export const maxDuration = 30;  // Allow streaming responses up to 30 seconds

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o-mini'),
    system: world_sim_system,
    messages,
  });

  // TODO: server-side event parsing and database storage
  const { data, error } = await supabase
  .from('simulation_events')
  .insert([
    {simulation_id: 1232, update: "test"},
  ])
  .select()
  console.log(error)
  console.log(data)
        

  return result.toDataStreamResponse();
}

