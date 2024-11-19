// page.tsx
'use client';

import { Message, useChat, useCompletion } from 'ai/react';
import next from 'next';
import { useCallback, useEffect, useRef, useState } from 'react';


function processMessage(message: Message) {
  if (message.role === 'user') {
    return null;
  } else {
    const completion = message.content;
    const bracket_idx = completion.indexOf('{');
    let text_update = completion;
    let state = null

    if (bracket_idx >= 0) {
      text_update = completion.substring(0, bracket_idx)
      if (completion.split('{').length == completion.split('}').length) {  // heuristic for json completeness
        let json_update = completion.substring(bracket_idx)
        try {
          state = JSON.parse(json_update.replaceAll('\n', ''))
        }
        catch (SyntaxError) {
          console.error("Could not parse generated json: ", json_update)
        }
      }
    }
    return { text_update, state };
  }
}

function useSimulation(simEvent?: string, timeDelta = 1) {
  const [simTime, setTime] = useState(0);
  const { messages, append } = useChat({ onResponse: () => { } });
  const nextStep = useCallback(
    () => {
      const newTime = simTime + timeDelta;
      setTime(newTime);
      let prompt = "TIME: " + simTime
      if (simEvent) {
        prompt += '\nEvent: ' + simEvent
      }
      console.log(prompt)

      append({ role: "user", content: prompt });
    },
    [simTime, timeDelta, simEvent],
  )

  return { messages, nextStep };
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


export default function Page() {
  const [eventField, setEventField] = useState<string>('');
  const eventContainerRef = useRef<HTMLDivElement>(null);
  const { messages, nextStep } = useSimulation(eventField);

  const handleFormInput = (event: any) => {
    setEventField(event.target.value);
  };

  const nextStepButton = (event: any) => {
    event.preventDefault(); // Prevent the form from refreshing the page
    nextStep()
    setEventField('')
  };

  const textStates = []
  const jsonStates = []
  for (let message of messages) {
    const processed = processMessage(message);
    if (processed) {
      let { text_update, state } = processed;
      textStates.push(text_update);
      if (state)
      jsonStates.push(state);
    }
  }

  const scrollToBottom = () => {
    if (eventContainerRef.current) {
      eventContainerRef.current.scrollTop = eventContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [textStates]);

  return (
    <div className="main-container">
      <div className="events-container panel" ref={eventContainerRef}>
        <h1>Simulator</h1>
        {textStates.map((text, i) => <p key={i} className='simulationStep'>{text} </p>)}
      </div>

      <div className="control-container">
        
        <div className="form-container panel">
          <form onSubmit={nextStepButton} className="entry-form">
            <div className='input-forms'>
              <input
                name="prompt"
                value={eventField}
                onChange={handleFormInput}
                className="form-input"
                placeholder=''
              />
            </div>
            <br />
            <button type="submit" className="next-button">Run</button>
          </form>
        </div>
        <div className="state-panel panel">
          {displayState(jsonStates.pop())}
        </div>
      </div>
    </div>
  );
}
