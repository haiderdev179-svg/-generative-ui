// import express from 'express';
// import cors from 'cors';

// const app = express();

// app.use(express.json());
// app.use(cors());

// //Creating end point
// app.get('/', (req, res)=> {
//     res.json({message: 'OK'});
// });

// app.post('/chat', async (req, res)=> {
   
//     //SSE (Server Side Events)
//     //1: Add special header
//         res.writeHead(200, {
//           'Content-Type': 'text/event-stream'    
//         }); 
        
//         setInterval(() => {
//             res.write(`data: ${JSON.stringify({
//                 type: "ai",
//                 payload: {
//                     text: "Happy Coding "
//                 }
//             })}\n\n`);
            
//         }, 1000);

//     //2: Send data in special format
        
//     // res.json({});
// });

// const PORT = process.env.PORT || 4100
// app.listen(PORT, ()=> console.log(`Server is running on http://localhost:${PORT}`));

// ---------------------------------------------------------

import express from 'express';
import cors from 'cors';
import { agent } from './server/agent.ts'; // ← import your compiled agent


const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'OK' });
});

// app.get('/chat-test', (req, res) => {
//     console.log("✅ GET request received");

//     // SSE headers
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');
//     res.setHeader('Access-Control-Allow-Origin', '*');
    
//     console.log("✅ Headers set, starting interval...");

//     let count = 0;
//     const interval = setInterval(() => {
//         const eventData = {
//             type: 'ai',
//             payload: { text: 'Happy Coding ' }
//         };

//         const data = `data: ${JSON.stringify(eventData)}\n\n`;
//         console.log(`✅ Sending chunk ${count + 1}`);
        
//         res.write(data);

//         count++;
//         if (count >= 5) {
//             console.log("✅ Ending stream");
//             clearInterval(interval);
//             res.end();
//         }
//     }, 1000);

//     req.on('close', () => {
//         console.log("⚠️ Client disconnected");
//         clearInterval(interval);
//     });
// });

// app.get('/chat-test', async (req, res) => {
//     console.log("✅ GET request received");

//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');
//     res.setHeader('Access-Control-Allow-Origin', '*');

//     // Infinite stream - runs until client disconnects or refreshes
//     const interval = setInterval(() => {
//         res.write(`data: ${JSON.stringify({
//             type: 'ai',  // ✅ Don't remove this - frontend needs it
//             payload: { text: 'Happy Coding ' }
//         })}\n\n`);
//     }, 1000);

//     req.on('close', () => {
//         console.log("⚠️ Client disconnected - stopping stream");
//         clearInterval(interval);
//     });
// });


app.post('/chat', async (req, res) => {
    const { message, threadId } = req.body;
    console.log("✅ User Message:", message);

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const response = await agent.stream(
            {
                messages: [{ role: "user", content: message }], // ← real user input
            },
            {
                streamMode: ["messages"],
                configurable: { thread_id: threadId ?? "1" },
            }
        );

        for await (const [eventType, chunk] of response) {
            if (eventType === "messages") {
                const content = chunk[0]?.content;
                if (content) {
                    res.write(`data: ${JSON.stringify({
                        type: 'ai',
                        payload: { text: content }
                    })}\n\n`);
                }
            }
        }
    } catch (err) {
        console.error("Agent error:", err);
    } finally {
        res.end(); // ← close the stream when agent is done
    }

    req.on('close', () => {
        console.log("⚠️ Client disconnected");
    });
});

const PORT = 4100;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});