// page.tsx
'use client';

import { Message, useChat } from 'ai/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InfoPanel from './InfoPanel';
import { hash, randomUUID } from 'crypto';


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
    const state_idx = completion.indexOf('# St')
    let text_update = completion.replaceAll('# Update', '');
    if (state_idx >= 0) {
      text_update = text_update.split('# St')[0]
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

function useSimulation(simEvent?: string, timeDelta = 1) {
  const [simTime, setTime] = useState(0);
  const [clientId, setClientId] = useState<string>();
  const [sessionId] = useState<string>(() => crypto.randomUUID());
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
      const newTime = simTime + timeDelta;
      setTime(newTime);
      let prompt = "TIME: " + simTime
      if (simEvent) {
        prompt += '\nEvent: ' + simEvent
      }
      append({ role: "user", content: prompt });
    },
    [simTime, timeDelta, simEvent],
  )

  return { messages, nextStep };
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

  const has_started = textStates.length > 0

  return (
    <div className="main-container">

      <div className="events-container panel" ref={eventContainerRef}>
        <div className="page-title-container">
          <h1 className='page-title'>Simulator</h1>
        </div>
        {textStates.map((text, i) => <p key={i} className='simulationStep'>{text} </p>)}
      </div>

      <div className="control-container">

        <div className="form-container panel">

          <form onSubmit={nextStepButton} className="entry-form">
            {has_started ?
              <>
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
              </>
              : null}
            <button type="submit" className="next-button">{textStates.length > 0 ? "Run" : "Begin"}</button>
          </form>
        </div>
        <InfoPanel stateData={jsonStates} />
      </div>
    </div>
  );
}
