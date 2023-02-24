import ReactDOM from 'react-dom/client'
import React, {useState, useEffect, useRef} from 'react';
import * as esbuild from 'esbuild-wasm'
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

const App = () => {
    const ref = useRef<any>()
    const iframe = useRef<any>()
    const [input, setInput] = useState('')

    const startService = async () => {
        ref.current = await esbuild.startService({
            worker:true,
            wasmURL:'/esbuild.wasm'
        }) 
    }

    useEffect(() => {
        startService()
    }, [])
    
    const onClick = async () => {
        if(!ref.current) return
        iframe.current.srcdoc = html

        const result = await ref.current.build({
           entryPoints:['index.js'],
           bundle:true,
           write:false,
           plugins:[
                    unpkgPathPlugin(),
                    fetchPlugin(input)
                ],
           define:{
            'process.env.NODE_ENV':'"production"',
            global:'window'
           }
        })

        iframe.current.contentWindow.postMessage(result.outputFiles[0].text, '*')
    }

    const html = `
        <html>
            <head>
            </head>
            <body>
                <div id='root'>Hi there</div>
            </body>
            <script>
                window.addEventListener('message', (event) => {
                    try {
                        eval(event.data)
                    } catch(err) {
                        const root = document.querySelector('#root');
                        root.innerHTML='<div style="color:red;"> <h4>Runtime Error</h4>' + err +'</div>'
                        throw err;
                    }
                },false)
            </script>
        </html> 
    `
    return <div>
        <div>
            <textarea value={input} onChange={e => setInput(e.target.value)}></textarea>
        </div>
        <div>
            <button onClick={onClick}>Submit</button>
        </div>
        <iframe ref={iframe} sandbox='allow-scripts' srcDoc={html} title='preview'></iframe>
    </div>
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
