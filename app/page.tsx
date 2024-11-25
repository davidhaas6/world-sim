// page.tsx
'use client';

import { Message, useChat } from 'ai/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InfoPanel from './InfoPanel';
import { hash, randomInt, randomUUID } from 'crypto';

import DOMPurify from 'dompurify';

type State = { [key in string]: number }

function unescapeAndSanitize(input: string) {
  const unescaped = input
    .replace(/&lt;b&gt;/g, "<b>")
    .replace(/&lt;\/b&gt;/g, "</b>");

  return DOMPurify.sanitize(unescaped);
}
function getOrCreateClientId() {
  let clientId = window.localStorage.getItem('clientId');
  if (!clientId) {
    clientId = Math.random().toString(36).substr(2) + Date.now().toString(36);
    window.localStorage.setItem('clientId', clientId);
  }
  return clientId;
}


function processMessage(message: Message) {
  if (message.role === 'user') {
    return null;
  } else {
    const completion = message.content;
    const bracket_idx = completion.indexOf('{');
    const state_idx = completion.indexOf('### St')
    let text_update = completion.replaceAll('### Update', '');
    if (state_idx >= 0) {
      text_update = text_update.split('### St')[0]
    }

    let state = null;
    if (bracket_idx >= 0) {
      if (completion.split('{').length == completion.split('}').length) {  // heuristic for json completeness
        const last_bracket = completion.lastIndexOf('}')
        let json_update = completion.substring(bracket_idx, last_bracket + 1)
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


function useSimulation(simEvent?: string, timeDelta?: number) {
  const [simTime, setTime] = useState(0);
  const [clientId, setClientId] = useState<string>();
  const [sessionId] = useState<string>(() => crypto.randomUUID())
  const { messages, append } = useChat({
    onResponse: () => { },
    headers: clientId && sessionId ? {
      'x-client-id': clientId,
      'x-session-id': sessionId
    } : {}
  });

  useEffect(() => {
    const id = getOrCreateClientId();
    setClientId(id);
  }, []);

  const nextStep = useCallback(
    () => {
      console.log("next step called")
      if (simEvent && simEvent.length) {
        timeDelta = 0.001
      }
      else if (timeDelta == null) {
        timeDelta = Math.random();
        if (simTime === 0) {
          timeDelta = 0.0001;
        }
      }
      const newTime = Math.round((simTime + timeDelta) * 10000) / 10000;
      setTime(newTime);
      let prompt = "**Simulation Time**: " + newTime
      if (simEvent) {
        prompt += '\n\n**Event**: ' + simEvent
      }
      console.log("appended event with time", newTime)
      append({ role: "user", content: prompt });
    },
    [simTime, timeDelta, simEvent],
  )

  return { messages, nextStep, simTime };
}

export default function Page() {
  const [eventField, setEventField] = useState<string>('');
  const eventContainerRef = useRef<HTMLDivElement>(null);
  const { messages, nextStep, simTime } = useSimulation(eventField);


  const handleFormInput = (event: any) => {
    setEventField(event.target.value);
  };

  const nextStepButton = (event: any) => {
    event.preventDefault(); // Prevent the form from refreshing the page
    nextStep()
    setEventField('')
  };

  const textStates = []
  const jsonStates: State[] = []
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

  const has_started = textStates.length > 0

  return (
    <div className="main-container">

      <div className="events-container panel" ref={eventContainerRef}>
        <div className="page-title-container">
          <h1 className='page-title'>Simulator</h1>
        </div>
        {textStates.map((text, i) => {

          return (
            <div className='simulation-step' key={'text'+i}>
              {/* <span className='time-label'>Time: </span> */}
              <span className='time-value'>{jsonStates.length > i ? jsonStates[i]['time'] : simTime}
              </span>
              <p
                key={i} className='simulation-step-text'
                dangerouslySetInnerHTML={{ __html: unescapeAndSanitize(text) }}
              />
            </div>
          )
        })}
      </div>

      <div className="control-container">

        <div className="form-container panel">

          <form onSubmit={nextStepButton} className="entry-form">
            {has_started ?
              <>
                <h1 title="The current simulation time">
                  <span className='time-label'>Time: </span>
                  <span className='time-value'>{Math.round(simTime * 1000) / 1000}</span>
                </h1>
                <div className='input-forms' >
                  <input
                    name="prompt"
                    value={eventField}
                    onChange={handleFormInput}
                    className="form-input"
                    placeholder='Event entry'
                    title="Give the simulator a custom event"
                  />
                </div>
                <br />
              </>
              : null}
            <button type="submit" className="next-button" title='Evolve the simulation'>
              {textStates.length > 0 ? "Run" : "Begin"}
              </button>
          </form>
        </div>
        <InfoPanel stateData={jsonStates} />
      </div>
    </div>
  );
}
