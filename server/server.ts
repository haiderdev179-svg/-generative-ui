import express from 'express';
import cors from 'cors';
import { agent } from './agent.ts'; // ← import your compiled agent
import type { StreamMessage } from './types.ts';
import { initDB } from './db.ts';
const app = express();
const db = initDB(); // CHANGED: no argument needed, in-memory array now
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.json({ message: 'OK' });
});
app.post('/chat', async (req, res) => {
    const { message, threadId } = req.body;
    console.log("✅ User Message:", message);
    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // ✅ Add this - flushes headers immediately so client stays connected
    res.flushHeaders();
    req.on('close', () => {
        console.log("⚠️ Client disconnected");
    });
    try {
        const response = await agent.stream(
            {
                messages: [{ role: "user", content: message }],
            },
            {
                streamMode: ["messages", "custom"],
                configurable: { thread_id: threadId ?? "1" },
            }
        );
        for await (const [eventType, chunk] of response) {
            console.log('eventType: ', eventType);
            let streamMessage: StreamMessage | null = null;
            if (eventType === "custom") {
                console.log('chunk: ', chunk);
                streamMessage = chunk;
            } else if (eventType === 'messages') {
                if (chunk[0].content === '') continue;
                const msgChunk = chunk[0];
                if (msgChunk.type === 'ai' && msgChunk.content) {
                    streamMessage = {
                        type: 'ai',
                        payload: { text: msgChunk.content as string }
                    };
                } else if (msgChunk.type === 'tool') {  // ← was outside 'messages' block
                    streamMessage = {
                        type: 'tool',
                        payload: {
                            name: msgChunk.name!,
                            result: JSON.parse(msgChunk.content as string)
                        }
                    };
                }
            }                                           // ← was missing
            if (streamMessage && Object.keys(streamMessage).length > 0) {
                res.write(`data: ${JSON.stringify(streamMessage)}\n\n`);
            }
        }
    } catch (err) {
        console.error("Agent error:", err);
    } finally {
        res.end();
    };
}); 
app.delete('/expenses/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    res.json({ success: true });
});

const PORT = 4100;
if (!process.env.VERCEL) { // CHANGED: only run app.listen locally, not on Vercel
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app; // CHANGED: added so Vercel can import this as a serverless handler
